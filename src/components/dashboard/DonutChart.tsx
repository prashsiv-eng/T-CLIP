import { PieChart } from '@mui/x-charts/PieChart'
import { Box, Typography } from '@mui/material'

interface Slice { label: string; value: number; color: string }
interface Props { slices: Slice[]; label?: string; sublabel?: string }

export function DonutChart({ slices, label, sublabel }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const data = slices.filter(s => s.value > 0).map((s, i) => ({ id: i, value: s.value, label: s.label, color: s.color }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2.5 }}>
      <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <PieChart
          series={[{
            data: data.length > 0 ? data : [{ id: 0, value: 1, label: 'No data', color: '#f1f5f9' }],
            innerRadius: 36, outerRadius: 56, paddingAngle: 2, cornerRadius: 3,
            cx: 56, cy: 56,
          }]}
          width={112} height={112}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
        {label !== undefined && (
          <Box sx={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>{label}</Typography>
            {sublabel && <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.25 }}>{sublabel}</Typography>}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {slices.map(s => (
          <Box key={s.label} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 52 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 24, textAlign: 'right' }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
              {total > 0 ? `(${Math.round((s.value / total) * 100)}%)` : '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
