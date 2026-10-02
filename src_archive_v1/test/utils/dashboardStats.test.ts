import { describe, expect, it } from 'vitest'
import type { DashboardFilters, FieldSchema, ReviewedItem } from '../../types'
import { applyFilters, computeSummary, getLeaderboard, getPendingResponses, getPendingReview } from '../../utils/dashboardStats'

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
  makeItem({ id: '2', status: 'fail', history: [{ actorName: 'Bob', role: 'Reviewer', status: 'fail', fieldValues: {}, timestamp: '' }], confirmedBy: null }),
  makeItem({ id: '3', status: 'na', history: [{ actorName: 'Alice', role: 'Reviewer', status: 'na', fieldValues: {}, timestamp: '' }], confirmedBy: null }),
  makeItem({ id: '4', status: 'pending', history: [] }),
  makeItem({ id: '5', status: 'pass', required: false, history: [{ actorName: 'Alice', role: 'Reviewer', status: 'pass', fieldValues: {}, timestamp: '' }], confirmedBy: { actorName: 'Carol', role: 'Approver', status: 'pass', fieldValues: {}, timestamp: '' } }),
]

describe('computeSummary', () => {
  it('counts statuses correctly', () => {
    const s = computeSummary(ITEMS, FIELDS, 'reviewer')
    expect(s.total).toBe(5)
    expect(s.pass).toBe(2)
    expect(s.fail).toBe(1)
    expect(s.na).toBe(1)
    expect(s.pending).toBe(1)
  })

  it('computes completion percent for required items', () => {
    // required items: 1(pass),2(fail),3(na),4(pending) = 4; all with history = 3 complete
    const s = computeSummary(ITEMS, FIELDS, 'reviewer')
    expect(s.completionPercent).toBe(75) // 3/4
  })
})

describe('getPendingResponses', () => {
  it('returns items with empty history', () => {
    const result = getPendingResponses(ITEMS)
    expect(result.map(i => i.id)).toEqual(['4'])
  })
})

describe('getPendingReview', () => {
  it('returns items with history but no confirmation', () => {
    const result = getPendingReview(ITEMS)
    // Items 1,2,3 have history and no confirmedBy
    expect(result.map(i => i.id).sort()).toEqual(['1', '2', '3'])
  })
})

describe('getLeaderboard', () => {
  it('ranks actors by outstanding item count descending', () => {
    const result = getLeaderboard(ITEMS)
    // Alice: items 1,3 = 2 outstanding; Bob: item 2 = 1 outstanding
    expect(result[0].actorName).toBe('Alice')
    expect(result[0].outstandingCount).toBe(2)
    expect(result[1].actorName).toBe('Bob')
    expect(result[1].outstandingCount).toBe(1)
  })
})

describe('applyFilters', () => {
  const DEFAULT_FILTERS: DashboardFilters = { status: 'all', categories: [], role: '', requiredOnly: false }

  it('returns all items with default filters', () => {
    expect(applyFilters(ITEMS, DEFAULT_FILTERS)).toHaveLength(5)
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
    // Only item 5 has an actor with 'Approver' role (via confirmedBy... but leaderboard uses history)
    // item 5 has confirmedBy with role Approver but history has role Reviewer
    // assignedTo also checked — none set, so matches via history Reviewer only
    // 'approver' substring won't match 'Reviewer', so 0 results
    expect(result).toHaveLength(0)
  })

  it('filters required only', () => {
    const result = applyFilters(ITEMS, { ...DEFAULT_FILTERS, requiredOnly: true })
    expect(result.every(i => i.required)).toBe(true)
    expect(result).toHaveLength(4)
  })
})
