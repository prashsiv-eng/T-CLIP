import { Box, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { useMemo } from 'react'
import type { CapabilityLevel, DashboardFilters, FieldSchema, ReviewedItem } from '../../types'
import { useDashboard } from '../../hooks/useDashboard'
import { getCategoryStats, getActivityTimeline } from '../../utils/dashboardStats'
import { ActionItemLeaderboard } from './ActionItemLeaderboard'
import { ActivitySparkline } from './ActivitySparkline'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { DashboardFiltersPanel } from './DashboardFilters'
import { DonutChart } from './DonutChart'
import { PendingResponsesList } from './PendingResponsesList'
import { PendingReviewList } from './PendingReviewList'
import { SummaryCards } from './SummaryCards'

interface Props {
  items: ReviewedItem[]; fields: FieldSchema[]; filters: DashboardFilters
  userCapability: CapabilityLevel; onFiltersChange: (f: DashboardFilters) => void
}

function Panel({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <Card elevation={0}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{title}</Typography>
            {badge !== undefined && badge > 0 && (
              <Box sx={{ fontSize: 10, fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', px: 0.75, py: 0.125, borderRadius: 10 }}>
                {badge}
              </Box>
            )}
          </Box>
        }
        sx={{ pb: 0, pt: 1.5, px: 2 }}
      />
      <CardContent sx={{ pt: 1 }}>{children}</CardContent>
    </Card>
  )
}

export function DashboardView({ items, fields, filters, userCapability, onFiltersChange }: Props) {
  const { filtered, summary, pendingResponses, pendingReview } = useDashboard(items, fields, filters, userCapability)
  const categoryStats = useMemo(() => getCategoryStats(filtered), [filtered])
  const activityTimeline = useMemo(() => getActivityTimeline(filtered, 14), [filtered])

  const isFiltered = filters.status !== 'all' || filters.categories.length > 0 || filters.role !== '' || filters.requiredOnly

  const donutSlices = [
    { label: 'Pass',        value: summary.pass,        color: '#16a34a' },
    { label: 'Failed',      value: summary.failed,      color: '#dc2626' },
    { label: 'In Review',   value: summary.inReview,    color: '#9333ea' },
    { label: 'In Progress', value: summary.inProgress,  color: '#0284c7' },
    { label: 'Blocked',     value: summary.blocked,     color: '#e11d48' },
    { label: 'Not Started', value: summary.notStarted,  color: '#64748b' },
    { label: 'N/A',         value: summary.na,          color: '#94a3b8' },
  ].filter(s => s.value > 0)

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 2.5 }}>
      {/* Use flex for sidebar + main to avoid Grid direction column issue */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2.5 }}>

        {/* Sidebar */}
        <Box sx={{ width: 230, flexShrink: 0 }}>
          <DashboardFiltersPanel items={items} filters={filters} filteredCount={filtered.length} onChange={onFiltersChange} />
        </Box>

        {/* Main */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <SummaryCards summary={summary} totalCount={items.length} />

            {/* Charts */}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Panel title={isFiltered ? 'Status Breakdown (Filtered)' : 'Status Breakdown'}>
                  <DonutChart slices={donutSlices} label={`${summary.total}`} sublabel={isFiltered ? 'matching' : 'items'} />
                </Panel>
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Panel title={isFiltered ? 'By Category (Filtered)' : 'By Category'}>
                  <CategoryBreakdownChart bars={categoryStats} />
                </Panel>
              </Grid>
            </Grid>

            {/* Activity */}
            <Card elevation={0}>
              <CardContent>
                <ActivitySparkline points={activityTimeline} height={80} />
              </CardContent>
            </Card>

            {/* Pending */}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Panel title="Pending Responses" badge={pendingResponses.length}>
                  <PendingResponsesList items={pendingResponses} />
                </Panel>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Panel title="Awaiting Review" badge={pendingReview.length}>
                  <PendingReviewList items={pendingReview} />
                </Panel>
              </Grid>
            </Grid>

            <ActionItemLeaderboard items={filtered} />

          </Box>
        </Box>
      </Box>
    </Box>
  )
}
