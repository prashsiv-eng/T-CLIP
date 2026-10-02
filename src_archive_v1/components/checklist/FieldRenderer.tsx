import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Checkbox, FormControlLabel, InputAdornment, MenuItem, TextField, Tooltip } from '@mui/material'
import type { FieldSchema } from '../../types'

interface Props {
  schema: FieldSchema; value: string; onChange: (v: string) => void
  readOnly: boolean; required: boolean; disabledReason?: string
}

export function FieldRenderer({ schema, value, onChange, readOnly, required, disabledReason }: Props) {
  if (readOnly) {
    return (
      <Tooltip title={disabledReason ?? 'Requires higher capability'}>
        <TextField
          value={value || '—'}
          size="small" fullWidth disabled
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 13 }} /></InputAdornment> } }}
          aria-label={`${schema.label} — read only`}
        />
      </Tooltip>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <FormControlLabel
        control={<Checkbox checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} size="small" />}
        label={schema.label}
        sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
      />
    )
  }

  if (schema.type === 'select') {
    return (
      <TextField
        select size="small" fullWidth required={required}
        value={value} onChange={e => onChange(e.target.value)}
        label={schema.label}
      >
        <MenuItem value=""><em>— select —</em></MenuItem>
        {(schema.options ?? []).map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    )
  }

  if (schema.type === 'textarea') {
    return (
      <TextField
        multiline rows={3} size="small" fullWidth required={required}
        value={value} onChange={e => onChange(e.target.value)}
        slotProps={{ htmlInput: { maxLength: schema.maxLength, 'aria-label': schema.label } }}
        helperText={schema.maxLength ? `${value.length}/${schema.maxLength}` : undefined}
      />
    )
  }

  const type = schema.type === 'url' ? 'url' : schema.type === 'date' ? 'date' : 'text'
  const isInvalidUrl = type === 'url' && !!value && (() => { try { new URL(value); return false } catch { return true } })()

  return (
    <TextField
      type={type} size="small" fullWidth required={required}
      value={value} onChange={e => onChange(e.target.value)}
      slotProps={{ htmlInput: { maxLength: schema.maxLength, 'aria-label': schema.label } }}
      error={isInvalidUrl}
      helperText={isInvalidUrl ? 'Invalid URL' : undefined}
    />
  )
}
