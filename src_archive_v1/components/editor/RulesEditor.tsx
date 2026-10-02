import { Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type { CapabilityLevel, FileRules } from '../../types'

const CAPS: CapabilityLevel[] = ['observer', 'contributor', 'reviewer', 'approver', 'editor']

export function RulesEditor({ rules, onChange }: { rules: FileRules; onChange: (r: FileRules) => void }) {
  return (
    <Stack spacing={2}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>File Rules</Typography>
      <TextField select label="Structure editable by (min capability)" size="small"
        value={rules.structureEditableBy ?? 'editor'} onChange={e => onChange({ ...rules, structureEditableBy: e.target.value as CapabilityLevel })}
        helperText="Users below this level cannot add, edit, or delete items or field schemas.">
        {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <FormControlLabel
        control={<Checkbox size="small" checked={rules.enforcedAssignment ?? false} onChange={e => onChange({ ...rules, enforcedAssignment: e.target.checked })} />}
        label={
          <Stack>
            <Typography sx={{ fontSize: 13 }}>Enforce assignment</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Only the assigned role/name can respond to an item.</Typography>
          </Stack>
        }
      />
    </Stack>
  )
}
