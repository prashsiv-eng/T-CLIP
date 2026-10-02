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
        <span>
          <TextField value={value || '—'} size="small" fullWidth disabled
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 13 }} /></InputAdornment> } }} />
        </span>
      </Tooltip>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <FormControlLabel
        control={<Checkbox checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} size="small" />}
        label={schema.label}
      />
    )
  }

  if (schema.type === 'select') {
    return (
      <TextField select size="small" fullWidth required={required} value={value}
        onChange={e => onChange(e.target.value)} label={undefined}>
        <MenuItem value=""><em>— select —</em></MenuItem>
        {(schema.options ?? []).map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    )
  }

  if (schema.type === 'textarea') {
    return (
      <TextField multiline rows={3} size="small" fullWidth required={required}
        value={value} onChange={e => onChange(e.target.value)}
        slotProps={{ htmlInput: { maxLength: schema.maxLength } }}
        helperText={schema.maxLength ? `${value.length}/${schema.maxLength}` : undefined} />
    )
  }

  const type = schema.type === 'url' ? 'url' : schema.type === 'date' ? 'date' : 'text'
  const isInvalidUrl = type === 'url' && !!value && (() => { try { new URL(value); return false } catch { return true } })()

  return (
    <TextField type={type} size="small" fullWidth required={required}
      value={value} onChange={e => onChange(e.target.value)}
      slotProps={{ htmlInput: { maxLength: schema.maxLength } }}
      error={isInvalidUrl} helperText={isInvalidUrl ? 'Invalid URL' : undefined} />
  )
}
