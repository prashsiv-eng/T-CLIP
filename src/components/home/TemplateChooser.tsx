import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined'
import SearchIcon from '@mui/icons-material/Search'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { darkTheme } from '../../theme'
import type { ChecklistFile } from '../../types'
import { BUILT_IN_TEMPLATE_META, getBuiltInTemplate } from '../../utils/template'
import { CreateTemplateDialog } from './CreateTemplateDialog'

interface Props {
  onSelect: (file: ChecklistFile) => void
  onBack: () => void
}

export function TemplateChooser({ onSelect, onBack }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ name: string; file: ChecklistFile } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)

  async function handleSelect(id: string) {
    setLoading(id)
    try {
      const template = await getBuiltInTemplate(id)
      onSelect(template.file)
    } finally {
      setLoading(null)
    }
  }

  async function handlePreview(id: string, name: string) {
    setLoading(id + '-p')
    try {
      const template = await getBuiltInTemplate(id)
      setPreview({ name, file: template.file })
    } finally {
      setLoading(null)
    }
  }

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return BUILT_IN_TEMPLATE_META
    return BUILT_IN_TEMPLATE_META.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.categories.some(c => c.toLowerCase().includes(q))
    )
  }, [search])

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#0f172a',
        p: { xs: 2.5, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid background */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <Box sx={{ maxWidth: 1040, mx: 'auto', position: 'relative', zIndex: 1 }}>
          {/* Header Bar */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton size="small" onClick={onBack} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  Choose a Template
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mt: 0.5 }}>
                  <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>
                    Select an industry standard or upload your team's custom schema
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setCreateTemplateOpen(true)}
                    startIcon={<PostAddOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                      color: '#93c5fd',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'none',
                      py: 0.2,
                      px: 1.2,
                      height: 24,
                      borderRadius: 1.5,
                      '&:hover': {
                        borderColor: '#3b82f6',
                        bgcolor: 'rgba(59, 130, 246, 0.18)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    Create your own template
                  </Button>
                </Box>
              </Box>
            </Box>

            <TextField
              size="small"
              placeholder="Search templates, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: '#64748b' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: { xs: '100%', sm: 260 },
                bgcolor: 'rgba(255,255,255,0.03)',
                borderRadius: 1.5,
              }}
            />
          </Box>

          {/* Templates Grid */}
          <Grid container spacing={2.5}>
            {/* Import Custom Schema Card (First) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{
                height: '100%',
                border: '2px dashed rgba(59,130,246,0.3)',
                bgcolor: 'rgba(37,99,235,0.04)',
                borderRadius: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(37,99,235,0.08)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -10px rgba(37,99,235,0.25)',
                },
              }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}>
                  <UploadFileOutlinedIcon sx={{ fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', mb: 0.5 }}>
                  Import Custom Schema
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: 12, mb: 2, maxWidth: 280 }}>
                  Upload your organization's custom <code>checklist.json</code>
                </Typography>
                {importError && (
                  <Alert severity="error" sx={{ mb: 1.5, width: '100%', fontSize: 12 }}>
                    {importError}
                  </Alert>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{
                    color: '#f8fafc',
                    borderColor: 'rgba(59,130,246,0.5)',
                    bgcolor: 'rgba(59,130,246,0.1)',
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    px: 2.5,
                    '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59,130,246,0.2)' },
                  }}
                >
                  Browse File
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setImportError(null)
                      const reader = new FileReader()
                      reader.onload = ev => {
                        try {
                          const p = JSON.parse(ev.target?.result as string) as ChecklistFile
                          if (!p.fields || !p.items) throw new Error()
                          onSelect(p)
                        } catch {
                          setImportError('Invalid template — must be a valid checklist.json')
                        }
                      }
                      reader.readAsText(file)
                    }}
                  />
                </Button>
              </Card>
            </Grid>

            {/* Built-in Templates */}
            {filteredTemplates.map(t => (
              <Grid key={t.id} size={{ xs: 12, sm: 6 }}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 2.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderColor: '#3b82f6',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px -10px rgba(37,99,235,0.25)',
                  },
                }}>
                  <CardContent sx={{ flex: 1, p: 2.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', mb: 0.75 }}>
                      {t.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: 12.5, lineHeight: 1.5, mb: 2 }}>
                      {t.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.6 }}>
                      {t.categories.slice(0, 4).map(c => (
                        <Chip
                          key={c}
                          label={c}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: '#cbd5e1',
                            fontSize: 10.5,
                            fontWeight: 500,
                            height: 22,
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        />
                      ))}
                      {t.categories.length > 4 && (
                        <Chip
                          label={`+${t.categories.length - 4}`}
                          size="small"
                          sx={{
                            bgcolor: 'transparent',
                            color: '#64748b',
                            borderColor: '#334155',
                            fontSize: 10.5,
                            height: 22,
                          }}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handlePreview(t.id, t.name)}
                      disabled={!!loading}
                      sx={{
                        color: '#94a3b8',
                        textTransform: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        ml: 'auto',
                        textTransform: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        px: 2,
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                      }}
                      onClick={() => handleSelect(t.id)}
                      disabled={!!loading}
                    >
                      {loading === t.id ? 'Loading…' : 'Use This'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Unified Dark Preview Dialog */}
        <Dialog
          open={!!preview}
          onClose={() => setPreview(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: 3,
                p: 1,
              },
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                {preview?.name ?? 'Template Preview'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                Preview of categories and verification requirements
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setPreview(null)} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', py: 2 }}>
            {preview && Object.entries(
              preview.file.items.reduce<Record<string, typeof preview.file.items>>((acc, i) => {
                acc[i.category] = [...(acc[i.category] ?? []), i]
                return acc
              }, {})
            ).map(([cat, items]) => (
              <Box key={cat} sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#60a5fa', mb: 1 }}>
                  {cat} ({items.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {items.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', flexDirection: 'row', gap: 1.25, alignItems: 'flex-start' }}>
                      <Typography component="code" sx={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, py: 0.1, borderRadius: 1 }}>
                        {item.id}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </DialogContent>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              size="small"
              onClick={() => setPreview(null)}
              sx={{ color: '#94a3b8', textTransform: 'none', fontSize: 12 }}
            >
              Close
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (preview) {
                  const f = preview.file
                  setPreview(null)
                  onSelect(f)
                }
              }}
              sx={{ textTransform: 'none', fontSize: 12, px: 2, bgcolor: '#2563eb' }}
            >
              Use This Template
            </Button>
          </Box>
        </Dialog>

        {/* Create Your Own Template Guide & Download Dialog */}
        <CreateTemplateDialog
          open={createTemplateOpen}
          onClose={() => setCreateTemplateOpen(false)}
        />
      </Box>
    </ThemeProvider>
  )
}
