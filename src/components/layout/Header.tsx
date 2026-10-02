import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {
  AppBar, Avatar, Box, Button, ButtonBase, Chip, ClickAwayListener,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Paper, Popper, Toolbar, Tooltip, Typography,
} from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile } from '../../types'
import { IdentityForm } from '../shared/IdentityForm'

const GITHUB_REPO_URL = 'https://github.com/prashsiv-eng/T-CLIP'

const CAP_COLORS: Record<CapabilityLevel, string> = {
  'read-only': '#64748b',
  editor: '#0284c7',
  reviewer: '#2563eb',
  approver: '#7c3aed',
  'sign-off': '#059669',
  master: '#dc2626',
}

interface Props {
  file: ChecklistFile
  fileName?: string | null
  hasBeenSaved?: boolean
  userName: string
  userRole: string
  capability: CapabilityLevel
  onNameChange: (v: string) => void
  onRoleChange: (v: string) => void
  onSettingsOpen: () => void
  onExport?: () => void
  onRestart?: () => void
  onAboutOpen?: () => void
}

export function Header({ file, fileName, hasBeenSaved, userName, userRole, capability, onNameChange, onRoleChange, onSettingsOpen, onExport, onRestart, onAboutOpen }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false)

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          height: 52,
          justifyContent: 'center',
          width: '100%',
          boxSizing: 'border-box',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52, px: 2.5, gap: 2, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

          {/* Brand / Home Button */}
          <Tooltip title="Home / Restart Workflow">
            <ButtonBase
              onClick={() => setConfirmRestartOpen(true)}
              sx={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1,
                flexShrink: 0, mr: 1, px: 0.75, py: 0.5, borderRadius: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                transition: 'background-color 0.15s',
              }}
            >
              <Box sx={{
                width: 26, height: 26, borderRadius: '6px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>✓</Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>
                T-CLIP
              </Typography>
            </ButtonBase>
          </Tooltip>

        <Box sx={{ width: '1px', height: 20, bgcolor: '#1e293b', flexShrink: 0 }} />

        {/* Project info & File name */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.75, ...{ flex: 1, minWidth: 0, overflow: 'hidden' } }}>
          <Typography noWrap sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 13, maxWidth: 180 }}>
            {file.project}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 13 }}>·</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>v{file.version}</Typography>
          {file.branch && (
            <Chip label={file.branch} size="small"
              sx={{ bgcolor: '#1e3a8a22', color: '#93c5fd', border: '1px solid #3b82f633', fontFamily: 'monospace', fontSize: 11, height: 18 }} />
          )}

          {fileName && (
            <>
              <Box sx={{ width: '1px', height: 16, bgcolor: '#334155', flexShrink: 0, mx: 0.5 }} />
              <Tooltip title={`File: ${fileName}`}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 1.5,
                  px: 1,
                  py: 0.25,
                  minWidth: 0,
                  maxWidth: 240,
                  flexShrink: 1,
                }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 13, color: '#60a5fa', flexShrink: 0 }} />
                  <Typography noWrap sx={{ color: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}>
                    {fileName}
                  </Typography>
                </Box>
              </Tooltip>
            </>
          )}

          {hasBeenSaved === false && (
            <Tooltip title="This checklist is currently in-memory. Export to keep a permanent backup on disk.">
              <Chip
                icon={<SaveOutlinedIcon sx={{ fontSize: '13px !important', color: '#93c5fd !important' }} />}
                label="Unsaved"
                size="small"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.12)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: 10,
                  fontWeight: 700,
                  height: 20,
                  letterSpacing: '0.02em',
                  cursor: 'help',
                  flexShrink: 0,
                }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Right */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Box>
              <ButtonBase onClick={e => setAnchorEl(anchorEl ? null : e.currentTarget)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  bgcolor: '#1e293b', border: '1px solid #334155',
                  borderRadius: 1.5, px: 1.25, py: 0.5, cursor: 'pointer',
                  '&:hover': { borderColor: '#475569' }, transition: 'border-color 0.15s',
                }}>
                <Avatar sx={{
                  width: 22, height: 22, fontSize: 11, fontWeight: 700,
                  bgcolor: `${CAP_COLORS[capability]}33`,
                  color: CAP_COLORS[capability],
                  border: `1.5px solid ${CAP_COLORS[capability]}55`,
                }}>
                  {(userName || '?')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>
                    {userName || 'Set name'}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.2 }}>
                    {userRole || 'Set role'}
                  </Typography>
                </Box>
                <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
              </ButtonBase>

              <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-end" sx={{ zIndex: 1300 }}>
                <Paper elevation={4} sx={{ mt: 1, p: 2, width: 320, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h5" sx={{ mb: 1.5, color: '#94a3b8' }}>Identity</Typography>
                  <IdentityForm name={userName} role={userRole} capability={capability}
                    onNameChange={onNameChange} onRoleChange={onRoleChange} compact />
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>

          {onExport && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={onExport}
              sx={{
                color: '#f8fafc',
                borderColor: 'rgba(255,255,255,0.2)',
                fontSize: 12,
                fontWeight: 600,
                height: 32,
                px: 1.5,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59,130,246,0.1)',
                },
              }}
            >
              Export JSON
            </Button>
          )}
          {onAboutOpen && (
            <Tooltip title="About T-CLIP">
              <IconButton size="small" onClick={onAboutOpen} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="View Source on GitHub">
            <IconButton
              size="small"
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
            >
              <GitHubIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restart Workflow (Return to Home)">
            <IconButton size="small" onClick={() => setConfirmRestartOpen(true)} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
              <RestartAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onSettingsOpen} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
              <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>

    <Dialog
      open={confirmRestartOpen}
      onClose={() => setConfirmRestartOpen(false)}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: 2.5,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18, color: '#f8fafc' }}>
        Restart Workflow?
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#94a3b8', fontSize: 14 }}>
          {!hasBeenSaved
            ? 'This checklist has not been saved to your computer yet. If you restart now, your current answers and progress will be discarded unless you export first.'
            : 'Are you sure you want to close this checklist and return to the home screen to open or create a different checklist?'}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={() => setConfirmRestartOpen(false)}
          sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        {!hasBeenSaved && onExport && (
          <Button
            variant="outlined"
            onClick={() => {
              onExport()
              setConfirmRestartOpen(false)
            }}
            sx={{ borderColor: '#3b82f6', color: '#60a5fa', textTransform: 'none', fontWeight: 600 }}
          >
            Export First
          </Button>
        )}
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            setConfirmRestartOpen(false)
            onRestart?.()
          }}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Restart Workflow
        </Button>
      </DialogActions>
    </Dialog>
  </>
  )
}
