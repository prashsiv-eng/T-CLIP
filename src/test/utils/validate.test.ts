import { describe, expect, it } from 'vitest'
import { validateChecklistFile } from '../../schema/validate'

const VALID_FILE = {
  version: '1.0',
  project: 'TestApp',
  fields: [{ id: 'evidence', label: 'Evidence', type: 'textarea' }],
  items: [
    { id: 'SEC-001', category: 'Security', description: 'SAST scan', status: 'pending', required: true },
  ],
}

describe('validateChecklistFile', () => {
  it('accepts a valid minimal file', () => {
    const result = validateChecklistFile(VALID_FILE)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.file).toBeDefined()
  })

  it('rejects non-object input', () => {
    expect(validateChecklistFile('string')).toMatchObject({ valid: false })
    expect(validateChecklistFile(null)).toMatchObject({ valid: false })
    expect(validateChecklistFile(42)).toMatchObject({ valid: false })
  })

  it('rejects file missing required top-level keys', () => {
    const { project: _p, ...noProject } = VALID_FILE
    const result = validateChecklistFile(noProject)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('"project"'))).toBe(true)
  })

  it('rejects invalid item status', () => {
    const file = {
      ...VALID_FILE,
      items: [{ ...VALID_FILE.items[0], status: 'maybe' }],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('status'))).toBe(true)
  })

  it('ignores unknown extra properties', () => {
    const file = { ...VALID_FILE, unknownProp: true, items: [{ ...VALID_FILE.items[0], extraField: 'x' }] }
    expect(validateChecklistFile(file).valid).toBe(true)
  })

  it('rejects items array that is not an array', () => {
    const file = { ...VALID_FILE, items: 'not-an-array' }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
  })

  it('accepts a file with zero items (valid but empty)', () => {
    const file = { ...VALID_FILE, items: [] }
    expect(validateChecklistFile(file).valid).toBe(true)
  })

  it('rejects item missing description', () => {
    const file = {
      ...VALID_FILE,
      items: [{ id: 'X-001', category: 'X', status: 'pending', required: true }],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('description'))).toBe(true)
  })

  it('accepts valid roles and users sections', () => {
    const file = {
      ...VALID_FILE,
      roles: ['QA Engineer', 'Security Lead'],
      users: [
        { name: 'Alice Chen', role: 'QA Engineer' },
        { name: 'Bob Smith', role: 'Security Lead' },
      ],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(true)
    expect(result.file?.roles).toEqual(['QA Engineer', 'Security Lead'])
    expect(result.file?.users).toHaveLength(2)
  })

  it('rejects roles if not an array of strings', () => {
    const file = {
      ...VALID_FILE,
      roles: ['QA Engineer', 123],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('roles'))).toBe(true)
  })

  it('rejects users if user object is invalid', () => {
    const file = {
      ...VALID_FILE,
      users: [{ name: 'Alice' }], // missing role
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('users'))).toBe(true)
  })

  it('accepts and normalizes "full" capability alias in fields', () => {
    const file = {
      ...VALID_FILE,
      fields: [
        { id: 'f1', label: 'Field 1', type: 'text', editableBy: 'full', visibleTo: 'full' },
        { id: 'f2', label: 'Field 2', type: 'text', editableBy: 'read', visibleTo: 'write' },
      ],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.file?.fields[0].editableBy).toBe('editor')
    expect(result.file?.fields[0].visibleTo).toBe('editor')
    expect(result.file?.fields[1].editableBy).toBe('observer')
    expect(result.file?.fields[1].visibleTo).toBe('contributor')
  })

  it('rejects completely invalid capability string', () => {
    const file = {
      ...VALID_FILE,
      fields: [{ id: 'f1', label: 'Field 1', type: 'text', editableBy: 'superman' }],
    }
    const result = validateChecklistFile(file)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('superman'))).toBe(true)
  })
})
