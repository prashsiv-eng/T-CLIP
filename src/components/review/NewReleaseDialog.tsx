import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { suggestNextVersion } from '../../utils/release'

interface Props {
  open: boolean
  currentProject: string
  currentVersion: string
  currentBranch?: string
  totalItems: number
  evidenceCount: number
  hasBeenSaved?: boolean
  onExportCurrent?: () => void
  onConfirm: (options: { version: string; branch: string }) => void
  onClose: () => void
}

export function NewReleaseDialog({
  open,
  currentProject,
  currentVersion,
  currentBranch,
  totalItems,
  evidenceCount,
  hasBeenSaved = true,
  onExportCurrent,
  onConfirm,
  onClose,
}: Props) {
  const [version, setVersion] = useState('')
  const [branch, setBranch] = useState('')
  const [exported, setExported] = useState(false)

  useEffect(() => {
    if (open) {
      const nextVer = suggestNextVersion(currentVersion)
      setVersion(nextVer)
      setBranch(currentBranch ?? '')
      setExported(false)
    }
  }, [open, currentVersion, currentBranch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      version: version.trim() || currentVersion,
      branch: branch.trim(),
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: {
            bgcolor: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: 3,
            p: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          },
        },
      }}
    >
      {/* Pinned Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          bgcolor: '#0b1120',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <RocketLaunchOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                Start New Release / PR
              </Typography>
              <Chip
                label="Reset Workflow"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
              Prepare {currentProject} for the next release cycle
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Scrollable Body */}
      <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto', borderColor: '#1e293b' }}>
        {/* Prominent Warning to Save Current State Before Resetting */}
        <Alert
          severity="warning"
          icon={<WarningAmberOutlinedIcon sx={{ fontSize: 22, color: '#f59e0b', mt: 0.2 }} />}
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.09)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fef3c7',
            borderRadius: 2,
            p: 1.75,
            '& .MuiAlert-message': { width: '100%', minWidth: 0 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#fbbf24' }}>
                Warning: Save current state before resetting!
              </Typography>
              {!hasBeenSaved && !exported && (
                <Chip
                  label="Unsaved Session"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: 'rgba(239, 68, 68, 0.18)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                />
              )}
            </Box>

            <Typography sx={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.45 }}>
              Resetting will clear all review decisions (Pass/Fail), reviewer comments, and attestation sign-offs from{' '}
              <strong style={{ color: '#f8fafc' }}>v{currentVersion}</strong> to begin the next cycle.
              All filled answers and evidence links will be kept intact.
            </Typography>

            <Typography sx={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4 }}>
              Make sure to save or export a copy of your completed {currentProject} v{currentVersion} checklist first if you haven&apos;t done so already.
            </Typography>

            {onExportCurrent && (
              <Box sx={{ mt: 0.5, pt: 1, borderTop: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={exported ? <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} /> : <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    onExportCurrent()
                    setExported(true)
                  }}
                  sx={{
                    borderColor: exported ? '#10b981' : '#f59e0b',
                    color: exported ? '#6ee7b7' : '#fef3c7',
                    bgcolor: exported ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.5,
                    px: 1.75,
                    borderRadius: 1.5,
                    '&:hover': {
                      borderColor: exported ? '#059669' : '#d97706',
                      bgcolor: exported ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.22)',
                    },
                  }}
                >
                  {exported
                    ? `✓ Exported v${currentVersion} to Disk`
                    : `Save / Export Current State (v${currentVersion})`}
                </Button>

                {exported && (
                  <Typography sx={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                    Backup exported successfully!
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Alert>

        <Typography sx={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
          Reset the review workflow for the next milestone while <strong>retaining all filled evidence and responses</strong> so you don&apos;t have to re-enter them.
        </Typography>

        {/* 3 Summary Points */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Paper sx={{ p: 1.5, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <CheckCircleOutlinedIcon sx={{ color: '#34d399', fontSize: 18, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#34d399' }}>
                  Responses &amp; Evidences Retained ({evidenceCount} controls)
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>
                  Evidence URLs, PR links, and notes are preserved.
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 1.5, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <DeleteSweepOutlinedIcon sx={{ color: '#f87171', fontSize: 18, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#f87171' }}>
                  Review Decisions &amp; Comments Cleared
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>
                  Pass/Fail statuses, review comments, and sign-offs are cleared.
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 1.5, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <RestartAltIcon sx={{ color: '#38bdf8', fontSize: 18, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#38bdf8' }}>
                  Workflow Reset to &quot;Not Started&quot; ({totalItems} controls)
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>
                  Ready for the new review and approval cycle.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Divider sx={{ borderColor: '#334155' }} />

        {/* Inputs */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <TextField
            label="Next Release / Version"
            size="small"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="e.g. 1.1.0 or v2.5"
            helperText={`Current version: ${currentVersion}`}
            sx={{
              '& .MuiInputBase-root': { bgcolor: '#0b1120', color: '#f8fafc' },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
              '& .MuiFormHelperText-root': { color: '#64748b' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
            }}
          />

          <TextField
            label="Target Branch / PR"
            size="small"
            value={branch}
            onChange={e => setBranch(e.target.value)}
            placeholder="e.g. release/v1.1 or main"
            helperText="Branch for the new cycle"
            sx={{
              '& .MuiInputBase-root': { bgcolor: '#0b1120', color: '#f8fafc' },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
              '& .MuiFormHelperText-root': { color: '#64748b' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
            }}
          />
        </Box>

        <Alert
          severity="info"
          sx={{ bgcolor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#bae6fd', fontSize: 11.5, py: 0.5 }}
        >
          After resetting, export your new <code>checklist.json</code> to save a clean copy for your new branch.
        </Alert>
      </DialogContent>

      {/* Pinned Action Buttons Footer */}
      <DialogActions
        sx={{
          px: 3,
          py: 1.75,
          bgcolor: '#0b1120',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Button
          variant="text"
          onClick={onClose}
          sx={{ color: '#94a3b8', textTransform: 'none', fontSize: 13, '&:hover': { color: '#f8fafc' } }}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="contained"
          startIcon={<RocketLaunchOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: '#059669',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'none',
            px: 2.5,
            py: 0.75,
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
            '&:hover': { bgcolor: '#047857' },
          }}
        >
          Start New Release / PR
        </Button>
      </DialogActions>
    </Dialog>
  )
}
