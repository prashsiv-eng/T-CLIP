import { Box, Card, CardContent, CardHeader, Grid, Stack, Typography } from '@mui/material'
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

const DONUT_COLORS = { pass: '#16a34a', fail: '#dc2626', pending: '#d97706', na: '#94a3b8' }

function PanelCard({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <Card elevation={0}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{title}</Typography>
            {badge !== undefined && badge > 0 && (
              <Box sx={{ fontSize: 10, fontWeight: 700, bgcolor: '#fef3c7', color: '#d97706', px: 0.75, py: 0.125, borderRadius: 10 }}>{badge}</Box>
            )}
          </Stack>
        }
        sx={{ pb: 0, pt: 1.5, px: 2 }}
      />
      <CardContent sx={{ pt: 1 }}>{children}</CardContent>
    </Card>
  )
}

export function DashboardView({ items, fields, filters, userCapability, onFiltersChange }: Props) {
  const { summary, pendingResponses, pendingReview } = useDashboard(items, fields, filters, userCapability)
  const categoryStats = useMemo(() => getCategoryStats(items), [items])
  const activityTimeline = useMemo(() => getActivityTimeline(items, 14), [items])

  const donutSlices = [
    { label: 'Pass',    value: summary.pass,    color: DONUT_COLORS.pass },
    { label: 'Fail',    value: summary.fail,    color: DONUT_COLORS.fail },
    { label: 'Pending', value: summary.pending, color: DONUT_COLORS.pending },
    { label: 'N/A',     value: summary.na,      color: DONUT_COLORS.na },
  ]

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 2.5 }}>
      <Grid container spacing={2.5} alignItems="flex-start" wrap="nowrap">

        {/* Sidebar */}
        <Grid item sx={{ width: 220, flexShrink: 0 }}>
          <DashboardFiltersPanel items={items} filters={filters} onChange={onFiltersChange} />
        </Grid>

        {/* Main */}
        <Grid item xs sx={{ minWidth: 0 }}>
          <Stack spacing={2.5}>

            {/* KPI cards */}
            <SummaryCards summary={summary} />

            {/* Charts row */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} lg={5}>
                <PanelCard title="Status Breakdown">
                  <DonutChart slices={donutSlices} label={`${summary.total}`} sublabel="items" />
                </PanelCard>
              </Grid>
              <Grid item xs={12} lg={7}>
                <PanelCard title="By Category">
                  <CategoryBreakdownChart bars={categoryStats} />
                </PanelCard>
              </Grid>
            </Grid>

            {/* Activity */}
            <Card elevation={0}>
              <CardContent><ActivitySparkline points={activityTimeline} height={80} /></CardContent>
            </Card>

            {/* Pending */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} lg={6}>
                <PanelCard title="Pending Responses" badge={pendingResponses.length}>
                  <PendingResponsesList items={pendingResponses} />
                </PanelCard>
              </Grid>
              <Grid item xs={12} lg={6}>
                <PanelCard title="Awaiting Review" badge={pendingReview.length}>
                  <PendingReviewList items={pendingReview} />
                </PanelCard>
              </Grid>
            </Grid>

            {/* Leaderboard */}
            <ActionItemLeaderboard items={items} />

          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
