import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

interface Props { onSubmit: (project: string, version: string, branch: string) => void; onBack: () => void }

export function MetaEntryForm({ onSubmit, onBack }: Props) {
  const [project, setProject] = useState('')
  const [version, setVersion] = useState('')
  const [branch, setBranch] = useState('pre-dev')
  const ready = project.trim() && version.trim()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      {/* Grid bg */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton size="small" onClick={onBack} sx={{ color: '#64748b' }}><ArrowBackIcon fontSize="small" /></IconButton>
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Project Details</Typography>
        </Stack>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, p: 3 }}>
          <Stack spacing={2}>
            <TextField label="Project Name" placeholder="MyApp" value={project} onChange={e => setProject(e.target.value)}
              required InputLabelProps={{ sx: { color: '#64748b' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#e2e8f0' }, '& fieldset': { borderColor: '#334155 !important' } }} />
            <TextField label="Version" placeholder="1.0.0" value={version} onChange={e => setVersion(e.target.value)}
              required InputLabelProps={{ sx: { color: '#64748b' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#e2e8f0' }, '& fieldset': { borderColor: '#334155 !important' } }} />
            <TextField label="Target Branch (optional)" placeholder="pre-dev" value={branch} onChange={e => setBranch(e.target.value)}
              InputLabelProps={{ sx: { color: '#64748b' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#e2e8f0' }, '& fieldset': { borderColor: '#334155 !important' } }} />
            <Button variant="contained" size="large" disabled={!ready} onClick={() => onSubmit(project.trim(), version.trim(), branch.trim())} sx={{ mt: 1, height: 44, fontWeight: 600 }}>
              Create Checklist
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
