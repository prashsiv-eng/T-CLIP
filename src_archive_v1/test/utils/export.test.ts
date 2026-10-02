import { describe, expect, it } from 'vitest'
import type { ChecklistFile, ReviewedItem } from '../../types'
import { buildAttestation } from '../../utils/export'

const FILE: ChecklistFile = {
  version: '1.0',
  project: 'MyApp',
  branch: 'pre-dev',
  fields: [],
  items: [],
}

const ITEM: ReviewedItem = {
  id: 'SEC-001',
  category: 'Security',
  description: 'Test',
  status: 'pass',
  required: true,
  history: [],
  confirmedBy: null,
}

describe('buildAttestation', () => {
  it('produces an attestation with correct shape', () => {
    const att = buildAttestation(FILE, [ITEM], 'deadbeef')
    expect(att.schemaVersion).toBe('1.0')
    expect(att.project).toBe('MyApp')
    expect(att.branch).toBe('pre-dev')
    expect(att.checklistVersion).toBe('1.0')
    expect(att.sourceFileHash).toBe('deadbeef')
    expect(att.items).toHaveLength(1)
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
