import type { CapabilityLevel, DashboardFilters, FieldSchema, ReviewedItem } from '../types'
import { isItemComplete } from './fields'

export interface Summary {
  total: number
  pass: number
  failed: number
  na: number
  notStarted: number
  inProgress: number
  blocked: number
  inReview: number
  completionPercent: number
  fail: number
  pending: number
}

export interface CategoryStat {
  category: string
  pass: number
  failed: number
  na: number
  notStarted: number
  inProgress: number
  blocked: number
  inReview: number
  total: number
  fail: number
  pending: number
}

export interface ActivityPoint {
  /** ISO date string YYYY-MM-DD */
  date: string
  actionsCount: number
}

export interface LeaderboardEntry {
  actorName: string
  role: string
  outstandingCount: number
}

export function computeSummary(
  items: ReviewedItem[],
  fields: FieldSchema[],
  userCapability: CapabilityLevel,
): Summary {
  const total = items.length
  const pass = items.filter(i => i.status === 'pass').length
  const failed = items.filter(i => i.status === 'failed' || (i.status as string) === 'fail').length
  const na = items.filter(i => i.status === 'na').length
  const notStarted = items.filter(i => i.status === 'not-started' || (i.status as string) === 'pending').length
  const inProgress = items.filter(i => i.status === 'in-progress').length
  const blocked = items.filter(i => i.status === 'blocked').length
  const inReview = items.filter(i => i.status === 'in-review').length

  const requiredItems = items.filter(i => i.required)
  const resolvedRequired = requiredItems.filter(i => isItemComplete(i, fields, userCapability)).length
  const completionPercent =
    requiredItems.length === 0 ? 100 : Math.round((resolvedRequired / requiredItems.length) * 100)

  return {
    total,
    pass,
    failed,
    na,
    notStarted,
    inProgress,
    blocked,
    inReview,
    completionPercent,
    fail: failed,
    pending: notStarted + inProgress + blocked + inReview,
  }
}

export function getPendingResponses(items: ReviewedItem[]): ReviewedItem[] {
  return items.filter(i => i.status === 'not-started' || (i.status as string) === 'pending' || i.history.length === 0)
}

export function getPendingReview(items: ReviewedItem[]): ReviewedItem[] {
  return items.filter(i => i.status === 'in-review')
}

export function getLeaderboard(items: ReviewedItem[]): LeaderboardEntry[] {
  const counts = new Map<string, LeaderboardEntry>()

  for (const item of getPendingReview(items)) {
    const lastAction = item.history[item.history.length - 1]
    if (!lastAction) continue
    const key = `${lastAction.actorName}|||${lastAction.role}`
    const existing = counts.get(key)
    if (existing) {
      existing.outstandingCount++
    } else {
      counts.set(key, {
        actorName: lastAction.actorName,
        role: lastAction.role,
        outstandingCount: 1,
      })
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.outstandingCount - a.outstandingCount)
}

export function applyFilters(items: ReviewedItem[], filters: DashboardFilters): ReviewedItem[] {
  return items.filter(item => {
    if (filters.status !== 'all') {
      if (filters.status === 'failed') {
        if (item.status !== 'failed' && (item.status as string) !== 'fail') return false
      } else if (filters.status === 'not-started') {
        if (item.status && item.status !== 'not-started' && (item.status as string) !== 'pending') return false
      } else if (item.status !== filters.status) {
        return false
      }
    }
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false
    if (filters.role) {
      const roleLower = filters.role.toLowerCase()
      const allRoles = [
        item.assignedTo?.role ?? '',
        item.confirmedBy?.role ?? '',
        ...item.history.map(a => a.role),
      ]
      const matches = allRoles.some(r => r.toLowerCase().includes(roleLower))
      if (!matches) return false
    }
    if (filters.requiredOnly && !item.required) return false
    return true
  })
}

export function getCategoryStats(items: ReviewedItem[]): CategoryStat[] {
  const map = new Map<string, CategoryStat>()
  for (const item of items) {
    const existing = map.get(item.category) ?? {
      category: item.category,
      pass: 0,
      failed: 0,
      na: 0,
      notStarted: 0,
      inProgress: 0,
      blocked: 0,
      inReview: 0,
      total: 0,
      fail: 0,
      pending: 0,
    }
    const st = item.status as string
    if (st === 'pass') existing.pass++
    else if (st === 'failed' || st === 'fail') { existing.failed++; existing.fail++ }
    else if (st === 'na') existing.na++
    else if (st === 'not-started' || st === 'pending') { existing.notStarted++; existing.pending++ }
    else if (st === 'in-progress') { existing.inProgress++; existing.pending++ }
    else if (st === 'blocked') { existing.blocked++; existing.pending++ }
    else if (st === 'in-review') { existing.inReview++; existing.pending++ }
    existing.total++
    map.set(item.category, existing)
  }
  return Array.from(map.values())
}

export function getActivityTimeline(items: ReviewedItem[], days = 14): ActivityPoint[] {
  const counts = new Map<string, number>()

  // Seed all days with 0
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - d)
    counts.set(dt.toISOString().slice(0, 10), 0)
  }

  for (const item of items) {
    for (const action of item.history) {
      const day = action.timestamp.slice(0, 10)
      if (counts.has(day)) {
        counts.set(day, (counts.get(day) ?? 0) + 1)
      }
    }
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, actionsCount]) => ({ date, actionsCount }))
}
