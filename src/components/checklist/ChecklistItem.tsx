import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip,
  FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Tooltip, Typography,
} from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { meetsMinimum } from '../../utils/capability'
import { getRequiredFieldIds, resolveItemFields } from '../../utils/fields'
import { FieldRenderer } from './FieldRenderer'


const STATUS_BORDER: Record<ItemStatus, string> = {
  pending: '#cbd5e1', pass: '#16a34a', fail: '#dc2626', na: '#e2e8f0',
}

interface Props {
  item: ReviewedItem; file: ChecklistFile; userCapability: CapabilityLevel
  userName: string; userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onEditItem?: () => void
}

export function ChecklistItem({ item, file, userCapability, userName, userRole, onSaveResponse, onConfirm, onEditItem }: Props) {
  const [status, setStatus] = useState<ItemStatus>(item.status)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(item.values ?? {})
  const [override, setOverride] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const canEdit = meetsMinimum(userCapability, item.statusEditableBy ?? 'reviewer')
  const canApprove = meetsMinimum(userCapability, 'approver')
  const isObserver = userCapability === 'observer'

  const resolvedFields = resolveItemFields(item, file.fields)
    .filter(f => meetsMinimum(userCapability, f.visibleTo ?? 'observer'))
  const requiredIds = getRequiredFieldIds(resolvedFields, status)

  const isAssigned =
    (item.assignedTo?.name && item.assignedTo.name.toLowerCase() === userName.toLowerCase()) ||
    (item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase()))

  function handleSave() {
    const errs = requiredIds.filter(id => !fieldValues[id]?.trim())
      .map(id => `"${resolvedFields.find(f => f.id === id)?.label ?? id}" is required`)
    if (errs.length) { setErrors(errs); return }
    setErrors([])
    onSaveResponse(item.id, { actorName: userName, role: userRole, status, fieldValues, timestamp: new Date().toISOString() })
  }

  const lastAction = item.history[item.history.length - 1]

  return (
    <Box sx={{
      border: '1px solid', borderLeft: '4px solid',
      borderColor: '#e2e8f0', borderLeftColor: STATUS_BORDER[item.status],
      borderRadius: 2, bgcolor: '#ffffff',
      outline: isAssigned ? '2px solid rgba(37, 99, 235, 0.25)' : 'none',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      '&:hover': {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      },
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1, p: 1.5, pb: 1 }}>
        <Typography component="code" sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.disabled', mt: 0.25, flexShrink: 0, fontWeight: 600 }}>
          {item.id}
        </Typography>
        <Typography sx={{ fontSize: 13, flex: 1, fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }}>{item.description}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
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
          {item.assignedTo && (
            <Chip
              label={item.assignedTo.name ?? item.assignedTo.role}
              size="small"
              variant="outlined"
              sx={{
                color: '#2563eb',
                borderColor: '#bfdbfe',
                bgcolor: '#eff6ff',
                fontSize: 10,
                fontWeight: 500,
                height: 20,
              }}
            />
          )}
          {item.confirmedBy && <Chip label="✓" size="small" color="success" sx={{ height: 20, fontSize: 11 }} />}
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
          {onEditItem && (
            <Box component="span" sx={{ fontSize: 13, cursor: 'pointer', color: 'text.secondary', px: 0.5 }} onClick={onEditItem}>✎</Box>
          )}
        </Box>
      </Box>

      {lastAction && (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', px: 1.5, pb: 0.75 }}>
          Last: <strong>{lastAction.actorName}</strong> · {lastAction.role} · {new Date(lastAction.timestamp).toLocaleDateString()}
        </Typography>
      )}

      {/* Respond */}
      {!isObserver && (
        <Accordion disableGutters elevation={0}
          sx={{ '&:before': { display: 'none' }, border: 'none', borderTop: '1px solid #f1f5f9', borderRadius: '0 !important' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
            sx={{ minHeight: 36, px: 1.5, py: 0, bgcolor: '#f8fafc', '& .MuiAccordionSummary-content': { my: 0.75 } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>Respond</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, py: 1.5 }}>
            <FormControl component="fieldset" sx={{ mb: 1.5 }}>
              <FormLabel sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Status
                {!canEdit && (
                  <Tooltip title={`Requires ${item.statusEditableBy ?? 'reviewer'}`}>
                    <LockOutlinedIcon sx={{ fontSize: 12 }} />
                  </Tooltip>
                )}
              </FormLabel>
              <RadioGroup row value={status} onChange={e => canEdit && setStatus(e.target.value as ItemStatus)}>
                {(['pass', 'fail', 'na'] as ItemStatus[]).map(s => (
                  <FormControlLabel key={s} value={s}
                    control={<Radio size="small" disabled={!canEdit} />}
                    label={<Typography sx={{ fontSize: 12, fontWeight: status === s ? 600 : 400, textTransform: 'capitalize' }}>{s}</Typography>}
                    sx={{ mr: 1.5 }} />
                ))}
              </RadioGroup>
            </FormControl>

            {resolvedFields.map(field => {
              const editable = meetsMinimum(userCapability, field.editableBy ?? 'reviewer')
              const isReq = requiredIds.includes(field.id)
              return (
                <Box key={field.id} sx={{ mb: 1.25 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, mb: 0.5, color: 'text.secondary' }}>
                    {field.label}{isReq && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
                  </Typography>
                  <FieldRenderer schema={field} value={fieldValues[field.id] ?? ''}
                    onChange={v => setFieldValues(fv => ({ ...fv, [field.id]: v }))}
                    readOnly={!editable} required={isReq}
                    disabledReason={`Requires ${field.editableBy ?? 'reviewer'} capability`} />
                </Box>
              )
            })}

            {errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                {errors.map((e, i) => <div key={i}>• {e}</div>)}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
              <Button variant="contained" size="small" onClick={handleSave}>Save Response</Button>
              {canApprove && item.history.length > 0 && !item.confirmedBy && (
                <>
                  <Button variant="contained" size="small" color="success"
                    onClick={() => onConfirm(item.id, { actorName: userName, role: userRole, status: item.status, fieldValues: {}, timestamp: new Date().toISOString() })}>
                    ✓ Confirm
                  </Button>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%', mt: 0.5 }}>
                    <TextField size="small" placeholder="Override justification" value={override}
                      onChange={e => setOverride(e.target.value)} sx={{ flex: 1 }} />
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
                        if (!override.trim()) return
                        onSaveResponse(item.id, { actorName: userName, role: userRole, status, fieldValues: { ...fieldValues, override_justification: override }, timestamp: new Date().toISOString() })
                        setOverride('')
                      }}>
                      Override
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* History */}
      {item.history.length > 0 && (
        <Accordion disableGutters elevation={0}
          sx={{ '&:before': { display: 'none' }, border: 'none', borderTop: '1px solid #f1f5f9', borderRadius: '0 !important' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
            sx={{ minHeight: 32, px: 1.5, py: 0, '& .MuiAccordionSummary-content': { my: 0.625 } }}>
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>History ({item.history.length})</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, py: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {item.history.map((a, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap' }}>{new Date(a.timestamp).toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 11 }}><strong>{a.actorName}</strong> · {a.role}</Typography>
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
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
