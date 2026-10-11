import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import type { ChecklistFile, FieldSchema, ReviewedItem, SignoffRecord } from '../../types'
import {
  buildAttestation,
  buildExportTableData,
  formatStatusLabel,
  generateAttestationCSV,
  generateAttestationExcelBlob,
  generateChecklistCSV,
  generateChecklistExcelBlob,
  generateExportFileName,
} from '../../utils/export'

const FIELDS: FieldSchema[] = [
  { id: 'evidence', label: 'Evidence Link', type: 'url' },
  { id: 'notes', label: 'Implementation Notes', type: 'text' },
]

const FILE: ChecklistFile = {
  version: '1.0',
  project: 'SecurePlatform',
  branch: 'main',
  fields: FIELDS,
  items: [],
}

const ITEMS: ReviewedItem[] = [
  {
    id: 'SEC-001',
    category: 'Authentication',
    description: 'Verify password complexity requirements.',
    status: 'pass',
    required: true,
    assignedTo: { role: 'Security Reviewer', name: 'Alice' },
    history: [
      {
        actorName: 'Bob Dev',
        role: 'Developer',
        status: 'in-review',
        fieldValues: { evidence: 'https://github.com/pull/12', notes: 'Implemented regex' },
        timestamp: '2026-10-10T10:00:00.000Z',
      },
      {
        actorName: 'Alice Sec',
        role: 'Security Reviewer',
        status: 'pass',
        fieldValues: { evidence: 'https://github.com/pull/12', notes: 'Validated in staging' },
        notes: 'Passed all tests',
        timestamp: '2026-10-10T12:00:00.000Z',
      },
    ],
    confirmedBy: {
      actorName: 'Charlie Lead',
      role: 'Lead Architect',
      status: 'pass',
      timestamp: '2026-10-10T14:00:00.000Z',
    },
  },
  {
    id: 'SEC-002',
    category: 'Cryptography',
    description: 'Verify AES-256 is used for encryption at rest.',
    status: 'failed',
    required: false,
    values: { evidence: 'DES found in legacy module' },
    history: [
      {
        actorName: 'Alice Sec',
        role: 'Security Reviewer',
        status: 'failed',
        notes: 'Needs remediation',
        timestamp: '2026-10-10T15:00:00.000Z',
      },
    ],
    confirmedBy: null,
  },
]

describe('formatStatusLabel', () => {
  it('converts statuses to human readable labels', () => {
    expect(formatStatusLabel('not-started')).toBe('Not Started')
    expect(formatStatusLabel('in-progress')).toBe('In Progress')
    expect(formatStatusLabel('blocked')).toBe('Blocked')
    expect(formatStatusLabel('in-review')).toBe('In Review')
    expect(formatStatusLabel('pass')).toBe('Pass')
    expect(formatStatusLabel('failed')).toBe('Failed')
    expect(formatStatusLabel('na')).toBe('N/A')
  })
})

describe('generateExportFileName', () => {
  it('creates safe filename strings with correct extensions', () => {
    expect(generateExportFileName('My App / Test', '2.0.1', 'csv')).toBe('my_app___test-2.0.1.csv')
    expect(generateExportFileName('My App', '1.0', 'xlsx', 'attestation')).toBe('my_app-attestation-1.0.xlsx')
    expect(generateExportFileName('', '', 'json')).toBe('checklist-1.0.json')
  })
})

describe('buildAttestation', () => {
  it('produces an attestation with correct shape', () => {
    const att = buildAttestation(FILE, ITEMS, 'deadbeef')
    expect(att.schemaVersion).toBe('1.0')
    expect(att.project).toBe('SecurePlatform')
    expect(att.branch).toBe('main')
    expect(att.checklistVersion).toBe('1.0')
    expect(att.sourceFileHash).toBe('deadbeef')
    expect(att.items).toHaveLength(2)
    expect(att.items[0].id).toBe('SEC-001')
  })

  it('sets branch to null when file has no branch', () => {
    const { branch: _b, ...nobranchFile } = FILE
    const att = buildAttestation(nobranchFile as ChecklistFile, [], 'hash')
    expect(att.branch).toBeNull()
  })

  it('sets exportedAt to a valid ISO 8601 string', () => {
    const att = buildAttestation(FILE, [], 'hash')
    expect(() => new Date(att.exportedAt)).not.toThrow()
    expect(new Date(att.exportedAt).toISOString()).toBe(att.exportedAt)
  })
})

describe('buildExportTableData & generateChecklistCSV', () => {
  it('builds table headers including custom fields and audit columns', () => {
    const data = buildExportTableData(ITEMS, FIELDS)
    expect(data.headers).toContain('ID')
    expect(data.headers).toContain('Category')
    expect(data.headers).toContain('Description')
    expect(data.headers).toContain('Required')
    expect(data.headers).toContain('Status')
    expect(data.headers).toContain('Evidence Link')
    expect(data.headers).toContain('Implementation Notes')
    expect(data.headers).toContain('Last Updated By')
    expect(data.headers).toContain('Last Updated Role')
    expect(data.headers).toContain('Review Notes')
    expect(data.headers).toContain('Confirmed By')
  })

  it('populates row data accurately from item state and history', () => {
    const data = buildExportTableData(ITEMS, FIELDS)
    expect(data.rows).toHaveLength(2)

    const row1 = data.rows[0]
    expect(row1[0]).toBe('SEC-001')
    expect(row1[1]).toBe('Authentication')
    expect(row1[3]).toBe('Yes') // Required
    expect(row1[4]).toBe('Pass') // Status
    expect(row1[5]).toBe('Security Reviewer')
    expect(row1[6]).toBe('Alice')
    expect(row1[7]).toBe('https://github.com/pull/12') // Evidence
    expect(row1[8]).toBe('Validated in staging') // Notes custom field
    expect(row1[9]).toBe('Alice Sec') // Last updated by
    expect(row1[10]).toBe('Security Reviewer') // Last role
    expect(row1[12]).toBe('Passed all tests') // Review notes
    expect(row1[13]).toBe('Charlie Lead (Lead Architect)') // Confirmed by

    const row2 = data.rows[1]
    expect(row2[0]).toBe('SEC-002')
    expect(row2[3]).toBe('No') // Not required
    expect(row2[4]).toBe('Failed')
    expect(row2[7]).toBe('DES found in legacy module') // Falls back to item.values
    expect(row2[13]).toBe('') // Not confirmed
  })

  it('generates valid parseable CSV using Papa.unparse', () => {
    const csv = generateChecklistCSV(ITEMS, FIELDS)
    expect(csv).toContain('SEC-001')
    expect(csv).toContain('Authentication')
    expect(csv).toContain('Passed all tests')

    const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: true })
    expect(parsed.data.length).toBe(3) // 1 header + 2 rows
    expect(parsed.data[0][0]).toBe('ID')
    expect(parsed.data[1][0]).toBe('SEC-001')
    expect(parsed.data[2][0]).toBe('SEC-002')
  })
})

describe('generateChecklistExcelBlob', () => {
  it('generates a binary Excel blob', async () => {
    const blob = await generateChecklistExcelBlob(ITEMS, FIELDS, 'Controls')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
  })
})

describe('generateAttestationCSV & generateAttestationExcelBlob', () => {
  const signoff: SignoffRecord = {
    signerName: 'Dana CISO',
    role: 'Chief Information Security Officer',
    statement: 'Release is approved for production.',
    timestamp: '2026-10-10T18:00:00.000Z',
    hash: 'fe98a72c4d6',
  }

  it('generates attestation CSV with summary header metadata', () => {
    const csv = generateAttestationCSV(FILE, ITEMS, 'sourcehash123', signoff)
    expect(csv).toContain('Project')
    expect(csv).toContain('SecurePlatform')
    expect(csv).toContain('Dana CISO')
    expect(csv).toContain('fe98a72c4d6')
    expect(csv).toContain('SEC-001')
    expect(csv).toContain('SEC-002')
  })

  it('generates multi-sheet attestation Excel blob', async () => {
    const blob = await generateAttestationExcelBlob(FILE, ITEMS, 'sourcehash123', signoff)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(2000)
  })
})
