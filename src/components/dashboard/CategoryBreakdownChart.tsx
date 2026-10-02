import { BarChart } from '@mui/x-charts/BarChart'
import { Box, Typography } from '@mui/material'

export interface CategoryBar {
  category: string; pass: number; fail: number; na: number; pending: number; total: number
}

export function CategoryBreakdownChart({ bars }: { bars: CategoryBar[] }) {
  if (bars.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No data</Typography>
  }
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <BarChart
        dataset={bars as any[]}
        yAxis={[{ scaleType: 'band', dataKey: 'category', tickLabelStyle: { fontSize: 11 } }]}
        series={[
          { dataKey: 'pass',    label: 'Pass',    color: '#16a34a', stack: 'total' },
          { dataKey: 'fail',    label: 'Fail',    color: '#dc2626', stack: 'total' },
          { dataKey: 'na',      label: 'N/A',     color: '#94a3b8', stack: 'total' },
          { dataKey: 'pending', label: 'Pending', color: '#64748b', stack: 'total' },
        ]}
        layout="horizontal"
        height={Math.max(bars.length * 38 + 32, 120)}
        margin={{ left: 110, right: 24, top: 8, bottom: 24 }}
        slotProps={{}}
        sx={{
          '& .MuiChartsAxis-tickLabel': { fontSize: '11px !important' },
          '& .MuiChartsAxis-line': { stroke: '#e2e8f0' },
          '& .MuiChartsAxis-tick': { stroke: '#e2e8f0' },
        }}
      />
    </Box>
  )
}
