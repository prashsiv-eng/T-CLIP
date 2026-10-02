import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EditNoteIcon from '@mui/icons-material/EditNote'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Slide,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus } from '../../types'
import { canConfirm, canReviewDecision, canSetWorkStatus, STANDARD_PERSONAS } from '../../utils/capability'

interface Props {
  selectedIds: string[]
  file: ChecklistFile
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onClearSelection: () => void
  onBatchUpdateStatus: (
    ids: string[],
    status: ItemStatus,
    meta: { actorName: string; role: string; notes?: string }
  ) => void
  onBatchConfirm: (
    ids: string[],
    meta: { actorName: string; role: string; notes?: string }
  ) => void
  onBatchAssign?: (
    ids: string[],
    assignedTo?: { role?: string; name?: string }
  ) => void
}

export function BulkActionBar({
  selectedIds,
  file,
  userCapability,
  userName,
  userRole,
  onClearSelection,
  onBatchUpdateStatus,
  onBatchConfirm,
  onBatchAssign,
}: Props) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: 'status' | 'confirm'
    targetStatus?: ItemStatus
    title: string
    promptNotes?: boolean
  }>({
    open: false,
    action: 'status',
    title: '',
  })
  const [notes, setNotes] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignRole, setAssignRole] = useState('')
  const [assignName, setAssignName] = useState('')

  if (selectedIds.length === 0) return null

  const personas = file.personas
  const isReadOnly = userCapability === 'read-only'
  const allowWorkStatus = !isReadOnly && canSetWorkStatus(userRole, personas)
  const allowReview = !isReadOnly && canReviewDecision(userRole, personas)
  const allowApprove = !isReadOnly && canConfirm(userRole, personas)

  const handleOpenDialog = (
    action: 'status' | 'confirm',
    targetStatus?: ItemStatus,
    title = '',
    promptNotes = false
  ) => {
    setNotes('')
    setConfirmDialog({
      open: true,
      action,
      targetStatus,
      title,
      promptNotes,
    })
  }

  const handleExecuteAction = () => {
    if (confirmDialog.action === 'confirm') {
      onBatchConfirm(selectedIds, {
        actorName: userName,
        role: userRole,
        notes: notes.trim() || undefined,
      })
    } else if (confirmDialog.targetStatus) {
      onBatchUpdateStatus(selectedIds, confirmDialog.targetStatus, {
        actorName: userName,
        role: userRole,
        notes: notes.trim() || undefined,
      })
    }
    setConfirmDialog({ open: false, action: 'status', title: '' })
    onClearSelection()
  }

  return (
    <>
      <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%) !important',
            zIndex: 1300,
            bgcolor: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 3,
            px: 2.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            maxWidth: '92vw',
            overflowX: 'auto',
          }}
        >
          {/* Selected Count Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
            <Chip
              label={`${selectedIds.length} Selected`}
              size="small"
              sx={{
                bgcolor: '#3b82f6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
              }}
            />
            <Button
              size="small"
              onClick={onClearSelection}
              sx={{ color: '#94a3b8', textTransform: 'none', fontSize: 11, minWidth: 'auto', p: 0.5 }}
            >
              Clear
            </Button>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

          {/* Action Buttons based on User Role */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
            {/* Reviewer Actions */}
            {allowReview && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleOutlinedIcon />}
                  onClick={() =>
                    handleOpenDialog('status', 'pass', `Mark ${selectedIds.length} Items as PASS`)
                  }
                  sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, minWidth: 'fit-content' }}
                >
                  Batch Pass
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<HighlightOffIcon />}
                  onClick={() =>
                    handleOpenDialog('status', 'failed', `Mark ${selectedIds.length} Items as FAILED`, true)
                  }
                  sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, minWidth: 'fit-content' }}
                >
                  Batch Fail
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RemoveCircleOutlinedIcon />}
                  onClick={() =>
                    handleOpenDialog('status', 'na', `Mark ${selectedIds.length} Items as N/A`)
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: 12,
                    color: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.2)',
                    minWidth: 'fit-content',
                    '&:hover': { borderColor: '#fff', color: '#fff' },
                  }}
                >
                  Batch N/A
                </Button>
              </>
            )}

            {/* Approver Confirm Action */}
            {allowApprove && (
              <Button
                variant="contained"
                size="small"
                startIcon={<VerifiedUserOutlinedIcon />}
                onClick={() =>
                  handleOpenDialog('confirm', undefined, `Confirm Review for ${selectedIds.length} Items`)
                }
                sx={{
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: '#f59e0b',
                  color: '#000',
                  minWidth: 'fit-content',
                  '&:hover': { bgcolor: '#d97706' },
                }}
              >
                Confirm Reviews
              </Button>
            )}

            {/* Editor Actions */}
            {allowWorkStatus && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SendOutlinedIcon />}
                  onClick={() =>
                    handleOpenDialog('status', 'in-review', `Submit ${selectedIds.length} Items for Review`)
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    bgcolor: '#9333ea',
                    minWidth: 'fit-content',
                    '&:hover': { bgcolor: '#7e22ce' },
                  }}
                >
                  Submit for Review
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditNoteIcon />}
                  onClick={() =>
                    handleOpenDialog('status', 'in-progress', `Mark ${selectedIds.length} Items as In-Progress`)
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: 12,
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    minWidth: 'fit-content',
                    '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56,189,248,0.1)' },
                  }}
                >
                  Mark In-Progress
                </Button>
              </>
            )}

            {/* Batch Assign Action */}
            {!isReadOnly && onBatchAssign && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddOutlinedIcon />}
                onClick={() => {
                  setAssignRole('')
                  setAssignName('')
                  setAssignDialogOpen(true)
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#60a5fa',
                  borderColor: 'rgba(96, 165, 250, 0.4)',
                  minWidth: 'fit-content',
                  '&:hover': { borderColor: '#60a5fa', bgcolor: 'rgba(96, 165, 250, 0.1)' },
                }}
              >
                Assign Selected
              </Button>
            )}
          </Box>
        </Paper>
      </Slide>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(d => ({ ...d, open: false }))}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: 420,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>
            This action will update <strong>{selectedIds.length} items</strong> simultaneously with your identity (
            <strong>
              {userName} — {userRole}
            </strong>
            ).
          </Typography>

          <TextField
            label="Audit Notes (Optional)"
            placeholder="Add reasoning or context for this batch update..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog(d => ({ ...d, open: false }))} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteAction}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 600 }}
          >
            Apply to {selectedIds.length} Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: 440,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>
          Assign {selectedIds.length} Selected Items
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>
            Choose a team persona or enter an assignee for all <strong>{selectedIds.length}</strong> selected items:
          </Typography>

          {/* Quick Persona Pills */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.75 }}>
              Assign to Team Persona:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {(file.personas && file.personas.length > 0 ? file.personas : STANDARD_PERSONAS).map(p => (
                <Chip
                  key={p.id}
                  label={p.label}
                  size="small"
                  clickable
                  onClick={() => {
                    onBatchAssign?.(selectedIds, { role: p.label })
                    setAssignDialogOpen(false)
                  }}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 11,
                    '&:hover': { bgcolor: '#2563eb', borderColor: '#3b82f6', color: '#fff' },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Custom Assignee Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>
              Or Enter Custom Assignee:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Assignee Name"
                placeholder="e.g. John Doe"
                value={assignName}
                onChange={e => setAssignName(e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': { color: '#fff', fontSize: 12 },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              />
              <TextField
                size="small"
                label="Role"
                placeholder="e.g. Security Lead"
                value={assignRole}
                onChange={e => setAssignRole(e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': { color: '#fff', fontSize: 12 },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              />
            </Box>
          </Box>

          {/* Shortcut buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
            <Button
              size="small"
              onClick={() => {
                onBatchAssign?.(selectedIds, { name: userName, role: userRole })
                setAssignDialogOpen(false)
              }}
              sx={{ textTransform: 'none', color: '#60a5fa', fontSize: 12 }}
            >
              Assign to me ({userName || 'User'} · {userRole})
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => {
                onBatchAssign?.(selectedIds, undefined)
                setAssignDialogOpen(false)
              }}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Clear Assignment
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!assignName.trim() && !assignRole.trim()}
            onClick={() => {
              onBatchAssign?.(selectedIds, {
                name: assignName.trim() || undefined,
                role: assignRole.trim() || undefined,
              })
              setAssignDialogOpen(false)
            }}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 600 }}
          >
            Assign Custom
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
