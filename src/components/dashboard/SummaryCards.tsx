import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material'
import type { Summary } from '../../utils/dashboardStats'

const CARDS = [
  { key: 'pass',       label: 'Pass',        color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'failed',     label: 'Failed',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { key: 'inReview',   label: 'In Review',   color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  { key: 'inProgress', label: 'In Progress', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { key: 'notStarted', label: 'Not Started', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  { key: 'na',         label: 'N/A',         color: '#64748b', bg: '#f8fafc', border: '#cbd5e1' },
] as const

interface Props {
  summary: Summary
  totalCount?: number
}

export function SummaryCards({ summary, totalCount }: Props) {
  const pct = summary.completionPercent
  const pctColor = pct === 100 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 40 ? '#3b82f6' : '#64748b'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
        {CARDS.map(c => {
          const value = summary[c.key]
          const barPct = summary.total === 0 ? 0 : Math.round((value / summary.total) * 100)
          return (
            <Card key={c.key} elevation={0} sx={{ bgcolor: c.bg, border: `1px solid ${c.border}` }}>
              <CardContent>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: c.color, mb: 0.5 }}>
                  {c.label}
                </Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 700, color: c.color, lineHeight: 1 }}>{value}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mt: 1.25 }}>
                  <LinearProgress variant="determinate" value={barPct} sx={{
                    flex: 1, height: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)',
                    '& .MuiLinearProgress-bar': { bgcolor: c.color, borderRadius: 2 },
                  }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: c.color, flexShrink: 0 }}>{barPct}%</Typography>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Completion hero */}
      <Card elevation={0}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {/* SVG ring */}
            <Box sx={{ flexShrink: 0 }}>
              <svg width={56} height={56} viewBox="0 0 56 56">
                <circle cx={28} cy={28} r={22} fill="none" stroke="#f1f5f9" strokeWidth={6} />
                <circle cx={28} cy={28} r={22} fill="none" stroke={pctColor} strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 138.2} 138.2`}
                  strokeDashoffset={34.55}
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x={28} y={29} textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight={700} fill={pctColor}>{pct}%</text>
              </svg>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Required Items Complete</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {totalCount !== undefined && totalCount !== summary.total
                    ? `${summary.total} of ${totalCount} items (filtered)`
                    : `${summary.total} total`}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={pct} sx={{
                height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': { bgcolor: pctColor, borderRadius: 4, transition: 'transform 0.6s ease' },
              }} />
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mt: 0.5 }}>
                {['0%','25%','50%','75%','100%'].map(l => (
                  <Typography key={l} sx={{ fontSize: 10, color: 'text.disabled' }}>{l}</Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
