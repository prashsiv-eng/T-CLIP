import type { CapabilityLevel, DashboardFilters, FieldSchema, ReviewedItem } from '../types'
import { isItemComplete } from './fields'

export interface Summary {
  total: number
  pass: number
  fail: number
  na: number
  pending: number
  completionPercent: number
}

export interface CategoryStat {
  category: string
  pass: number
  fail: number
  na: number
  pending: number
  total: number
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
  const fail = items.filter(i => i.status === 'fail').length
  const na = items.filter(i => i.status === 'na').length
  const pending = items.filter(i => i.status === 'pending').length

  const requiredItems = items.filter(i => i.required)
  const resolvedRequired = requiredItems.filter(i => isItemComplete(i, fields, userCapability)).length
  const completionPercent =
    requiredItems.length === 0 ? 100 : Math.round((resolvedRequired / requiredItems.length) * 100)

  return { total, pass, fail, na, pending, completionPercent }
}

export function getPendingResponses(items: ReviewedItem[]): ReviewedItem[] {
  return items.filter(i => i.history.length === 0)
}

export function getPendingReview(items: ReviewedItem[]): ReviewedItem[] {
  return items.filter(i => i.history.length > 0 && i.confirmedBy === null)
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
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false
    if (filters.role) {
      const roleLower = filters.role.toLowerCase()
      const allRoles = [
        item.assignedTo?.role ?? '',
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
      category: item.category, pass: 0, fail: 0, na: 0, pending: 0, total: 0,
    }
    existing[item.status]++
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
