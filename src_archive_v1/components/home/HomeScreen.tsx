import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useRef } from 'react'
import type { CapabilityLevel } from '../../types'
import { IdentityForm } from '../shared/IdentityForm'

interface Props {
  name: string; role: string; capability: CapabilityLevel
  onNameChange: (v: string) => void; onRoleChange: (v: string) => void
  onNew: () => void; onOpen: (bytes: ArrayBuffer, text: string) => void
  validationErrors: string[]
}

export function HomeScreen({ name, role, capability, onNameChange, onRoleChange, onNew, onOpen, validationErrors }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const ready = name.trim().length > 0 && role.trim().length > 0

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { const b = ev.target?.result as ArrayBuffer; onOpen(b, new TextDecoder().decode(b)) }
    reader.readAsArrayBuffer(file)
  }

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#0f172a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', p: 3,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.035,
        backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />
      {/* Glow */}
      <Box sx={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 560, height: 360, borderRadius: '50%',
        background: 'radial-gradient(ellipse,#2563eb1a 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Box sx={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1),0 20px 40px rgba(37,99,235,0.3)',
          }}>
            <Typography sx={{ fontSize: 24, color: '#fff', fontWeight: 700, lineHeight: 1 }}>✓</Typography>
          </Box>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', lineHeight: 1 }}>T-CLIP</Typography>
          <Typography sx={{ fontSize: 12, color: '#475569', letterSpacing: '0.03em', textAlign: 'center' }}>
            Traceable Compliance &amp; Integration for Pre-release
          </Typography>
        </Stack>

        {/* Identity card */}
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 2, p: 2.5, mb: 2, backdropFilter: 'blur(12px)',
        }}>
          <Typography variant="h5" sx={{ color: '#475569', mb: 2 }}>Your Identity</Typography>
          <IdentityForm name={name} role={role} capability={capability} onNameChange={onNameChange} onRoleChange={onRoleChange} />
        </Box>

        {/* Actions */}
        <Stack spacing={1}>
          <Button fullWidth variant="contained" size="large" startIcon={<AddCircleOutlineIcon />} onClick={onNew} disabled={!ready}
            sx={{ height: 44, fontWeight: 600 }}>
            New Checklist
          </Button>
          <Button fullWidth variant="outlined" size="large" startIcon={<FolderOpenOutlinedIcon />} onClick={() => fileRef.current?.click()} disabled={!ready}
            sx={{ height: 44, borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)' } }}>
            Open Checklist
          </Button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
        </Stack>

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            <ul style={{ margin: 0, paddingLeft: 16 }}>{validationErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Alert>
        )}
        {!ready && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: '#334155', fontSize: 12 }}>
            Enter your name and role to continue
          </Typography>
        )}
      </Box>
    </Box>
  )
}
