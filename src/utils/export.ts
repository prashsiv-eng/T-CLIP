import Papa from 'papaparse'
import writeXlsxFile from 'write-excel-file/browser'
import type {
  Attestation,
  ChecklistFile,
  ChecklistItem,
  FieldSchema,
  ReviewedItem,
  SignoffRecord,
} from '../types'

export interface ExportTableData {
  headers: string[]
  rows: (string | number | boolean)[][]
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'not-started':
      return 'Not Started'
    case 'in-progress':
      return 'In Progress'
    case 'blocked':
      return 'Blocked'
    case 'in-review':
      return 'In Review'
    case 'pass':
      return 'Pass'
    case 'failed':
      return 'Failed'
    case 'na':
      return 'N/A'
    default:
      return status || 'Not Started'
  }
}

export function generateExportFileName(
  project: string,
  version: string,
  ext: 'json' | 'csv' | 'xlsx',
  suffix?: string
): string {
  const safeProject = project ? project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'
  const safeVersion = version ? version.replace(/[^a-z0-9._-]/g, '_') : '1.0'
  const middle = suffix ? `-${suffix}` : ''
  return `${safeProject}${middle}-${safeVersion}.${ext}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  downloadBlob(new Blob([json], { type: 'application/json' }), filename)
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Prepend UTF-8 BOM (\uFEFF) to guarantee correct Unicode rendering in Microsoft Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

export function buildAttestation(
  file: ChecklistFile,
  reviewedItems: ReviewedItem[],
  fileHash: string,
  signoff?: SignoffRecord
): Attestation {
  return {
    schemaVersion: '1.0',
    project: file.project,
    branch: file.branch ?? null,
    checklistVersion: file.version,
    sourceFileHash: fileHash,
    exportedAt: new Date().toISOString(),
    signoff,
    items: reviewedItems,
  }
}

export function exportAttestation(
  file: ChecklistFile,
  reviewedItems: ReviewedItem[],
  fileHash: string,
  signoff?: SignoffRecord
): void {
  const attestation = buildAttestation(file, reviewedItems, fileHash, signoff)
  downloadJSON(attestation, 'checklist-attestation.json')
}

export function exportChecklistJSON(file: ChecklistFile): void {
  downloadJSON(file, 'checklist.json')
}

/**
 * Builds standard 2D headers and cell rows for checklist items.
 */
export function buildExportTableData(
  items: (ChecklistItem | ReviewedItem)[],
  fields: FieldSchema[] = []
): ExportTableData {
  const customFieldHeaders = fields.map(f => f.label || f.id)
  const headers = [
    'ID',
    'Category',
    'Description',
    'Required',
    'Status',
    'Assigned Role',
    'Assigned Name',
    ...customFieldHeaders,
    'Last Updated By',
    'Last Updated Role',
    'Last Updated At',
    'Review Notes',
    'Confirmed By',
  ]

  const rows = items.map(item => {
    const reviewed = item as ReviewedItem
    const lastAction =
      reviewed.history && reviewed.history.length > 0
        ? reviewed.history[reviewed.history.length - 1]
        : undefined

    const customValues = fields.map(f => {
      const fromAction = lastAction?.fieldValues?.[f.id]
      const fromItem = item.values?.[f.id]
      const val = fromAction !== undefined && fromAction !== '' ? fromAction : fromItem ?? ''
      return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)
    })

    const confirmedByText = reviewed.confirmedBy
      ? `${reviewed.confirmedBy.actorName} (${reviewed.confirmedBy.role})`
      : ''

    return [
      item.id,
      item.category,
      item.description,
      item.required ? 'Yes' : 'No',
      formatStatusLabel(item.status),
      item.assignedTo?.role ?? '',
      item.assignedTo?.name ?? '',
      ...customValues,
      lastAction?.actorName ?? '',
      lastAction?.role ?? '',
      lastAction?.timestamp ? new Date(lastAction.timestamp).toISOString() : '',
      lastAction?.notes ?? '',
      confirmedByText,
    ]
  })

  return { headers, rows }
}

/**
 * Generates CSV string from checklist items using Papa.unparse.
 */
export function generateChecklistCSV(
  items: (ChecklistItem | ReviewedItem)[],
  fields: FieldSchema[] = []
): string {
  const { headers, rows } = buildExportTableData(items, fields)
  return Papa.unparse({
    fields: headers,
    data: rows,
  })
}

/**
 * Exports checklist items to a CSV file.
 */
export function exportChecklistCSV(
  items: (ChecklistItem | ReviewedItem)[],
  fields: FieldSchema[] = [],
  filename = 'checklist.csv'
): void {
  const csv = generateChecklistCSV(items, fields)
  downloadCSV(csv, filename)
}

/**
 * Generates an Excel Blob for checklist items with styled header and column widths.
 */
export async function generateChecklistExcelBlob(
  items: (ChecklistItem | ReviewedItem)[],
  fields: FieldSchema[] = [],
  sheetName = 'Checklist'
): Promise<Blob> {
  const { headers, rows } = buildExportTableData(items, fields)

  const headerRow = headers.map(h => ({
    value: h,
    fontWeight: 'bold' as const,
    backgroundColor: '#E2E8F0',
  }))

  const dataRows = rows.map(r =>
    r.map(cell => ({
      value: String(cell ?? ''),
    }))
  )

  const sheetData = [headerRow, ...dataRows]

  const columns = headers.map(h => {
    if (h === 'Description') return { width: 45 }
    if (h === 'Review Notes') return { width: 35 }
    if (h === 'Category') return { width: 22 }
    if (h === 'Last Updated At') return { width: 22 }
    return { width: Math.max(12, h.length + 3) }
  })

  const file = await writeXlsxFile(sheetData, {
    sheet: sheetName,
    columns,
  })

  return file.toBlob()
}

/**
 * Exports checklist items to an Excel (.xlsx) file.
 */
export async function exportChecklistExcel(
  items: (ChecklistItem | ReviewedItem)[],
  fields: FieldSchema[] = [],
  filename = 'checklist.xlsx'
): Promise<void> {
  const blob = await generateChecklistExcelBlob(items, fields)
  downloadBlob(blob, filename)
}

/**
 * Generates CSV string for an attestation with sign-off metadata header.
 */
export function generateAttestationCSV(
  file: ChecklistFile,
  items: ReviewedItem[],
  fileHash?: string,
  signoff?: SignoffRecord
): string {
  const activeSignoff = signoff ?? file.attestation?.signoff
  const metaRows: [string, string][] = [
    ['Project', file.project || ''],
    ['Checklist Version', file.version || '1.0'],
    ['Branch', file.branch ?? ''],
    ['Checklist Source SHA-256', fileHash || file.attestation?.sourceFileHash || ''],
    ['Exported At', new Date().toISOString()],
    ['Sign-off Signer', activeSignoff?.signerName ?? 'Unsigned'],
    ['Sign-off Role', activeSignoff?.role ?? ''],
    ['Sign-off Statement', activeSignoff?.statement ?? ''],
    ['Sign-off Hash', activeSignoff?.hash ?? ''],
    ['Sign-off Timestamp', activeSignoff?.timestamp ?? ''],
  ]

  const metaCSV = Papa.unparse(metaRows, { header: false })
  const tableCSV = generateChecklistCSV(items, file.fields)

  return `${metaCSV}\n\n${tableCSV}`
}

/**
 * Exports attestation report to a CSV file.
 */
export function exportAttestationCSV(
  file: ChecklistFile,
  items: ReviewedItem[],
  fileHash?: string,
  signoff?: SignoffRecord,
  filename = 'checklist-attestation.csv'
): void {
  const csv = generateAttestationCSV(file, items, fileHash, signoff)
  downloadCSV(csv, filename)
}

/**
 * Generates a multi-sheet Excel Blob for an official attestation report.
 */
export async function generateAttestationExcelBlob(
  file: ChecklistFile,
  items: ReviewedItem[],
  fileHash?: string,
  signoff?: SignoffRecord
): Promise<Blob> {
  const activeSignoff = signoff ?? file.attestation?.signoff
  const passCount = items.filter(i => i.status === 'pass').length
  const failCount = items.filter(i => i.status === 'failed' || (i.status as string) === 'fail').length
  const naCount = items.filter(i => i.status === 'na').length
  const inReviewCount = items.filter(i => i.status === 'in-review').length
  const otherCount = items.length - passCount - failCount - naCount - inReviewCount

  // Sheet 1: Summary & Sign-off Details
  const summaryHeaderRow = [
    { value: 'Attestation Property', fontWeight: 'bold' as const, backgroundColor: '#0F172A', color: '#FFFFFF' },
    { value: 'Value', fontWeight: 'bold' as const, backgroundColor: '#0F172A', color: '#FFFFFF' },
  ]

  const summaryDataRows = [
    [{ value: 'Project' }, { value: file.project }],
    [{ value: 'Checklist Version' }, { value: file.version }],
    [{ value: 'Branch' }, { value: file.branch ?? 'N/A' }],
    [{ value: 'Source File SHA-256' }, { value: fileHash || file.attestation?.sourceFileHash || 'N/A' }],
    [{ value: 'Attestation Exported At' }, { value: new Date().toISOString() }],
    [{ value: '' }, { value: '' }],
    [{ value: 'Sign-off Status', fontWeight: 'bold' as const }, { value: activeSignoff ? 'CERTIFIED & SIGNED' : 'PREVIEW / UNSIGNED' }],
    [{ value: 'Signer Name' }, { value: activeSignoff?.signerName ?? 'N/A' }],
    [{ value: 'Signer Role' }, { value: activeSignoff?.role ?? 'N/A' }],
    [{ value: 'Sign-off Statement' }, { value: activeSignoff?.statement ?? 'N/A' }],
    [{ value: 'Sign-off SHA-256 Hash' }, { value: activeSignoff?.hash ?? 'N/A' }],
    [{ value: 'Signed Timestamp' }, { value: activeSignoff?.timestamp ?? 'N/A' }],
    [{ value: '' }, { value: '' }],
    [{ value: 'Compliance Metrics', fontWeight: 'bold' as const }, { value: '' }],
    [{ value: 'Total Verification Controls' }, { value: String(items.length) }],
    [{ value: 'Passed Controls' }, { value: String(passCount) }],
    [{ value: 'Failed Controls' }, { value: String(failCount) }],
    [{ value: 'Not Applicable (N/A)' }, { value: String(naCount) }],
    [{ value: 'In Review' }, { value: String(inReviewCount) }],
    [{ value: 'Other / In-Progress' }, { value: String(otherCount) }],
  ]

  const summarySheetData = [summaryHeaderRow, ...summaryDataRows]

  // Sheet 2: Controls Table
  const { headers, rows } = buildExportTableData(items, file.fields)
  const controlsHeaderRow = headers.map(h => ({
    value: h,
    fontWeight: 'bold' as const,
    backgroundColor: '#E2E8F0',
  }))

  const controlsDataRows = rows.map(r =>
    r.map(cell => ({
      value: String(cell ?? ''),
    }))
  )

  const controlsSheetData = [controlsHeaderRow, ...controlsDataRows]

  const controlColumns = headers.map(h => {
    if (h === 'Description') return { width: 45 }
    if (h === 'Review Notes') return { width: 35 }
    if (h === 'Category') return { width: 22 }
    if (h === 'Last Updated At') return { width: 22 }
    return { width: Math.max(12, h.length + 3) }
  })

  const resultFile = await writeXlsxFile([
    {
      data: summarySheetData,
      sheet: 'Sign-off Summary',
      columns: [{ width: 26 }, { width: 65 }],
    },
    {
      data: controlsSheetData,
      sheet: 'Verified Controls',
      columns: controlColumns,
    },
  ])

  return resultFile.toBlob()
}

/**
 * Exports official attestation workbook to Excel (.xlsx).
 */
export async function exportAttestationExcel(
  file: ChecklistFile,
  items: ReviewedItem[],
  fileHash?: string,
  signoff?: SignoffRecord,
  filename = 'checklist-attestation.xlsx'
): Promise<void> {
  const blob = await generateAttestationExcelBlob(file, items, fileHash, signoff)
  downloadBlob(blob, filename)
}
