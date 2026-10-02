import { Autocomplete, Chip, Stack, TextField } from '@mui/material'
import type { CapabilityLevel } from '../../types'

export const ROLE_OPTIONS = [
  'Observer', 'Contributor', 'Reviewer', 'Approver', 'Editor',
  'Security Lead', 'QA Engineer', 'Release Manager', 'Product Owner', 'Developer',
]

const CAP_COLORS: Record<CapabilityLevel, 'default' | 'primary' | 'secondary' | 'warning' | 'success'> = {
  observer: 'default', contributor: 'secondary', reviewer: 'primary', approver: 'warning', editor: 'success',
}

interface Props {
  name: string; role: string; capability: CapabilityLevel
  onNameChange: (v: string) => void; onRoleChange: (v: string) => void; compact?: boolean
}

export function IdentityForm({ name, role, capability, onNameChange, onRoleChange, compact }: Props) {
  return (
    <Stack direction={compact ? 'row' : 'column'} spacing={1.5} alignItems={compact ? 'center' : 'stretch'} flexWrap="wrap" useFlexGap>
      <TextField
        label={compact ? undefined : 'Your Name'}
        placeholder="Your name"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        size="small"
        sx={{ flex: compact ? '1 1 130px' : undefined }}
      />
      <RoleAutoComplete
        value={role}
        onChange={onRoleChange}
        label={compact ? undefined : 'Role'}
        sx={{ flex: compact ? '1 1 160px' : undefined }}
      />
      {role && (
        <Chip label={capability} color={CAP_COLORS[capability]} size="small" sx={{ textTransform: 'capitalize', alignSelf: 'center' }} />
      )}
    </Stack>
  )
}

interface RoleProps {
  value: string; onChange: (v: string) => void
  label?: string; placeholder?: string; sx?: object
}

export function RoleAutoComplete({ value, onChange, label, placeholder = 'Select or type a role', sx }: RoleProps) {
  return (
    <Autocomplete
      freeSolo
      options={ROLE_OPTIONS}
      value={value}
      onInputChange={(_, v) => onChange(v)}
      renderInput={params => <TextField {...params} label={label} placeholder={placeholder} size="small" />}
      sx={{ minWidth: 160, ...sx }}
    />
  )
}
