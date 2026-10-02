import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import { Box, Chip, Typography } from '@mui/material'
import type { ItemStatus, ReviewedItem } from '../../types'

const STATUS_COLOR: Record<ItemStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning', pass: 'success', fail: 'error', na: 'default',
}

export function PendingReviewList({ items }: { items: ReviewedItem[] }) {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <CheckCircleOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', display: 'block', mx: 'auto', mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">Nothing awaiting review 🎉</Typography>
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {items.map(item => {
        const last = item.history[item.history.length - 1]
        return (
          <Box key={item.id} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, py: 1 }}>
            <Typography component="code" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', mt: 0.2, flexShrink: 0 }}>
              {item.id}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>{item.description}</Typography>
              {last && (
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                  {last.actorName} · {last.role} · {new Date(last.timestamp).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Chip label={item.status} color={STATUS_COLOR[item.status]} size="small" sx={{ flexShrink: 0 }} />
          </Box>
        )
      })}
    </Box>
  )
}

