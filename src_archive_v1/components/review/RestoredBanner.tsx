import { Alert, Button } from '@mui/material'

export function RestoredBanner({ onClear }: { onClear: () => void }) {
  return (
    <Alert severity="info" sx={{ mx: 2.5, mt: 1.5, borderRadius: 1.5 }}
      action={<Button size="small" color="info" onClick={onClear}>Clear & start fresh</Button>}>
      Review session restored from your last visit.
    </Alert>
  )
}
