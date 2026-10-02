import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, IconButton, TextField, ThemeProvider, Typography } from '@mui/material'
import { useState } from 'react'
import { darkTheme } from '../../theme'

interface Props { onSubmit: (project: string, version: string, branch: string) => void; onBack: () => void }

export function MetaEntryForm({ onSubmit, onBack }: Props) {
  const [project, setProject] = useState('')
  const [version, setVersion] = useState('')
  const [branch, setBranch] = useState('pre-dev')

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, position: 'relative' }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, ...{ mb: 3 } }}>
            <IconButton size="small" onClick={onBack} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}><ArrowBackIcon fontSize="small" /></IconButton>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Project Details</Typography>
          </Box>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Project Name" placeholder="MyApp" value={project}
                onChange={e => setProject(e.target.value)} required />
              <TextField label="Version" placeholder="1.0.0" value={version}
                onChange={e => setVersion(e.target.value)} required />
              <TextField label="Target Branch (optional)" placeholder="pre-dev" value={branch}
                onChange={e => setBranch(e.target.value)} />
              <Button variant="contained" size="large" disabled={!project.trim() || !version.trim()}
                onClick={() => onSubmit(project.trim(), version.trim(), branch.trim())}
                sx={{ height: 44, fontWeight: 600, mt: 1 }}>
                Create Checklist
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
