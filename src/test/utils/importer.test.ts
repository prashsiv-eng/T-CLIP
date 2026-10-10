import { describe, expect, it } from 'vitest'
import {
  buildChecklistFile,
  buildEditableRows,
  buildEditableRowsFromSheets,
  detectColumnMapping,
  detectHeaderRow,
  normalizeRequired,
  normalizeStatus,
  parseSpreadsheetFile,
} from '../../utils/importer'
import { validateChecklistFile } from '../../schema/validate'

describe('importer utility', () => {
  describe('detectHeaderRow', () => {
    it('returns 0 when row 0 contains standard headers', () => {
      const rows = [
        ['ID', 'Category', 'Description', 'Status'],
        ['SEC-1', 'Auth', 'MFA required', 'pass'],
      ]
      expect(detectHeaderRow(rows)).toBe(0)
    })

    it('returns 1 when row 0 is a title banner and row 1 has multiple headers', () => {
      const rows = [
        ['Payment Security Review Spreadsheet', '', ''],
        ['ID', 'Category', 'Description', 'Status'],
        ['SEC-1', 'Auth', 'MFA required', 'pass'],
      ]
      expect(detectHeaderRow(rows)).toBe(1)
    })
  })

  describe('detectColumnMapping', () => {
    it('auto-detects standard column headers accurately', () => {
      const headers = ['Control ID', 'Security Domain', 'Requirement Statement', 'Mandatory', 'Audit Status', 'Lead Owner', 'CWE ID']
      const mapping = detectColumnMapping(headers)

      expect(mapping.idIndex).toBe(0)
      expect(mapping.categoryIndex).toBe(1)
      expect(mapping.descriptionIndex).toBe(2)
      expect(mapping.requiredIndex).toBe(3)
      expect(mapping.statusIndex).toBe(4)
      expect(mapping.assigneeIndex).toBe(5)
      expect(mapping.customFieldIndices).toHaveLength(1)
      expect(mapping.customFieldIndices[0].label).toBe('CWE ID')
      expect(mapping.customFieldIndices[0].fieldId).toBe('cwe_id')
    })

    it('handles sheets with minimal headers (ID, Description)', () => {
      const headers = ['Ref #', 'Requirement']
      const mapping = detectColumnMapping(headers)

      expect(mapping.idIndex).toBe(0)
      expect(mapping.descriptionIndex).toBe(1)
      expect(mapping.categoryIndex).toBe(-1)
      expect(mapping.fallbackCategory).toBe('General')
    })
  })

  describe('normalizeStatus', () => {
    it('normalizes common pass synonyms', () => {
      expect(normalizeStatus('Pass')).toBe('pass')
      expect(normalizeStatus('PASSED')).toBe('pass')
      expect(normalizeStatus('Compliant')).toBe('pass')
      expect(normalizeStatus('Met')).toBe('pass')
    })

    it('normalizes common fail synonyms', () => {
      expect(normalizeStatus('Fail')).toBe('failed')
      expect(normalizeStatus('FAILED')).toBe('failed')
      expect(normalizeStatus('Non-Compliant')).toBe('failed')
      expect(normalizeStatus('Open')).toBe('failed')
    })

    it('normalizes N/A, in-progress, blocked, in-review', () => {
      expect(normalizeStatus('N/A')).toBe('na')
      expect(normalizeStatus('Not Applicable')).toBe('na')
      expect(normalizeStatus('WIP')).toBe('in-progress')
      expect(normalizeStatus('Blocked')).toBe('blocked')
      expect(normalizeStatus('In Review')).toBe('in-review')
    })

    it('falls back to defaultStatus for unknown/blank strings', () => {
      expect(normalizeStatus('', 'not-started')).toBe('not-started')
      expect(normalizeStatus('Pending', 'not-started')).toBe('not-started')
      expect(normalizeStatus('something random', 'not-started')).toBe('not-started')
    })
  })

  describe('normalizeRequired', () => {
    it('normalizes truthy strings', () => {
      expect(normalizeRequired('Yes')).toBe(true)
      expect(normalizeRequired('True')).toBe(true)
      expect(normalizeRequired('1')).toBe(true)
      expect(normalizeRequired('Mandatory')).toBe(true)
      expect(normalizeRequired('L1')).toBe(true)
    })

    it('normalizes falsy strings', () => {
      expect(normalizeRequired('No')).toBe(false)
      expect(normalizeRequired('False')).toBe(false)
      expect(normalizeRequired('0')).toBe(false)
      expect(normalizeRequired('Optional')).toBe(false)
    })
  })

  describe('buildEditableRows', () => {
    const rawRows = [
      ['ID', 'Domain', 'Requirement', 'Status', 'Notes'],
      ['AUTH-01', 'Authentication', 'Enforce MFA on admin portal', 'Pass', 'Verified in PR #101'],
      ['AUTH-02', 'Authentication', 'Session timeout after 15 mins', 'Failed', 'Ticket SEC-99 opened'],
      ['DATA-01', 'Data Protection', 'AES-256 for data at rest', 'N/A', 'Ephemeral container only'],
    ]

    it('preserves statuses and notes in "checklist" mode', () => {
      const mapping = detectColumnMapping(rawRows[0])
      const rows = buildEditableRows(rawRows, 0, mapping, 'checklist')

      expect(rows).toHaveLength(3)
      expect(rows[0].id).toBe('AUTH-01')
      expect(rows[0].category).toBe('Authentication')
      expect(rows[0].status).toBe('pass')
      expect(rows[0].customValues.notes).toBe('Verified in PR #101')

      expect(rows[1].id).toBe('AUTH-02')
      expect(rows[1].status).toBe('failed')
      expect(rows[1].customValues.notes).toBe('Ticket SEC-99 opened')

      expect(rows[2].status).toBe('na')
    })

    it('resets all statuses to "not-started" in "template" mode', () => {
      const mapping = detectColumnMapping(rawRows[0])
      const rows = buildEditableRows(rawRows, 0, mapping, 'template')

      expect(rows).toHaveLength(3)
      expect(rows[0].status).toBe('not-started')
      expect(rows[1].status).toBe('not-started')
      expect(rows[2].status).toBe('not-started')
      // Custom values like guidance/notes are still preserved
      expect(rows[0].customValues.notes).toBe('Verified in PR #101')
    })

    it('combines multiple sheets and uses sheet name as category when category column is missing', () => {
      const sheet1 = {
        name: 'Access Control',
        rows: [
          ['ID', 'Requirement'],
          ['AC-01', 'Enforce least privilege'],
        ],
        headerRowIndex: 0,
      }
      const sheet2 = {
        name: 'Cryptography',
        rows: [
          ['ID', 'Requirement'],
          ['CR-01', 'Rotate master keys annually'],
        ],
        headerRowIndex: 0,
      }

      const mapping = detectColumnMapping(sheet1.rows[0])
      const rows = buildEditableRowsFromSheets([sheet1, sheet2], mapping, 'template', {
        useSheetNameAsCategoryIfBlank: true,
      })

      expect(rows).toHaveLength(2)
      expect(rows[0].id).toBe('AC-01')
      expect(rows[0].category).toBe('Access Control')
      expect(rows[1].id).toBe('CR-01')
      expect(rows[1].category).toBe('Cryptography')
    })
  })

  describe('buildChecklistFile & validateChecklistFile integration', () => {
    it('produces a fully valid ChecklistFile that passes schema validation', () => {
      const rawRows = [
        ['ID', 'Domain', 'Requirement', 'Status', 'Evidence Link'],
        ['C1', 'Network', 'Firewall rules restricted', 'Pass', 'https://github.com/rules'],
        ['C2', 'Network', 'TLS 1.3 enforced', 'Pass', ''],
      ]
      const mapping = detectColumnMapping(rawRows[0])
      const rows = buildEditableRows(rawRows, 0, mapping, 'checklist')

      const customFields = mapping.customFieldIndices.map(c => ({
        id: c.fieldId,
        label: c.label,
        type: c.type,
      }))

      const file = buildChecklistFile({
        mode: 'checklist',
        project: 'Cloud Infrastructure Audit',
        version: '1.2',
        branch: 'main',
        rows,
        customFields,
      })

      expect(file.project).toBe('Cloud Infrastructure Audit')
      expect(file.version).toBe('1.2')
      expect(file.items).toHaveLength(2)
      expect(file.items[0].id).toBe('C1')
      expect(file.items[0].status).toBe('pass')
      expect(file.items[0].values?.evidence_link).toBe('https://github.com/rules')

      const validation = validateChecklistFile(file)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('handles duplicate IDs gracefully by de-duplicating', () => {
      const rows = [
        {
          rowId: '1',
          id: 'DUP-1',
          category: 'Cat',
          description: 'Desc 1',
          required: true,
          status: 'not-started' as const,
          customValues: {},
          isExcluded: false,
        },
        {
          rowId: '2',
          id: 'DUP-1',
          category: 'Cat',
          description: 'Desc 2',
          required: true,
          status: 'not-started' as const,
          customValues: {},
          isExcluded: false,
        },
      ]

      const file = buildChecklistFile({
        mode: 'template',
        project: 'Test',
        version: '1.0',
        rows,
      })

      expect(file.items[0].id).toBe('DUP-1')
      expect(file.items[1].id).toBe('DUP-1_2')
    })
  })

  describe('parseSpreadsheetFile with CSV Blob', () => {
    it('parses CSV text into 2D array', async () => {
      const csvContent = 'ID,Category,Description\nSEC-1,Crypto,Salted Passwords\nSEC-2,Crypto,Key Rotation'
      const blob = new Blob([csvContent], { type: 'text/csv' })

      const result = await parseSpreadsheetFile(blob, 'security.csv')
      expect(result.sheetNames).toEqual(['Sheet 1'])
      const rows = result.getSheetRows('Sheet 1')
      expect(rows).toHaveLength(3)
      expect(rows[0]).toEqual(['ID', 'Category', 'Description'])
      expect(rows[1]).toEqual(['SEC-1', 'Crypto', 'Salted Passwords'])
    })
  })
})
