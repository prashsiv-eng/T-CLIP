import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import { Box, Card, CardContent, CardHeader, Chip, Typography } from '@mui/material'
import type { ReviewedItem } from '../../types'
import { getLeaderboard, type LeaderboardEntry } from '../../utils/dashboardStats'

export function ActionItemLeaderboard({ items }: { items: ReviewedItem[] }) {
  const entries: LeaderboardEntry[] = getLeaderboard(items)
  return (
    <Card elevation={0}>
      <CardHeader
        avatar={<EmojiEventsOutlinedIcon sx={{ fontSize: 18, color: '#d97706' }} />}
        title={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Action Item Leaderboard</Typography>}
        sx={{ pb: 0, pt: 1.5, px: 2 }}
      />
      <CardContent sx={{ pt: 1 }}>
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No outstanding action items.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {entries.map((e, i) => (
              <Box key={e.actorName} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, py: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', width: 20, textAlign: 'center', flexShrink: 0 }}>
                  #{i + 1}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.actorName}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{e.role}</Typography>
                </Box>
                <Chip
                  label={`${e.outstandingCount} outstanding`} size="small"
                  color={e.outstandingCount > 5 ? 'error' : e.outstandingCount > 2 ? 'warning' : 'default'}
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

