import CloseIcon from '@mui/icons-material/Close'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { meetsMinimum } from '../../utils/capability'
import { getRequiredFieldIds, resolveItemFields } from '../../utils/fields'
import { FieldRenderer } from './FieldRenderer'



interface Props {
  open: boolean
  item: ReviewedItem | null
  file: ChecklistFile
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onClose: () => void
}

export function ItemResponseDrawer({
  open, item, file, userCapability, userName, userRole,
  onSaveResponse, onConfirm, onClose,
}: Props) {
  const [status, setStatus] = useState<ItemStatus>('pending')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [override, setOverride] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (item) {
      setStatus(item.status)
      const lastAction = item.history[item.history.length - 1]
      setFieldValues(lastAction?.fieldValues ?? item.values ?? {})
      setOverride('')
      setErrors([])
    }
  }, [item])

  if (!item) return null

  const canEdit = meetsMinimum(userCapability, item.statusEditableBy ?? 'reviewer')
  const canApprove = meetsMinimum(userCapability, 'approver')
  const isObserver = userCapability === 'observer'

  const resolvedFields = resolveItemFields(item, file.fields)
    .filter(f => meetsMinimum(userCapability, f.visibleTo ?? 'observer'))
  const requiredIds = getRequiredFieldIds(resolvedFields, status)

  function handleSave() {
    if (!item) return
    const errs = requiredIds
      .filter(id => !fieldValues[id]?.trim())
      .map(id => `"${resolvedFields.find(f => f.id === id)?.label ?? id}" is required`)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    onSaveResponse(item.id, {
      actorName: userName,
      role: userRole,
      status,
      fieldValues,
      timestamp: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 500 } } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="code" sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
              {item.id}
            </Typography>
            {item.status === 'pending' && (
              <Chip
                label="pending"
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 11,
                  height: 22,
                }}
              />
            )}
            {item.status === 'pass' && (
              <Chip label="pass" size="small" color="success" sx={{ fontSize: 11, fontWeight: 600, height: 22 }} />
            )}
            {item.status === 'fail' && (
              <Chip label="fail" size="small" color="error" sx={{ fontSize: 11, fontWeight: 600, height: 22 }} />
            )}
            {item.status === 'na' && (
              <Chip
                label="n/a"
                size="small"
                variant="outlined"
                sx={{ color: '#94a3b8', borderColor: '#e2e8f0', fontSize: 11, height: 22 }}
              />
            )}
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
          {/* Description & Metadata */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.05em', mb: 0.5 }}>
              {item.category}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: 'text.primary', lineHeight: 1.5 }}>
              {item.description}
            </Typography>
            {item.assignedTo && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Assigned to:</Typography>
                <Chip label={item.assignedTo.name ? `${item.assignedTo.name} (${item.assignedTo.role})` : item.assignedTo.role} size="small" color="primary" variant="outlined" />
              </Box>
            )}
            {item.confirmedBy && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip label={`Confirmed by ${item.confirmedBy.actorName}`} size="small" color="success" />
              </Box>
            )}
          </Box>

          <Divider />

          {/* Form */}
          {!isObserver ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl component="fieldset">
                <FormLabel sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Review Status
                  {!canEdit && (
                    <Tooltip title={`Requires ${item.statusEditableBy ?? 'reviewer'} capability`}>
                      <LockOutlinedIcon sx={{ fontSize: 13 }} />
                    </Tooltip>
                  )}
                </FormLabel>
                <RadioGroup row value={status} onChange={e => canEdit && setStatus(e.target.value as ItemStatus)}>
                  {(['pass', 'fail', 'na'] as ItemStatus[]).map(s => (
                    <FormControlLabel
                      key={s}
                      value={s}
                      control={<Radio size="small" disabled={!canEdit} />}
                      label={<Typography sx={{ fontSize: 13, textTransform: 'capitalize', fontWeight: status === s ? 600 : 400 }}>{s}</Typography>}
                      sx={{ mr: 2 }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {resolvedFields.map(field => {
                const editable = meetsMinimum(userCapability, field.editableBy ?? 'reviewer')
                const isReq = requiredIds.includes(field.id)
                return (
                  <Box key={field.id}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75, color: 'text.secondary' }}>
                      {field.label}{isReq && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
                    </Typography>
                    <FieldRenderer
                      schema={field}
                      value={fieldValues[field.id] ?? ''}
                      onChange={v => setFieldValues(fv => ({ ...fv, [field.id]: v }))}
                      readOnly={!editable}
                      required={isReq}
                      disabledReason={`Requires ${field.editableBy ?? 'reviewer'} capability`}
                    />
                  </Box>
                )
              })}

              {errors.length > 0 && (
                <Alert severity="error">
                  {errors.map((e, i) => <div key={i}>• {e}</div>)}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, pt: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={handleSave} sx={{ px: 3 }}>
                  Save Response
                </Button>
                {canApprove && item.history.length > 0 && !item.confirmedBy && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                      onConfirm(item.id, { actorName: userName, role: userRole, status: item.status, fieldValues: {}, timestamp: new Date().toISOString() })
                      onClose()
                    }}
                  >
                    Confirm Review
                  </Button>
                )}
              </Box>

              {/* Approver Override Section */}
              {canApprove && item.history.length > 0 && (
                <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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
          ) : (
            <Alert severity="info">
              You are viewing this checklist as an <strong>Observer</strong> (Read-only mode).
            </Alert>
          )}

          {/* History */}
          {item.history.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5 }}>
                Audit History ({item.history.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {item.history.map((a, i) => (
                  <Box key={i} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a.actorName} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>({a.role})</Box></Typography>
                      {a.status === 'pending' ? (
                        <Chip label="pending" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: 10, height: 20 }} />
                      ) : a.status === 'pass' ? (
                        <Chip label="pass" size="small" color="success" sx={{ fontSize: 10, height: 20 }} />
                      ) : a.status === 'fail' ? (
                        <Chip label="fail" size="small" color="error" sx={{ fontSize: 10, height: 20 }} />
                      ) : (
                        <Chip label="n/a" size="small" variant="outlined" sx={{ color: '#94a3b8', borderColor: '#e2e8f0', fontSize: 10, height: 20 }} />
                      )}
                    </Box>
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
