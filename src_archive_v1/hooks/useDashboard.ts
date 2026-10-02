import { useMemo } from 'react'
import type { CapabilityLevel, DashboardFilters, FieldSchema, ReviewedItem } from '../types'
import {
  applyFilters,
  computeSummary,
  getLeaderboard,
  getPendingResponses,
  getPendingReview,
} from '../utils/dashboardStats'

export function useDashboard(
  items: ReviewedItem[],
  fields: FieldSchema[],
  filters: DashboardFilters,
  userCapability: CapabilityLevel,
) {
  const filtered = useMemo(() => applyFilters(items, filters), [items, filters])
  const summary = useMemo(() => computeSummary(items, fields, userCapability), [items, fields, userCapability])
  const pendingResponses = useMemo(() => getPendingResponses(filtered), [filtered])
  const pendingReview = useMemo(() => getPendingReview(filtered), [filtered])
  const leaderboard = useMemo(() => getLeaderboard(items), [items])

  return { filtered, summary, pendingResponses, pendingReview, leaderboard }
}
