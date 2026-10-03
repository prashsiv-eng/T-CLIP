import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Box, Chip, Typography } from '@mui/material'
import type { ReviewedItem } from '../../types'

export function PendingResponsesList({ items }: { items: ReviewedItem[] }) {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <InboxOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', display: 'block', mx: 'auto', mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">No pending responses.</Typography>
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {items.map(item => (
        <Box key={item.id} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, py: 1 }}>
          <Typography component="code" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', mt: 0.2, flexShrink: 0 }}>
            {item.id}
          </Typography>
          <Typography sx={{ fontSize: 12, flex: 1 }}>{item.description}</Typography>
          {item.assignedTo && (
            <Chip label={item.assignedTo.name ?? item.assignedTo.role} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
          )}
        </Box>
      ))}
    </Box>
  )
}

