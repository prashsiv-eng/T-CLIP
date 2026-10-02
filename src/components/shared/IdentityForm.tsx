import { Autocomplete, Chip, TextField , Box } from '@mui/material'
import type { CapabilityLevel } from '../../types'

export const ROLE_OPTIONS = [
  'Developer', 'DevOps Engineer', 'QA Engineer', 'Security Reviewer',
  'Tech Lead', 'Release Manager', 'Project Admin', 'Auditor',
  'editor', 'reviewer', 'approver', 'sign-off', 'master', 'read-only',
]

const CAP_COLOR: Record<CapabilityLevel, 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'info'> = {
  'read-only': 'default',
  editor: 'info',
  reviewer: 'secondary',
  approver: 'warning',
  'sign-off': 'success',
  master: 'primary',
}

interface Props {
  name: string; role: string; capability: CapabilityLevel
  onNameChange: (v: string) => void; onRoleChange: (v: string) => void
  compact?: boolean
}

export function IdentityForm({ name, role, capability, onNameChange, onRoleChange, compact }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexWrap: 'wrap' }}>
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
        <Chip label={capability} color={CAP_COLOR[capability]} size="small"
          sx={{ textTransform: 'capitalize', alignSelf: 'center' }} />
      )}
    </Box>
  )
}

interface RoleACProps {
  value: string; onChange: (v: string) => void
  label?: string; placeholder?: string; sx?: object
}

export function RoleAutoComplete({ value, onChange, label, placeholder = 'Select or type a role', sx }: RoleACProps) {
  return (
    <Autocomplete
      freeSolo
      options={ROLE_OPTIONS}
      value={value}
      onInputChange={(_, v) => onChange(v ?? '')}
      renderInput={params => (
        <TextField {...params} label={label} placeholder={placeholder} size="small" />
      )}
      sx={{ minWidth: 160, ...sx }}
    />
  )
}
