import type { ChecklistFile, FieldType, ItemStatus } from '../types'
import { normalizeCapability } from '../utils/capability'

const VALID_STATUSES: ItemStatus[] = ['pending', 'pass', 'fail', 'na']
const VALID_FIELD_TYPES: FieldType[] = ['text', 'textarea', 'select', 'url', 'boolean', 'date']

export interface ValidationResult {
  valid: boolean
  errors: string[]
  file?: ChecklistFile
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function validateChecklistFile(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (!isObject(raw)) {
    return { valid: false, errors: ['File must be a JSON object'] }
  }

  // Top-level required keys
  for (const key of ['version', 'project', 'fields', 'items'] as const) {
    if (!(key in raw)) errors.push(`Missing required top-level key: "${key}"`)
  }

  if (errors.length > 0) return { valid: false, errors }

  if (typeof raw.version !== 'string') errors.push('"version" must be a string')
  if (typeof raw.project !== 'string') errors.push('"project" must be a string')
  if (raw.branch !== undefined && typeof raw.branch !== 'string')
    errors.push('"branch" must be a string when present')

  // Validate rules if present
  if (raw.rules !== undefined && isObject(raw.rules)) {
    if (raw.rules.structureEditableBy) {
      const norm = typeof raw.rules.structureEditableBy === 'string' ? normalizeCapability(raw.rules.structureEditableBy) : null
      if (norm) {
        raw.rules.structureEditableBy = norm
      }
    }
  }

  // Validate roles if present
  if (raw.roles !== undefined) {
    if (!Array.isArray(raw.roles) || !raw.roles.every(r => typeof r === 'string')) {
      errors.push('"roles" must be an array of strings when present')
    }
  }

  // Validate users if present
  if (raw.users !== undefined) {
    if (!Array.isArray(raw.users)) {
      errors.push('"users" must be an array when present')
    } else {
      raw.users.forEach((u: unknown, i: number) => {
        if (!isObject(u) || typeof u.name !== 'string' || typeof u.role !== 'string') {
          errors.push(`users[${i}] must be an object with "name" and "role" strings`)
        }
      })
    }
  }

  // Validate fields array
  if (!Array.isArray(raw.fields)) {
    errors.push('"fields" must be an array')
  } else {
    raw.fields.forEach((f: unknown, i: number) => {
      if (!isObject(f)) { errors.push(`fields[${i}] must be an object`); return }
      if (typeof f.id !== 'string') errors.push(`fields[${i}].id must be a string`)
      if (typeof f.label !== 'string') errors.push(`fields[${i}].label must be a string`)
      if (!VALID_FIELD_TYPES.includes(f.type as FieldType)) {
        // Unknown types are allowed (fall back to textarea) — just warn, not error
      }
      if (f.editableBy) {
        const norm = typeof f.editableBy === 'string' ? normalizeCapability(f.editableBy) : null
        if (!norm) {
          errors.push(`fields[${i}].editableBy has unknown capability "${f.editableBy}"`)
        } else {
          f.editableBy = norm
        }
      }
      if (f.visibleTo) {
        const norm = typeof f.visibleTo === 'string' ? normalizeCapability(f.visibleTo) : null
        if (!norm) {
          errors.push(`fields[${i}].visibleTo has unknown capability "${f.visibleTo}"`)
        } else {
          f.visibleTo = norm
        }
      }
    })
  }

  // Validate items array
  if (!Array.isArray(raw.items)) {
    errors.push('"items" must be an array')
  } else {
    if (raw.items.length === 0) {
      // Valid but noteworthy — not an error per REQ-13
    }
    raw.items.forEach((item: unknown, i: number) => {
      if (!isObject(item)) { errors.push(`items[${i}] must be an object`); return }
      for (const key of ['id', 'category', 'description'] as const) {
        if (typeof item[key] !== 'string')
          errors.push(`items[${i}].${key} must be a string`)
      }
      if (typeof item.required !== 'boolean')
        errors.push(`items[${i}].required must be a boolean`)
      if (!VALID_STATUSES.includes(item.status as ItemStatus))
        errors.push(`items[${i}].status "${item.status}" is not valid (must be pending|pass|fail|na)`)
      if (item.statusEditableBy) {
        const norm = typeof item.statusEditableBy === 'string' ? normalizeCapability(item.statusEditableBy) : null
        if (norm) {
          item.statusEditableBy = norm
        }
      }
    })
  }

  if (errors.length > 0) return { valid: false, errors }

  return { valid: true, errors: [], file: raw as unknown as ChecklistFile }
}
