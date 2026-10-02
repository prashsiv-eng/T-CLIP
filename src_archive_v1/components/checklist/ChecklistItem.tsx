import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip,
  FormControl, FormControlLabel, FormLabel, Radio, RadioGroup,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { meetsMinimum } from '../../utils/capability'
import { getRequiredFieldIds, resolveItemFields } from '../../utils/fields'
import { FieldRenderer } from './FieldRenderer'

const STATUS_COLOR: Record<ItemStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning', pass: 'success', fail: 'error', na: 'default',
}
const STATUS_BORDER: Record<ItemStatus, string> = {
  pending: '#d97706', pass: '#16a34a', fail: '#dc2626', na: '#e2e8f0',
}

interface Props {
  item: ReviewedItem; file: ChecklistFile; userCapability: CapabilityLevel
  userName: string; userRole: string
  onSaveResponse: (itemId: string, action: ReviewAction) => void
  onConfirm: (itemId: string, action: ReviewAction) => void
  onEditItem?: () => void
}

export function ChecklistItem({ item, file, userCapability, userName, userRole, onSaveResponse, onConfirm, onEditItem }: Props) {
  const [status, setStatus] = useState<ItemStatus>(item.status)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(item.values ?? {})
  const [overrideJustification, setOverrideJustification] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const canEdit = meetsMinimum(userCapability, item.statusEditableBy ?? 'reviewer')
  const canApprove = meetsMinimum(userCapability, 'approver')
  const isObserver = userCapability === 'observer'

  const resolvedFields = resolveItemFields(item, file.fields).filter(f => meetsMinimum(userCapability, f.visibleTo ?? 'observer'))
  const requiredIds = getRequiredFieldIds(resolvedFields, status)

  const isAssigned =
    (item.assignedTo?.name && item.assignedTo.name.toLowerCase() === userName.toLowerCase()) ||
    (item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase()))

  function handleSave() {
    const errs: string[] = []
    for (const id of requiredIds) {
      if (!fieldValues[id]?.trim()) {
        const field = resolvedFields.find(f => f.id === id)
        errs.push(`"${field?.label ?? id}" is required`)
      }
    }
    if (errs.length) { setErrors(errs); return }
    setErrors([])
    onSaveResponse(item.id, { actorName: userName, role: userRole, status, fieldValues, timestamp: new Date().toISOString() })
  }

  function handleConfirm() {
    onConfirm(item.id, { actorName: userName, role: userRole, status: item.status, fieldValues: {}, timestamp: new Date().toISOString() })
  }

  function handleOverride() {
    if (!overrideJustification.trim()) return
    onSaveResponse(item.id, { actorName: userName, role: userRole, status, fieldValues: { ...fieldValues, override_justification: overrideJustification }, timestamp: new Date().toISOString() })
    setOverrideJustification('')
  }

  const lastAction = item.history[item.history.length - 1]

  return (
    <Box sx={{
      border: '1px solid', borderLeft: '3px solid',
      borderColor: 'divider', borderLeftColor: STATUS_BORDER[item.status],
      borderRadius: 1.5, bgcolor: 'background.paper',
      outline: isAssigned ? '2px solid #2563eb22' : 'none',
    }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ p: 1.5, pb: 1 }}>
        <Typography component="code" sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', mt: 0.25, flexShrink: 0 }}>{item.id}</Typography>
        <Typography sx={{ fontSize: 13, flex: 1 }}>{item.description}</Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
          {item.required && <Chip label="Req" size="small" color="warning" variant="outlined" />}
          {item.assignedTo && <Chip label={item.assignedTo.name ?? item.assignedTo.role} size="small" color="primary" variant="outlined" />}
          {item.confirmedBy && <Chip label="✓" size="small" color="success" />}
          <Chip label={item.status} color={STATUS_COLOR[item.status]} size="small" />
          {onEditItem && <Box component="span" sx={{ fontSize: 13, cursor: 'pointer', color: 'text.secondary', px: 0.5 }} onClick={onEditItem}>✎</Box>}
        </Stack>
      </Stack>

      {lastAction && (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', px: 1.5, pb: 0.75 }}>
          Last: <strong>{lastAction.actorName}</strong> · {lastAction.role} · {new Date(lastAction.timestamp).toLocaleDateString()}
        </Typography>
      )}

      {/* Respond */}
      {!isObserver && (
        <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, border: 'none', borderTop: '1px solid #f1f5f9' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 36, px: 1.5, py: 0, bgcolor: '#f8fafc', '& .MuiAccordionSummary-content': { my: 0.75 } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>Respond</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, py: 1.5 }}>
            <FormControl component="fieldset" sx={{ mb: 1.5 }}>
              <FormLabel sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                Status {!canEdit && <Tooltip title={`Requires ${item.statusEditableBy ?? 'reviewer'}`}><LockOutlinedIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} /></Tooltip>}
              </FormLabel>
              <RadioGroup row value={status} onChange={e => canEdit && setStatus(e.target.value as ItemStatus)}>
                {(['pass', 'fail', 'na'] as ItemStatus[]).map(s => (
                  <FormControlLabel key={s} value={s} control={<Radio size="small" disabled={!canEdit} />}
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

            {errors.length > 0 && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12 }}>{errors.map((e, i) => <div key={i}>• {e}</div>)}</Alert>}

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" size="small" onClick={handleSave}>Save Response</Button>
              {canApprove && item.history.length > 0 && !item.confirmedBy && (
                <>
                  <Button variant="contained" size="small" color="success" onClick={handleConfirm}>✓ Confirm</Button>
                  <Stack direction="row" spacing={1} sx={{ width: '100%', mt: 0.5 }}>
                    <TextField size="small" placeholder="Override justification (required)"
                      value={overrideJustification} onChange={e => setOverrideJustification(e.target.value)}
                      sx={{ flex: 1 }} />
                    <Button variant="contained" color="warning" size="small" disabled={!overrideJustification.trim()} onClick={handleOverride}>Override</Button>
                  </Stack>
                </>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* History */}
      {item.history.length > 0 && (
        <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, border: 'none', borderTop: '1px solid #f1f5f9' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 32, px: 1.5, py: 0, bgcolor: 'transparent', '& .MuiAccordionSummary-content': { my: 0.625 } }}>
            <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>History ({item.history.length})</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 1.5, py: 1 }}>
            <Stack spacing={0.5}>
              {item.history.map((a, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap' }}>{new Date(a.timestamp).toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 11 }}><strong>{a.actorName}</strong> · {a.role}</Typography>
                  <Chip label={a.status} color={STATUS_COLOR[a.status]} size="small" />
                </Stack>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  )
}
