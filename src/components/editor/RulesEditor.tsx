import { Checkbox, FormControlLabel, MenuItem, TextField, Typography , Box } from '@mui/material'
import type { CapabilityLevel, FileRules } from '../../types'

const CAPS: CapabilityLevel[] = ['read-only', 'editor', 'reviewer', 'approver', 'sign-off', 'master']

export function RulesEditor({ rules, onChange }: { rules: FileRules; onChange: (r: FileRules) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" sx={{ color: 'text.secondary' }}>File Rules</Typography>
      <TextField select label="Structure editable by (min capability)" size="small"
        value={rules.structureEditableBy ?? 'editor'}
        onChange={e => onChange({ ...rules, structureEditableBy: e.target.value as CapabilityLevel })}
        helperText="Users below this level cannot add, edit, or delete items or field schemas.">
        {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <FormControlLabel
        control={<Checkbox size="small" checked={rules.enforcedAssignment ?? false}
          onChange={e => onChange({ ...rules, enforcedAssignment: e.target.checked })} />}
        label={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: 13 }}>Enforce assignment</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Only the assigned role/name can respond.</Typography>
          </Box>
        }
      />
    </Box>
  )
}
