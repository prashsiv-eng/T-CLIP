import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { ChecklistFile } from '../../types'
import { BUILT_IN_TEMPLATE_META, getBuiltInTemplate } from '../../utils/template'

interface Props { onSelect: (file: ChecklistFile) => void; onBack: () => void }

export function TemplateChooser({ onSelect, onBack }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<ChecklistFile | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  async function handleSelect(id: string) {
    setLoading(id); try { onSelect((await getBuiltInTemplate(id)).file) } finally { setLoading(null) }
  }
  async function handlePreview(id: string) {
    setLoading(id + '-p'); try { setPreview((await getBuiltInTemplate(id)).file) } finally { setLoading(null) }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton size="small" onClick={onBack}><ArrowBackIcon fontSize="small" /></IconButton>
        <Typography variant="h3">Choose a Template</Typography>
      </Stack>

      <Grid container spacing={2} sx={{ maxWidth: 900 }}>
        {BUILT_IN_TEMPLATE_META.map(t => (
          <Grid item xs={12} sm={6} key={t.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ mb: 0.75 }}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{t.description}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {t.categories.slice(0, 4).map(c => <Chip key={c} label={c} size="small" />)}
                  {t.categories.length > 4 && <Chip label={`+${t.categories.length - 4}`} size="small" variant="outlined" />}
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => handlePreview(t.id)} disabled={!!loading}>Preview</Button>
                <Button size="small" variant="contained" onClick={() => handleSelect(t.id)} disabled={!!loading} sx={{ ml: 'auto' }}>
                  {loading === t.id ? 'Loading…' : 'Use This'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {/* Import card */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', border: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <UploadFileOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h4" sx={{ mb: 0.5 }}>Import your own</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload an existing checklist.json</Typography>
            {importError && <Alert severity="error" sx={{ mb: 1, width: '100%' }}>{importError}</Alert>}
            <Button variant="outlined" component="label" size="small">
              Browse
              <input type="file" accept=".json" hidden onChange={e => {
                const file = e.target.files?.[0]; if (!file) return
                setImportError(null)
                const reader = new FileReader()
                reader.onload = ev => {
                  try { const p = JSON.parse(ev.target?.result as string) as ChecklistFile; if (!p.fields || !p.items) throw new Error(); onSelect(p) }
                  catch { setImportError('Invalid template — must be a valid checklist.json') }
                }
                reader.readAsText(file)
              }} />
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Preview dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent dividers>
          {preview && Object.entries(preview.items.reduce<Record<string, typeof preview.items>>((acc, i) => { acc[i.category] = [...(acc[i.category] ?? []), i]; return acc }, {}))
            .map(([cat, items]) => (
              <Box key={cat} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ mb: 1, color: 'text.secondary' }}>{cat}</Typography>
                {items.map(item => (
                  <Stack key={item.id} direction="row" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography component="code" sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{item.id}</Typography>
                    <Typography variant="body2">{item.description}</Typography>
                  </Stack>
                ))}
              </Box>
            ))}
        </DialogContent>
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setPreview(null)}>Close</Button>
        </Box>
      </Dialog>
    </Box>
  )
}
