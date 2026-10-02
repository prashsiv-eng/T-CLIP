import { LineChart } from '@mui/x-charts/LineChart'
import { Box, Typography } from '@mui/material'
import type { ActivityPoint } from '../../utils/dashboardStats'

export function ActivitySparkline({ points, height = 100 }: { points: ActivityPoint[]; height?: number }) {
  if (points.length === 0) return null
  const total = points.reduce((s, p) => s + p.actionsCount, 0)
  const labels = points.map(p =>
    new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...{ mb: 0.5 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Activity (last 14 days)</Typography>
        <Typography sx={{ fontSize: 12, color: 'primary.main', fontWeight: 600 }}>{total} actions</Typography>
      </Box>
      <LineChart
        xAxis={[{ data: labels, scaleType: 'point', tickLabelStyle: { fontSize: 10 } }]}
        series={[{
          data: points.map(p => p.actionsCount),
          label: 'Actions',
          color: '#2563eb',
          area: true,
          curve: 'catmullRom',
          showMark: false,
        }]}
        height={height + 32}
        margin={{ left: 32, right: 16, top: 8, bottom: 32 }}
        slotProps={{}}
        sx={{
          '& .MuiLineElement-root': { strokeWidth: 2 },
          '& .MuiAreaElement-root': { opacity: 0.15 },
          '& .MuiChartsAxis-line': { stroke: '#e2e8f0' },
          '& .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
          '& .MuiChartsAxis-tickLabel': { fontSize: '10px !important', fill: '#94a3b8' },
        }}
      />
    </Box>
  )
}
