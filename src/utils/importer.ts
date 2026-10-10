import Papa from 'papaparse'
import readXlsxFile, { type Sheet } from 'read-excel-file/browser'
import type { ChecklistFile, ChecklistItem, FieldSchema, FieldType, ItemStatus, PersonaDefinition } from '../types'
import { STANDARD_PERSONAS } from './capability'

export type ImportMode = 'checklist' | 'template'

export interface ColumnMapping {
  idIndex: number // -1 means auto-generate ID (e.g. ITEM-001)
  categoryIndex: number // -1 means fallback category
  fallbackCategory: string
  descriptionIndex: number
  requiredIndex: number // -1 means use defaultRequired
  defaultRequired: boolean
  statusIndex: number // -1 means use defaultStatus
  defaultStatus: ItemStatus
  assigneeIndex: number // -1 means unassigned
  customFieldIndices: {
    columnIndex: number
    fieldId: string
    label: string
    type: FieldType
    include: boolean
  }[]
}

export interface ParsedSpreadsheet {
  fileName: string
  sheetNames: string[]
  activeSheet: string
  rows: string[][]
}

export interface EditableImportRow {
  rowId: string
  id: string
  category: string
  description: string
  required: boolean
  status: ItemStatus
  assignedTo?: { role?: string; name?: string }
  customValues: Record<string, string>
  isExcluded: boolean
}

export interface BuildChecklistFileOptions {
  mode: ImportMode
  project: string
  version: string
  branch?: string
  rows: EditableImportRow[]
  customFields?: {
    id: string
    label: string
    type: FieldType
    options?: string[]
  }[]
  roles?: string[]
  personas?: PersonaDefinition[]
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) return val.toISOString().split('T')[0]
  return String(val).trim()
}

/**
 * Parses a CSV, TSV, or Excel (.xlsx, .xls) file into a uniform 2D array representation per sheet.
 */
export async function parseSpreadsheetFile(file: File | Blob, fileName: string): Promise<{
  sheetNames: string[]
  sheets: Record<string, string[][]>
  getSheetRows: (sheetName: string) => string[][]
}> {
  const lowerName = fileName.toLowerCase()

  if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || lowerName.endsWith('.txt')) {
    const text = await file.text()
    const result = Papa.parse<string[]>(text, {
      skipEmptyLines: 'greedy',
    })

    const rows = result.data.map(row => row.map(cell => (cell ?? '').trim()))
    const defaultSheetName = 'Sheet 1'

    return {
      sheetNames: [defaultSheetName],
      sheets: { [defaultSheetName]: rows },
      getSheetRows: () => rows,
    }
  }

  // Otherwise assume XLSX / XLS
  const rawSheets = (await readXlsxFile(file)) as unknown as Sheet[]

  if (!rawSheets || rawSheets.length === 0) {
    throw new Error('No sheets found in spreadsheet')
  }

  const sheetNames = rawSheets.map(s => s.sheet || 'Sheet 1')
  const sheetsRecord: Record<string, string[][]> = {}

  for (const s of rawSheets) {
    const sheetName = s.sheet || 'Sheet 1'
    const rows = (s.data || []).map(row => row.map(cell => formatCellValue(cell)))
    sheetsRecord[sheetName] = rows
  }

  return {
    sheetNames,
    sheets: sheetsRecord,
    getSheetRows: (sheetName: string) => sheetsRecord[sheetName] || [],
  }
}

/**
 * Detects the most probable header row index (0-indexed).
 * If row 0 is blank or has only 1 populated cell while row 1 has 3+ populated cells, row 1 is likely the header.
 */
export function detectHeaderRow(rows: string[][]): number {
  if (rows.length === 0) return 0
  if (rows.length === 1) return 0

  const countNonEmpty = (row: string[] = []) => row.filter(c => c && c.trim().length > 0).length

  const row0Count = countNonEmpty(rows[0])
  const row1Count = countNonEmpty(rows[1])

  if (row0Count <= 1 && row1Count >= 3) {
    return 1
  }

  return 0
}

/**
 * Cleanly normalizes a header string into a safe field ID.
 */
export function sanitizeFieldId(header: string, fallback = 'field'): string {
  const clean = header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return clean || fallback
}

/**
 * Guess the field type based on the column name.
 */
export function guessFieldType(header: string): FieldType {
  const h = header.toLowerCase()
  if (/url|link|pr|href|repo|artifact/i.test(h)) return 'url'
  if (/date|timestamp|day|time/i.test(h)) return 'date'
  if (/notes|comment|rationale|details|summary|remarks|description/i.test(h)) return 'textarea'
  if (/bool|flag|confirmed|verified/i.test(h)) return 'boolean'
  return 'text'
}

/**
 * Automatically inspects header strings and returns best-guess column mappings.
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  let idIndex = -1
  let categoryIndex = -1
  let descriptionIndex = -1
  let requiredIndex = -1
  let statusIndex = -1
  let assigneeIndex = -1

  const matchedIndices = new Set<number>()

  // 1. Match ID
  const idRegex = /(^|\b)(id|item[\s_-]*(id|#|no)|control[\s_-]*(id|#|no)|req[\s_-]*(id|#|no)|ref[\s_-]*(id|#|no)?|reference|code|rule[\s_-]*id)(\b|$)|(^#$)/i
  idIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && idRegex.test(h.trim()))
  if (idIndex !== -1) matchedIndices.add(idIndex)

  // 2. Match Category
  const catRegex = /(^|\b)(category|domain|section|chapter|family|area|group|function|topic|pillar)(\b|$)/i
  categoryIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && catRegex.test(h.trim()))
  if (categoryIndex !== -1) matchedIndices.add(categoryIndex)

  // 3. Match Description
  const descRegex = /(^|\b)(description|requirement|control[\s_-]*(text|desc|description|title)?|statement|details|specification|guidance)(\b|$)/i
  descriptionIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && descRegex.test(h.trim()))
  if (descriptionIndex !== -1) matchedIndices.add(descriptionIndex)

  // 4. Match Required / Mandatory
  const reqRegex = /(^|\b)(required|mandatory|must|essential|critical|req|level|obligatory|severity)(\b|$)/i
  requiredIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && reqRegex.test(h.trim()))
  if (requiredIndex !== -1) matchedIndices.add(requiredIndex)

  // 5. Match Status
  const statusRegex = /(^|\b)(status|state|result|evaluation|verdict|finding|assessment|compliance|disposition)(\b|$)/i
  statusIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && statusRegex.test(h.trim()))
  if (statusIndex !== -1) matchedIndices.add(statusIndex)

  // 6. Match Assignee
  const assignRegex = /(^|\b)(assigned[\s_-]*to|assignee|owner|role|responsible|lead|auditor|reviewer)(\b|$)/i
  assigneeIndex = headers.findIndex((h, i) => !matchedIndices.has(i) && assignRegex.test(h.trim()))
  if (assigneeIndex !== -1) matchedIndices.add(assigneeIndex)

  // Fallback: if description wasn't found, find first text-like unassigned column
  if (descriptionIndex === -1 && headers.length > 0) {
    const fallbackDesc = headers.findIndex((_, i) => !matchedIndices.has(i))
    if (fallbackDesc !== -1) {
      descriptionIndex = fallbackDesc
      matchedIndices.add(fallbackDesc)
    }
  }

  // Collect unmapped columns as custom candidate fields
  const customFieldIndices = headers
    .map((header, index) => {
      if (matchedIndices.has(index) || !header.trim()) return null
      return {
        columnIndex: index,
        fieldId: sanitizeFieldId(header, `field_${index}`),
        label: header.trim(),
        type: guessFieldType(header),
        include: true,
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)

  return {
    idIndex,
    categoryIndex,
    fallbackCategory: 'General',
    descriptionIndex,
    requiredIndex,
    defaultRequired: true,
    statusIndex,
    defaultStatus: 'not-started',
    assigneeIndex,
    customFieldIndices,
  }
}

/**
 * Normalizes freeform status strings into T-CLIP ItemStatus.
 */
export function normalizeStatus(raw: string, defaultStatus: ItemStatus = 'not-started'): ItemStatus {
  if (!raw) return defaultStatus
  const clean = raw.trim().toLowerCase()

  if (['pass', 'passed', 'compliant', 'met', 'yes', 'y', 'ok', 'satisfactory', 'conform', 'conforming'].includes(clean)) {
    return 'pass'
  }
  if (['fail', 'failed', 'non-compliant', 'not met', 'no', 'n', 'open', 'defect', 'unsatisfactory', 'non-conform'].includes(clean)) {
    return 'failed'
  }
  if (['na', 'n/a', 'not applicable', 'excluded', 'exempt', 'out of scope', 'not relevant', 'none'].includes(clean)) {
    return 'na'
  }
  if (['in-progress', 'in progress', 'wip', 'working', 'underway', 'ongoing'].includes(clean)) {
    return 'in-progress'
  }
  if (['blocked', 'hold', 'on hold', 'waiting'].includes(clean)) {
    return 'blocked'
  }
  if (['in-review', 'in review', 'under review', 'pending review', 'review'].includes(clean)) {
    return 'in-review'
  }
  if (['not-started', 'not started', 'pending', 'todo', 'to do', 'untested', 'new'].includes(clean)) {
    return 'not-started'
  }

  return defaultStatus
}

/**
 * Normalizes freeform required / mandatory strings into boolean.
 */
export function normalizeRequired(raw: string, defaultRequired = true): boolean {
  if (!raw) return defaultRequired
  const clean = raw.trim().toLowerCase()
  if (['yes', 'true', '1', 'y', 'mandatory', 'req', 'required', 'must', 'l1', 'l2', 'l3', 'critical', 'high'].includes(clean)) {
    return true
  }
  if (['no', 'false', '0', 'n', 'optional', 'nice-to-have', 'low'].includes(clean)) {
    return false
  }
  return defaultRequired
}

export interface SheetInput {
  name: string
  rows: string[][]
  headerRowIndex?: number
}

/**
 * Converts raw spreadsheet rows from one or multiple sheets into editable rows.
 */
export function buildEditableRowsFromSheets(
  sheets: SheetInput[],
  mapping: ColumnMapping,
  mode: ImportMode,
  options?: {
    useSheetNameAsCategoryIfBlank?: boolean
  }
): EditableImportRow[] {
  const result: EditableImportRow[] = []
  let globalRowCounter = 0

  sheets.forEach((sheet, sheetIdx) => {
    const headerRow = sheet.headerRowIndex ?? 0
    const dataRows = sheet.rows.slice(headerRow + 1)

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      // Skip empty rows
      const hasData = row.some(c => c && c.trim().length > 0)
      if (!hasData) continue

      globalRowCounter++
      const rawId = mapping.idIndex >= 0 ? (row[mapping.idIndex] || '').trim() : ''
      const id = rawId || `ITEM-${String(globalRowCounter).padStart(3, '0')}`

      const rawCat = mapping.categoryIndex >= 0 ? (row[mapping.categoryIndex] || '').trim() : ''
      let category = rawCat
      if (!category) {
        if (options?.useSheetNameAsCategoryIfBlank && sheet.name && (sheet.name !== 'Sheet 1' || sheets.length > 1)) {
          category = sheet.name
        } else {
          category = mapping.fallbackCategory || 'General'
        }
      }

      const description = mapping.descriptionIndex >= 0 ? (row[mapping.descriptionIndex] || '').trim() : ''

      const rawReq = mapping.requiredIndex >= 0 ? (row[mapping.requiredIndex] || '').trim() : ''
      const required = mapping.requiredIndex >= 0 ? normalizeRequired(rawReq, mapping.defaultRequired) : mapping.defaultRequired

      let status: ItemStatus = 'not-started'
      if (mode === 'checklist') {
        const rawStatus = mapping.statusIndex >= 0 ? (row[mapping.statusIndex] || '').trim() : ''
        status = mapping.statusIndex >= 0 ? normalizeStatus(rawStatus, mapping.defaultStatus) : mapping.defaultStatus
      }

      const rawAssignee = mapping.assigneeIndex >= 0 ? (row[mapping.assigneeIndex] || '').trim() : ''
      const assignedTo = rawAssignee ? { role: rawAssignee } : undefined

      const customValues: Record<string, string> = {}
      for (const field of mapping.customFieldIndices) {
        if (field.include && field.columnIndex < row.length) {
          const val = (row[field.columnIndex] || '').trim()
          if (val) {
            customValues[field.fieldId] = val
          }
        }
      }

      result.push({
        rowId: `row-${sheetIdx}-${i}-${globalRowCounter}`,
        id,
        category,
        description,
        required,
        status,
        assignedTo,
        customValues,
        isExcluded: false,
      })
    }
  })

  return result
}

/**
 * Converts raw spreadsheet rows into editable rows based on column mapping and import mode.
 */
export function buildEditableRows(
  rows: string[][],
  headerRowIndex: number,
  mapping: ColumnMapping,
  mode: ImportMode
): EditableImportRow[] {
  return buildEditableRowsFromSheets(
    [{ name: 'Sheet 1', rows, headerRowIndex }],
    mapping,
    mode
  )
}

/**
 * Builds and validates a final ChecklistFile from the edited rows and configuration.
 */
export function buildChecklistFile(options: BuildChecklistFileOptions): ChecklistFile {
  const { mode, project, version, branch = 'main', rows, customFields = [], roles, personas } = options

  const activeRows = rows.filter(r => !r.isExcluded)

  // Track unique IDs to avoid duplicates
  const seenIds = new Set<string>()
  const items: ChecklistItem[] = []

  activeRows.forEach((r, idx) => {
    let finalId = r.id.trim() || `ITEM-${String(idx + 1).padStart(3, '0')}`
    if (seenIds.has(finalId)) {
      let suffix = 2
      while (seenIds.has(`${finalId}_${suffix}`)) {
        suffix++
      }
      finalId = `${finalId}_${suffix}`
    }
    seenIds.add(finalId)

    const item: ChecklistItem = {
      id: finalId,
      category: r.category.trim() || 'General',
      description: r.description.trim() || `Requirement ${finalId}`,
      required: r.required,
      status: mode === 'template' ? 'not-started' : r.status,
      statusEditableBy: 'reviewer',
      assignedTo: r.assignedTo?.role ? { role: r.assignedTo.role } : undefined,
      values: Object.keys(r.customValues).length > 0 ? { ...r.customValues } : undefined,
    }

    items.push(item)
  })

  // Build FieldSchema array for custom fields
  const fields: FieldSchema[] = customFields.map(f => ({
    id: f.id,
    label: f.label,
    type: f.type,
    options: f.options,
    editableBy: 'editor',
    visibleTo: 'read-only',
  }))

  // Extract distinct roles from items if not provided
  const inferredRoles = new Set<string>(roles || ['Security Reviewer', 'Lead Developer', 'Tech Lead'])
  items.forEach(item => {
    if (item.assignedTo?.role) inferredRoles.add(item.assignedTo.role)
  })

  const checklistFile: ChecklistFile = {
    version: version || '1.0',
    project: project || '',
    branch,
    rules: {
      structureEditableBy: 'master',
      enforcedAssignment: false,
    },
    roles: Array.from(inferredRoles),
    personas: personas && personas.length > 0 ? personas : STANDARD_PERSONAS,
    users: [],
    fields,
    items,
  }

  return checklistFile
}
