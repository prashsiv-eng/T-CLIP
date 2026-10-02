import { LineChart } from '@mui/x-charts/LineChart'
import { Box, Stack, Typography } from '@mui/material'
import type { ActivityPoint } from '../../utils/dashboardStats'

interface Props { points: ActivityPoint[]; height?: number }

export function ActivitySparkline({ points, height = 100 }: Props) {
  if (points.length === 0) return null
  const total = points.reduce((s, p) => s + p.actionsCount, 0)
  const labels = points.map(p => new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Activity (last 14 days)</Typography>
        <Typography sx={{ fontSize: 12, color: 'primary.main', fontWeight: 600 }}>{total} actions</Typography>
      </Stack>
      <LineChart
        xAxis={[{ data: labels, scaleType: 'point', tickLabelStyle: { fontSize: 10 } }]}
        series={[{
          data: points.map(p => p.actionsCount),
          label: 'Actions',
          color: '#2563eb',
          area: true,
          showMark: p => points[p.dataIndex]?.actionsCount > 0,
          curve: 'catmullRom',
        }]}
        height={height + 32}
        margin={{ left: 32, right: 16, top: 8, bottom: 32 }}
        slotProps={{ legend: { hidden: true } }}
        sx={{
          '& .MuiAreaElement-root': { fill: 'url(#sparkGrad)', opacity: 0.3 },
          '& .MuiLineElement-root': { strokeWidth: 2 },
          '& .MuiChartsAxis-line': { stroke: '#e2e8f0' },
          '& .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
          '& .MuiChartsAxis-tickLabel': { fontSize: '10px !important', fill: '#94a3b8' },
        }}
      />
    </Box>
  )
}
