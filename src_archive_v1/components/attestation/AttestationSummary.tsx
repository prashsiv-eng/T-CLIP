import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { ChecklistFile, FieldSchema, ReviewedItem } from '../../types'
import { buildAttestation } from '../../utils/export'

function FieldValuesList({ fieldValues, fields }: { fieldValues: Record<string, string>; fields: FieldSchema[] }) {
  const entries = Object.entries(fieldValues).filter(([, v]) => v !== '')
  if (!entries.length) return null
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
      {entries.map(([id, val]) => {
        const label = fields.find(f => f.id === id)?.label ?? id
        return <Chip key={id} label={`${label}: ${val}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
      })}
    </Stack>
  )
}

interface Props { file: ChecklistFile; items: ReviewedItem[]; fileHash: string }

export function AttestationSummary({ file, items, fileHash }: Props) {
  const pass = items.filter(i => i.status === 'pass')
  const fail = items.filter(i => i.status === 'fail')
  const na = items.filter(i => i.status === 'na')

  function handleExport() {
    const blob = new Blob([JSON.stringify(buildAttestation(file, items, fileHash), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'checklist-attestation.json' })
    a.click(); URL.revokeObjectURL(url)
  }

  function renderGroup(groupItems: ReviewedItem[], label: string, color: 'success' | 'error' | 'default') {
    if (!groupItems.length) return null
    return (
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: `${color}.main`, mb: 1 }}>
          {label} ({groupItems.length})
        </Typography>
        <Stack spacing={1}>
          {groupItems.map(item => {
            const last = item.history[item.history.length - 1]
            return (
              <Card key={item.id} elevation={0} sx={{ borderLeft: `3px solid`, borderLeftColor: color === 'error' ? 'error.main' : color === 'success' ? 'success.main' : 'divider' }}>
                <CardContent sx={{ py: '10px !important', px: '14px !important' }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Typography component="code" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', mt: 0.2, flexShrink: 0 }}>{item.id}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13 }}>{item.description}</Typography>
                      {last && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>{last.actorName} · {last.role} · {new Date(last.timestamp).toLocaleDateString()}</Typography>}
                      {last && <FieldValuesList fieldValues={last.fieldValues ?? {}} fields={file.fields} />}
                    </Box>
                    {item.confirmedBy && <Chip label={`✓ ${item.confirmedBy.actorName}`} color="success" size="small" />}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4, borderTop: '2px solid', borderColor: 'success.light', pt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Attestation Summary</Typography>
          <Typography component="code" sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace' }}>SHA-256: {fileHash}</Typography>
        </Box>
        <Button variant="contained" color="success" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport} size="small">
          Export Attestation JSON
        </Button>
      </Stack>

      {fail.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          {fail.length} item(s) marked as Fail. Review before finalising.
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />
      {renderGroup(fail, 'Fail', 'error')}
      {renderGroup(na, 'N/A', 'default')}
      {renderGroup(pass, 'Pass', 'success')}
    </Box>
  )
}
