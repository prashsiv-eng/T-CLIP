import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon from '@mui/icons-material/Close'
import EditNoteIcon from '@mui/icons-material/EditNote'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import {
  canConfirm,
  canEditFields,
  canReviewDecision,
  canSetWorkStatus,
  meetsMinimum,
  STANDARD_PERSONAS,
} from '../../utils/capability'
import { getRequiredFieldIds, resolveItemFields } from '../../utils/fields'
import { FieldRenderer } from './FieldRenderer'
import { StatusBadge } from './StatusBadge'

interface Props {
  open: boolean
  item: ReviewedItem | null
  file: ChecklistFile
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onAssignItem?: (id: string, assignedTo?: { role?: string; name?: string }) => void
  onClose: () => void
}

export function ItemResponseDrawer({
  open,
  item,
  file,
  userCapability,
  userName,
  userRole,
  onSaveResponse,
  onConfirm,
  onAssignItem,
  onClose,
}: Props) {
  const [status, setStatus] = useState<ItemStatus>('not-started')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [override, setOverride] = useState('')
  const [changeRequestNotes, setChangeRequestNotes] = useState('')
  const [showChangeRequest, setShowChangeRequest] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isEditingAssign, setIsEditingAssign] = useState(false)
  const [assignRole, setAssignRole] = useState('')
  const [assignName, setAssignName] = useState('')

  useEffect(() => {
    if (item) {
      setStatus(item.status)
      const lastAction = item.history[item.history.length - 1]
      setFieldValues(lastAction?.fieldValues ?? item.values ?? {})
      setOverride('')
      setChangeRequestNotes('')
      setShowChangeRequest(false)
      setIsEditingAssign(false)
      setAssignRole(item.assignedTo?.role ?? '')
      setAssignName(item.assignedTo?.name ?? '')
      setErrors([])
    }
  }, [item])

  if (!item) return null

  // Role permissions
  const personas = file.personas
  const isReadOnly = userCapability === 'read-only'
  const allowEditFields = !isReadOnly && canEditFields(userRole, personas)
  const allowWorkStatus = !isReadOnly && canSetWorkStatus(userRole, personas)
  const allowReview = !isReadOnly && canReviewDecision(userRole, personas)
  const allowApprove = !isReadOnly && canConfirm(userRole, personas)

  const isAssignedToMe =
    (item.assignedTo?.name && item.assignedTo.name.toLowerCase() === userName.toLowerCase()) ||
    (item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase()))

  const availablePersonas = file.personas && file.personas.length > 0 ? file.personas : STANDARD_PERSONAS

  const resolvedFields = resolveItemFields(item, file.fields).filter(f =>
    meetsMinimum(userCapability, f.visibleTo ?? 'read-only')
  )
  const requiredIds = getRequiredFieldIds(resolvedFields, status)

  function validateFields(): boolean {
    const errs = requiredIds
      .filter(id => !fieldValues[id]?.trim())
      .map(id => `"${resolvedFields.find(f => f.id === id)?.label ?? id}" is required`)
    if (errs.length > 0) {
      setErrors(errs)
      return false
    }
    setErrors([])
    return true
  }

  function handleSaveStatus(targetStatus: ItemStatus, notes?: string) {
    if (!item) return
    if (!validateFields()) return

    setStatus(targetStatus)
    onSaveResponse(item.id, {
      actorName: userName,
      role: userRole,
      status: targetStatus,
      fieldValues,
      notes,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  function handleSaveFieldsOnly() {
    if (!item) return
    if (!validateFields()) return

    onSaveResponse(item.id, {
      actorName: userName,
      role: userRole,
      status,
      fieldValues,
      notes: 'Updated evidence & notes',
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 540 } } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              component="code"
              sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}
            >
              {item.id}
            </Typography>
            <StatusBadge status={item.status} />
            {item.required && (
              <Chip
                label="Required"
                size="small"
                variant="outlined"
                sx={{
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  bgcolor: 'rgba(241, 245, 249, 0.6)',
                  fontSize: 10,
                  fontWeight: 600,
                  height: 20,
                }}
              />
            )}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Description & Category */}
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'text.secondary',
                letterSpacing: '0.05em',
                mb: 0.5,
              }}
            >
              {item.category}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: 'text.primary', lineHeight: 1.5 }}>
              {item.description}
            </Typography>
            {/* Assignment Section */}
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(241, 245, 249, 0.6)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PersonOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                    Assigned to:
                  </Typography>
                  {item.assignedTo ? (
                    <Chip
                      label={
                        item.assignedTo.name
                          ? `${item.assignedTo.name} (${item.assignedTo.role})`
                          : item.assignedTo.role
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  ) : (
                    <Chip
                      label="Unassigned"
                      size="small"
                      variant="outlined"
                      sx={{ color: '#94a3b8', borderColor: '#cbd5e1', fontStyle: 'italic', fontSize: 11 }}
                    />
                  )}
                </Box>

                {!isReadOnly && onAssignItem && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {!isEditingAssign && !isAssignedToMe && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => onAssignItem(item.id, { name: userName, role: userRole })}
                        sx={{ fontSize: 11, py: 0.25, px: 0.75, textTransform: 'none', color: '#2563eb' }}
                      >
                        Assign to me
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={isEditingAssign ? <CloseIcon sx={{ fontSize: 13 }} /> : item.assignedTo ? <EditOutlinedIcon sx={{ fontSize: 13 }} /> : <PersonAddOutlinedIcon sx={{ fontSize: 13 }} />}
                      onClick={() => {
                        if (!isEditingAssign) {
                          setAssignRole(item.assignedTo?.role ?? '')
                          setAssignName(item.assignedTo?.name ?? '')
                        }
                        setIsEditingAssign(!isEditingAssign)
                      }}
                      sx={{ fontSize: 11, py: 0.25, px: 1, textTransform: 'none' }}
                    >
                      {isEditingAssign ? 'Cancel' : item.assignedTo ? 'Change' : 'Assign'}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Assignment Form / Dropdown */}
              {isEditingAssign && !isReadOnly && onAssignItem && (
                <Box sx={{ mt: 0.5, pt: 1, borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Persona Quick Pick */}
                  {availablePersonas.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                        Select Team Persona:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {availablePersonas.map(p => {
                          const isSelected = item.assignedTo?.role === p.label || item.assignedTo?.role === p.role
                          return (
                            <Chip
                              key={p.id}
                              label={p.label}
                              size="small"
                              clickable
                              color={isSelected ? 'primary' : 'default'}
                              variant={isSelected ? 'filled' : 'outlined'}
                              onClick={() => {
                                onAssignItem(item.id, { role: p.label })
                                setIsEditingAssign(false)
                              }}
                              sx={{ fontSize: 11 }}
                            />
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Custom Name & Role */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Assignee Name"
                      placeholder="e.g. Jane Doe"
                      value={assignName}
                      onChange={e => setAssignName(e.target.value)}
                      sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: 12 } }}
                    />
                    <TextField
                      size="small"
                      label="Role"
                      placeholder="e.g. Security Reviewer"
                      value={assignRole}
                      onChange={e => setAssignRole(e.target.value)}
                      sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: 12 } }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        if (assignRole.trim() || assignName.trim()) {
                          onAssignItem(item.id, {
                            role: assignRole.trim() || undefined,
                            name: assignName.trim() || undefined,
                          })
                        }
                        setIsEditingAssign(false)
                      }}
                      disabled={!assignRole.trim() && !assignName.trim()}
                      sx={{ fontSize: 11, py: 0.8, textTransform: 'none' }}
                    >
                      Save
                    </Button>
                  </Box>

                  {/* Actions: Assign to Me & Clear */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        onAssignItem(item.id, { name: userName, role: userRole })
                        setIsEditingAssign(false)
                      }}
                      sx={{ fontSize: 11, textTransform: 'none', color: '#2563eb' }}
                    >
                      Assign to me ({userName || 'User'} · {userRole})
                    </Button>

                    {item.assignedTo && (
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() => {
                          onAssignItem(item.id, undefined)
                          setIsEditingAssign(false)
                        }}
                        sx={{ fontSize: 11, textTransform: 'none' }}
                      >
                        Clear Assignment
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
            {item.confirmedBy && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip label={`Confirmed by ${item.confirmedBy.actorName}`} size="small" color="success" />
              </Box>
            )}
          </Box>

          <Divider />

          {/* Read-Only Notice */}
          {isReadOnly && (
            <Alert severity="info" sx={{ fontSize: 13 }}>
              You are logged in as <strong>{userRole}</strong> (Read-only mode). You can inspect fields and history, but cannot alter statuses or save changes.
            </Alert>
          )}

          {/* Workflow Stage Controls */}
          {!isReadOnly && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                }}
              >
                Workflow Controls (Logged in as: {userRole})
              </Typography>

              {/* Developer / Editor Work Controls */}
              {allowWorkStatus && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(56, 189, 248, 0.05)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#0284c7' }}>
                    Editor Implementation Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant={status === 'in-progress' ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<EditNoteIcon />}
                      onClick={() => handleSaveStatus('in-progress')}
                      sx={{ textTransform: 'none', fontSize: 12 }}
                    >
                      Mark In-Progress
                    </Button>
                    <Button
                      variant={status === 'blocked' ? 'contained' : 'outlined'}
                      color="error"
                      size="small"
                      startIcon={<BlockIcon />}
                      onClick={() => handleSaveStatus('blocked', 'Blocked waiting on dependency')}
                      sx={{ textTransform: 'none', fontSize: 12 }}
                    >
                      Mark Blocked
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      startIcon={<SendOutlinedIcon />}
                      onClick={() => handleSaveStatus('in-review', 'Submitted for review')}
                      sx={{
                        textTransform: 'none',
                        fontSize: 12,
                        bgcolor: '#9333ea',
                        '&:hover': { bgcolor: '#7e22ce' },
                      }}
                    >
                      Submit for Review
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Reviewer Evaluation Controls */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: allowReview ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: allowReview ? 'rgba(16, 185, 129, 0.25)' : 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  opacity: allowReview ? 1 : 0.65,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: allowReview ? '#059669' : 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    Reviewer Decision (Pass / Fail / N/A)
                    {!allowReview && (
                      <Tooltip title="Requires Reviewer role (Security / QA / Approver)">
                        <LockOutlinedIcon sx={{ fontSize: 13 }} />
                      </Tooltip>
                    )}
                  </Typography>
                  {allowReview && (
                    <Button
                      size="small"
                      startIcon={<UndoOutlinedIcon />}
                      onClick={() => setShowChangeRequest(!showChangeRequest)}
                      sx={{ fontSize: 11, textTransform: 'none', color: '#d97706' }}
                    >
                      {showChangeRequest ? 'Cancel' : 'Request Changes'}
                    </Button>
                  )}
                </Box>

                {/* Change Request Box */}
                {showChangeRequest && allowReview && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'rgba(245, 158, 11, 0.08)',
                      borderRadius: 1.5,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder="Notes on what changes/evidence are required..."
                      value={changeRequestNotes}
                      onChange={e => setChangeRequestNotes(e.target.value)}
                      multiline
                      rows={2}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!changeRequestNotes.trim()}
                      onClick={() =>
                        handleSaveStatus('in-progress', `Changes Requested: ${changeRequestNotes.trim()}`)
                      }
                      sx={{
                        alignSelf: 'flex-end',
                        bgcolor: '#d97706',
                        '&:hover': { bgcolor: '#b45309' },
                        textTransform: 'none',
                        fontSize: 12,
                      }}
                    >
                      Return to In-Progress
                    </Button>
                  </Box>
                )}

                {/* Pass / Fail / NA buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant={status === 'pass' ? 'contained' : 'outlined'}
                    color="success"
                    size="small"
                    disabled={!allowReview}
                    startIcon={<CheckCircleOutlinedIcon />}
                    onClick={() => handleSaveStatus('pass')}
                    sx={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Pass
                  </Button>
                  <Button
                    variant={status === 'failed' ? 'contained' : 'outlined'}
                    color="error"
                    size="small"
                    disabled={!allowReview}
                    startIcon={<HighlightOffIcon />}
                    onClick={() => handleSaveStatus('failed')}
                    sx={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Failed
                  </Button>
                  <Button
                    variant={status === 'na' ? 'contained' : 'outlined'}
                    size="small"
                    disabled={!allowReview}
                    startIcon={<RemoveCircleOutlinedIcon />}
                    onClick={() => handleSaveStatus('na')}
                    sx={{
                      textTransform: 'none',
                      fontSize: 12,
                      color: '#64748b',
                      borderColor: '#cbd5e1',
                      '&:hover': { borderColor: '#94a3b8' },
                    }}
                  >
                    N/A
                  </Button>
                </Box>
              </Box>

              {/* Dynamic Fields & Evidence Form */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                  }}
                >
                  Evidence & Verification Fields
                </Typography>

                {resolvedFields.map(field => {
                  const editable =
                    allowEditFields && meetsMinimum(userCapability, field.editableBy ?? 'editor')
                  const isReq = requiredIds.includes(field.id)
                  return (
                    <Box key={field.id}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75, color: 'text.secondary' }}>
                        {field.label}
                        {isReq && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
                      </Typography>
                      <FieldRenderer
                        schema={field}
                        value={fieldValues[field.id] ?? ''}
                        onChange={v => setFieldValues(fv => ({ ...fv, [field.id]: v }))}
                        readOnly={!editable}
                        required={isReq}
                        disabledReason={`Requires ${field.editableBy ?? 'editor'} capability`}
                      />
                    </Box>
                  )
                })}

                {errors.length > 0 && (
                  <Alert severity="error">
                    {errors.map((e, i) => (
                      <div key={i}>• {e}</div>
                    ))}
                  </Alert>
                )}

                {/* Save Evidence Button */}
                {allowEditFields && (
                  <Box sx={{ display: 'flex', gap: 1, pt: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" onClick={handleSaveFieldsOnly} sx={{ px: 3 }}>
                      Save Evidence & Notes
                    </Button>
                    {allowApprove && item.history.length > 0 && !item.confirmedBy && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          onConfirm(item.id, {
                            actorName: userName,
                            role: userRole,
                            status: item.status,
                            fieldValues: {},
                            timestamp: new Date().toISOString(),
                          })
                          onClose()
                        }}
                      >
                        Confirm Review
                      </Button>
                    )}
                  </Box>
                )}

                {/* Approver Override Section */}
                {allowApprove && item.history.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 1, color: 'text.primary' }}>
                      Approver Override
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Justification for override..."
                        value={override}
                        onChange={e => setOverride(e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!override.trim()}
                        sx={{
                          bgcolor: '#475569',
                          color: '#ffffff',
                          '&:hover': { bgcolor: '#334155' },
                          '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' },
                        }}
                        onClick={() => {
                          onSaveResponse(item.id, {
                            actorName: userName,
                            role: userRole,
                            status,
                            fieldValues: { ...fieldValues, override_justification: override },
                            notes: `Approver Override: ${override}`,
                            timestamp: new Date().toISOString(),
                          })
                          onClose()
                        }}
                      >
                        Override
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Audit History */}
          {item.history.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  mb: 1.5,
                }}
              >
                Audit History ({item.history.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {item.history.map((a, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {a.actorName}{' '}
                        <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                          ({a.role})
                        </Box>
                      </Typography>
                      <StatusBadge status={a.status} size="small" />
                    </Box>
                    {a.notes && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>
                        {a.notes}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}
