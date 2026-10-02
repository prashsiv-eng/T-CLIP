import { PieChart } from '@mui/x-charts/PieChart'
import { Box, Stack, Typography } from '@mui/material'

interface Slice { label: string; value: number; color: string }

interface Props {
  slices: Slice[]
  label?: string
  sublabel?: string
}

export function DonutChart({ slices, label, sublabel }: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const nonEmpty = slices.filter(s => s.value > 0)

  return (
    <Stack direction="row" alignItems="center" spacing={2.5}>
      <Box sx={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <PieChart
          series={[{
            data: nonEmpty.length > 0 ? nonEmpty.map((s, i) => ({ id: i, value: s.value, label: s.label, color: s.color })) : [{ id: 0, value: 1, label: 'No data', color: '#f1f5f9' }],
            innerRadius: 38,
            outerRadius: 58,
            paddingAngle: 1.5,
            cornerRadius: 3,
            cx: 58,
            cy: 58,
            highlightScope: { fade: 'global', highlight: 'item' },
          }]}
          width={118}
          height={118}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          slotProps={{ legend: { hidden: true } }}
          tooltip={{ trigger: 'item' }}
        />
        {/* Center label */}
        {label !== undefined && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>{label}</Typography>
            {sublabel && <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.25 }}>{sublabel}</Typography>}
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Stack spacing={1}>
        {slices.map(s => (
          <Stack key={s.label} direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 52 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 28 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
              {total > 0 ? `(${Math.round((s.value / total) * 100)}%)` : '—'}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
