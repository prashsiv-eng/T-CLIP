import { describe, expect, it } from 'vitest'
import type { ChecklistItem, FieldSchema, ReviewedItem } from '../../types'
import { fieldTypeToInputType, getRequiredFieldIds, isItemComplete, resolveItemFields } from '../../utils/fields'

const ALL_FIELDS: FieldSchema[] = [
  { id: 'evidence', label: 'Evidence', type: 'textarea', requiredWhen: ['fail'] },
  { id: 'justification', label: 'Justification', type: 'textarea', requiredWhen: ['fail', 'na'] },
  { id: 'comment', label: 'Comment', type: 'textarea' },
]

const BASE_ITEM: ChecklistItem = {
  id: 'SEC-001',
  category: 'Security',
  description: 'Test',
  status: 'pending',
  required: true,
}

function makeReviewed(overrides: Partial<ReviewedItem> = {}): ReviewedItem {
  return {
    ...BASE_ITEM,
    history: [],
    confirmedBy: null,
    ...overrides,
  }
}

describe('resolveItemFields', () => {
  it('returns all fields when item has no fields override', () => {
    expect(resolveItemFields(BASE_ITEM, ALL_FIELDS)).toEqual(ALL_FIELDS)
  })

  it('returns subset in declared order when item.fields is set', () => {
    const item: ChecklistItem = { ...BASE_ITEM, fields: ['justification', 'comment'] }
    const result = resolveItemFields(item, ALL_FIELDS)
    expect(result.map(f => f.id)).toEqual(['justification', 'comment'])
  })

  it('skips unknown ids silently', () => {
    const item: ChecklistItem = { ...BASE_ITEM, fields: ['evidence', 'nonexistent'] }
    const result = resolveItemFields(item, ALL_FIELDS)
    expect(result.map(f => f.id)).toEqual(['evidence'])
  })

  it('returns all fields when fields array is empty', () => {
    const item: ChecklistItem = { ...BASE_ITEM, fields: [] }
    expect(resolveItemFields(item, ALL_FIELDS)).toEqual(ALL_FIELDS)
  })
})

describe('getRequiredFieldIds', () => {
  it('returns fields required for fail status', () => {
    expect(getRequiredFieldIds(ALL_FIELDS, 'fail')).toEqual(['evidence', 'justification'])
  })

  it('returns fields required for na status', () => {
    expect(getRequiredFieldIds(ALL_FIELDS, 'na')).toEqual(['justification'])
  })

  it('returns empty for pass (no fields require pass)', () => {
    expect(getRequiredFieldIds(ALL_FIELDS, 'pass')).toEqual([])
  })

  it('returns empty for pending', () => {
    expect(getRequiredFieldIds(ALL_FIELDS, 'pending')).toEqual([])
  })
})

describe('isItemComplete', () => {
  it('returns false when status is pending', () => {
    const item = makeReviewed({ status: 'pending' })
    expect(isItemComplete(item, ALL_FIELDS, 'reviewer')).toBe(false)
  })

  it('returns true for pass with no required fields', () => {
    const item = makeReviewed({
      status: 'pass',
      history: [{ actorName: 'Alice', role: 'Reviewer', status: 'pass', fieldValues: {}, timestamp: '' }],
    })
    expect(isItemComplete(item, ALL_FIELDS, 'reviewer')).toBe(true)
  })

  it('returns false for fail when evidence is missing', () => {
    const item = makeReviewed({
      status: 'fail',
      history: [{ actorName: 'Alice', role: 'Reviewer', status: 'fail', fieldValues: { justification: 'bad' }, timestamp: '' }],
    })
    expect(isItemComplete(item, ALL_FIELDS, 'reviewer')).toBe(false)
  })

  it('returns true for fail when all required fields filled', () => {
    const item = makeReviewed({
      status: 'fail',
      history: [{ actorName: 'Alice', role: 'Reviewer', status: 'fail', fieldValues: { evidence: 'scan.pdf', justification: 'critical finding' }, timestamp: '' }],
    })
    expect(isItemComplete(item, ALL_FIELDS, 'reviewer')).toBe(true)
  })

  it('observer below visibleTo threshold is excluded from required check', () => {
    const restrictedFields: FieldSchema[] = [
      { id: 'secret', label: 'Secret', type: 'textarea', requiredWhen: ['fail'], visibleTo: 'approver' },
    ]
    const item = makeReviewed({
      status: 'fail',
      history: [{ actorName: 'Alice', role: 'Observer', status: 'fail', fieldValues: {}, timestamp: '' }],
    })
    // observer cannot see 'secret' so it's not required for them
    expect(isItemComplete(item, restrictedFields, 'observer')).toBe(true)
  })
})

describe('fieldTypeToInputType', () => {
  it('maps known types correctly', () => {
    expect(fieldTypeToInputType('text')).toBe('text')
    expect(fieldTypeToInputType('url')).toBe('url')
    expect(fieldTypeToInputType('boolean')).toBe('checkbox')
    expect(fieldTypeToInputType('date')).toBe('date')
    expect(fieldTypeToInputType('select')).toBe('select')
    expect(fieldTypeToInputType('textarea')).toBe('textarea')
  })

  it('falls back to textarea for unknown types', () => {
    expect(fieldTypeToInputType('unknown_future_type')).toBe('textarea')
  })
})
