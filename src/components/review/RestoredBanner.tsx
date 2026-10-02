import { Alert, Box, Button } from '@mui/material'

interface Props {
  onClear: () => void
  onDismiss: () => void
}

export function RestoredBanner({ onClear, onDismiss }: Props) {
  return (
    <Alert
      severity="info"
      onClose={onDismiss}
      sx={{ mx: 2.5, mt: 1.5, borderRadius: 2, alignItems: 'center' }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" color="inherit" onClick={onClear} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Clear &amp; start fresh
          </Button>
        </Box>
      }
    >
      Review session restored from your last visit.
    </Alert>
  )
}
