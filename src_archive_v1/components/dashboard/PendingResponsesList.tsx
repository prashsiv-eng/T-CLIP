import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Box, Chip, Divider, Stack, Typography } from '@mui/material'
import type { ReviewedItem } from '../../types'

export function PendingResponsesList({ items }: { items: ReviewedItem[] }) {
  if (items.length === 0) return (
    <Box sx={{ py: 3, textAlign: 'center' }}>
      <InboxOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
      <Typography variant="body2" color="text.secondary">No pending responses 🎉</Typography>
    </Box>
  )
  return (
    <Stack divider={<Divider />}>
      {items.map(item => (
        <Stack key={item.id} direction="row" alignItems="flex-start" spacing={1} sx={{ py: 1 }}>
          <Typography component="code" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', mt: 0.2, flexShrink: 0 }}>{item.id}</Typography>
          <Typography sx={{ fontSize: 12, flex: 1 }}>{item.description}</Typography>
          {item.assignedTo && <Chip label={item.assignedTo.name ?? item.assignedTo.role} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />}
        </Stack>
      ))}
    </Stack>
  )
}
