import { describe, expect, it } from 'vitest'
import type { DashboardFilters, FieldSchema, ReviewedItem } from '../../types'
import {
  applyFilters,
  computeSummary,
  getLeaderboard,
  getPendingResponses,
  getPendingReview,
} from '../../utils/dashboardStats'

function makeItem(overrides: Partial<ReviewedItem> & Pick<ReviewedItem, 'id' | 'status'>): ReviewedItem {
  return {
    category: 'Security',
    description: 'Test',
    required: true,
    history: [],
    confirmedBy: null,
    ...overrides,
  }
}

const FIELDS: FieldSchema[] = []

const ITEMS: ReviewedItem[] = [
  makeItem({ id: '1', status: 'pass', history: [{ actorName: 'Alice', role: 'Reviewer', status: 'pass', fieldValues: {}, timestamp: '' }], confirmedBy: null }),
  makeItem({ id: '2', status: 'failed', history: [{ actorName: 'Bob', role: 'Reviewer', status: 'failed', fieldValues: {}, timestamp: '' }], confirmedBy: null }),
  makeItem({ id: '3', status: 'na', history: [{ actorName: 'Alice', role: 'Reviewer', status: 'na', fieldValues: {}, timestamp: '' }], confirmedBy: null }),
  makeItem({ id: '4', status: 'not-started', history: [] }),
  makeItem({ id: '5', status: 'in-review', history: [{ actorName: 'Alice', role: 'Developer', status: 'in-review', fieldValues: {}, timestamp: '' }] }),
  makeItem({ id: '6', status: 'pass', required: false, history: [{ actorName: 'Alice', role: 'Reviewer', status: 'pass', fieldValues: {}, timestamp: '' }], confirmedBy: { actorName: 'Carol', role: 'Approver', status: 'pass', fieldValues: {}, timestamp: '' } }),
]

describe('computeSummary', () => {
  it('counts statuses correctly', () => {
    const s = computeSummary(ITEMS, FIELDS, 'reviewer')
    expect(s.total).toBe(6)
    expect(s.pass).toBe(2)
    expect(s.failed).toBe(1)
    expect(s.na).toBe(1)
    expect(s.notStarted).toBe(1)
    expect(s.inReview).toBe(1)
  })

  it('computes completion percent for required items', () => {
    // required items: 1(pass), 2(failed), 3(na), 4(not-started), 5(in-review) = 5 items
    // resolved items: 1(pass), 2(failed), 3(na) = 3 complete
    const s = computeSummary(ITEMS, FIELDS, 'reviewer')
    expect(s.completionPercent).toBe(60) // 3/5
  })
})

describe('getPendingResponses', () => {
  it('returns items with not-started or empty history', () => {
    const result = getPendingResponses(ITEMS)
    expect(result.map(i => i.id)).toEqual(['4'])
  })
})

describe('getPendingReview', () => {
  it('returns items with in-review status', () => {
    const result = getPendingReview(ITEMS)
    expect(result.map(i => i.id)).toEqual(['5'])
  })
})

describe('getLeaderboard', () => {
  it('ranks submitters for items currently in review', () => {
    const result = getLeaderboard(ITEMS)
    expect(result).toHaveLength(1)
    expect(result[0].actorName).toBe('Alice')
    expect(result[0].role).toBe('Developer')
    expect(result[0].outstandingCount).toBe(1)
  })
})

describe('applyFilters', () => {
  const DEFAULT_FILTERS: DashboardFilters = { status: 'all', categories: [], role: '', requiredOnly: false }

  it('returns all items with default filters', () => {
    expect(applyFilters(ITEMS, DEFAULT_FILTERS)).toHaveLength(6)
  })

  it('filters by status', () => {
    const result = applyFilters(ITEMS, { ...DEFAULT_FILTERS, status: 'pass' })
    expect(result.every(i => i.status === 'pass')).toBe(true)
  })

  it('filters by category', () => {
    const items = [
      makeItem({ id: 'a', status: 'pass', category: 'GxP', history: [] }),
      makeItem({ id: 'b', status: 'pass', category: 'Security', history: [] }),
    ]
    const result = applyFilters(items, { ...DEFAULT_FILTERS, categories: ['GxP'] })
    expect(result.map(i => i.id)).toEqual(['a'])
  })

  it('filters by role substring', () => {
    const result = applyFilters(ITEMS, { ...DEFAULT_FILTERS, role: 'approver' })
    expect(result.map(i => i.id)).toEqual(['6'])
  })

  it('filters by requiredOnly', () => {
    const result = applyFilters(ITEMS, { ...DEFAULT_FILTERS, requiredOnly: true })
    expect(result.every(i => i.required)).toBe(true)
    expect(result).toHaveLength(5)
  })
})
