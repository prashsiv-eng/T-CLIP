import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import { Box, Card, CardContent, CardHeader, Chip, Divider, Stack, Typography } from '@mui/material'
import type { ReviewedItem } from '../../types'
import { getLeaderboard, type LeaderboardEntry } from '../../utils/dashboardStats'

const MEDALS = ['🥇', '🥈', '🥉']

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
          <Stack divider={<Divider />}>
            {entries.map((e, i) => (
              <Stack key={e.actorName} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <Typography sx={{ fontSize: 18, flexShrink: 0 }}>{MEDALS[i] ?? `${i + 1}`}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.actorName}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{e.role}</Typography>
                </Box>
                <Chip
                  label={`${e.outstandingCount} outstanding`}
                  size="small"
                  color={e.outstandingCount > 5 ? 'error' : e.outstandingCount > 2 ? 'warning' : 'default'}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
