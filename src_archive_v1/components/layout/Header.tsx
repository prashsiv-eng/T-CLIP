import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { AppBar, Avatar, Box, Chip, ClickAwayListener, IconButton, Paper, Popper, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile } from '../../types'
import { IdentityForm } from '../shared/IdentityForm'

const CAP_COLORS: Record<CapabilityLevel, string> = {
  observer: '#64748b', contributor: '#7c3aed', reviewer: '#2563eb', approver: '#d97706', editor: '#16a34a',
}

interface Props {
  file: ChecklistFile
  userName: string
  userRole: string
  capability: CapabilityLevel
  onNameChange: (v: string) => void
  onRoleChange: (v: string) => void
  onSettingsOpen: () => void
  onExport?: () => void
}

export function Header({ file, userName, userRole, capability, onNameChange, onRoleChange, onSettingsOpen, onExport }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #1e293b', height: 52, justifyContent: 'center' }}>
      <Toolbar variant="dense" sx={{ minHeight: 52, px: 2.5, gap: 2 }}>

        {/* Brand */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, mr: 1 }}>
          <Box sx={{
            width: 26, height: 26, borderRadius: '6px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1,
          }}>✓</Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>T-CLIP</Typography>
        </Stack>

        <Box sx={{ width: 1, height: 20, bgcolor: '#1e293b', flexShrink: 0 }} />

        {/* Project info */}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
            {file.project}
          </Typography>
          <Typography sx={{ color: '#334155', fontSize: 13 }}>·</Typography>
          <Typography sx={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>v{file.version}</Typography>
          {file.branch && (
            <Chip label={file.branch} size="small" sx={{ bgcolor: '#1e3a8a22', color: '#93c5fd', border: '1px solid #3b82f633', fontFamily: 'monospace', fontSize: 11, height: 18 }} />
          )}
        </Stack>

        {/* Right */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Identity chip */}
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Box>
              <Box
                component="button"
                onClick={e => setAnchorEl(anchorEl ? null : e.currentTarget)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  bgcolor: '#1e293b', border: '1px solid #334155',
                  borderRadius: 1.5, px: 1.25, py: 0.5, cursor: 'pointer',
                  '&:hover': { borderColor: '#475569' }, transition: 'border-color 0.15s',
                }}
              >
                <Avatar sx={{ width: 22, height: 22, fontSize: 11, fontWeight: 700, bgcolor: `${CAP_COLORS[capability]}33`, color: CAP_COLORS[capability], border: `1.5px solid ${CAP_COLORS[capability]}55` }}>
                  {(userName || '?')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>{userName || 'Set name'}</Typography>
                  <Typography sx={{ fontSize: 10, color: '#64748b', lineHeight: 1.2 }}>{userRole || 'Set role'}</Typography>
                </Box>
                <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#475569' }} />
              </Box>

              <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-end" sx={{ zIndex: 1300 }}>
                <Paper elevation={4} sx={{ mt: 1, p: 2, width: 320, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h5" sx={{ mb: 1.5, color: '#94a3b8' }}>Identity</Typography>
                  <IdentityForm name={userName} role={userRole} capability={capability} onNameChange={onNameChange} onRoleChange={onRoleChange} compact />
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>

          {onExport && (
            <Tooltip title="Export checklist.json">
              <IconButton size="small" onClick={onExport} sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onSettingsOpen} sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}>
              <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
