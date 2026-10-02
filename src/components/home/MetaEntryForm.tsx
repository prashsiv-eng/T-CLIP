import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { darkTheme } from '../../theme'
import type { PersonaDefinition, RoleType } from '../../types'
import { ROLE_ORDER, STANDARD_PERSONAS } from '../../utils/capability'

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  'read-only': 'View checklist & export reports. Cannot modify items or change statuses.',
  editor: 'Provide evidence, edit fields, mark In-Progress or Blocked, submit for review.',
  reviewer: 'Review evidence, determine Pass / Failed / N/A, or request changes.',
  approver: 'Confirm review outcomes, approve overrides, and resolve disputes.',
  'sign-off': 'Grant overall project release sign-off & generate cryptographic attestation.',
  master: 'Full structural & administrative control: edit schema, review, and sign-off.',
}

const ROLE_COLORS: Record<RoleType, string> = {
  'read-only': '#94a3b8',
  editor: '#38bdf8',
  reviewer: '#a855f7',
  approver: '#f59e0b',
  'sign-off': '#10b981',
  master: '#ef4444',
}

interface Props {
  initialPersonas?: PersonaDefinition[]
  onSubmit: (project: string, version: string, branch: string, personas: PersonaDefinition[]) => void
  onBack: () => void
}

export function MetaEntryForm({ initialPersonas, onSubmit, onBack }: Props) {
  const [project, setProject] = useState('')
  const [version, setVersion] = useState('')
  const [branch, setBranch] = useState('pre-dev')
  const [personas, setPersonas] = useState<PersonaDefinition[]>(
    initialPersonas && initialPersonas.length > 0 ? initialPersonas : STANDARD_PERSONAS
  )

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newRole, setNewRole] = useState<RoleType>('editor')
  const [newDescription, setNewDescription] = useState('')

  const handleRoleChange = (id: string, newRole: RoleType) => {
    setPersonas(prev =>
      prev.map(p => (p.id === id ? { ...p, role: newRole } : p))
    )
  }

  const handleDeletePersona = (id: string) => {
    setPersonas(prev => prev.filter(p => p.id !== id))
  }

  const handleAddPersona = () => {
    if (!newLabel.trim()) return
    const id = newLabel.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    const newPersona: PersonaDefinition = {
      id: `${id}-${Date.now()}`,
      label: newLabel.trim(),
      role: newRole,
      description: newDescription.trim() || undefined,
    }
    setPersonas(prev => [...prev, newPersona])
    setNewLabel('')
    setNewRole('editor')
    setNewDescription('')
    setAddDialogOpen(false)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 4 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ width: '100%', maxWidth: 760, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 3 }}>
            <IconButton
              size="small"
              onClick={onBack}
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>
              Checklist Setup & Team Personas
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Project Details */}
            <Box>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15, mb: 1.5 }}>
                1. Project Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Project Name"
                  placeholder="MyApp / Core Service"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  size="small"
                  required
                />
                <TextField
                  label="Version"
                  placeholder="1.0.0"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  size="small"
                  required
                />
                <TextField
                  label="Target Branch (optional)"
                  placeholder="main / pre-dev"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Team Personas & Roles */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleAltOutlinedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                  <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>
                    2. Team Personas & Role Assignments
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => setAddDialogOpen(true)}
                  sx={{
                    borderColor: 'rgba(56,189,248,0.4)',
                    color: '#38bdf8',
                    textTransform: 'none',
                    fontSize: 13,
                    '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56,189,248,0.08)' },
                  }}
                >
                  Add Persona
                </Button>
              </Box>

              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, fontSize: 13 }}>
                Define the roles each persona holds in the compliance lifecycle. Editor personas record evidence and prepare work; Reviewer personas evaluate and approve/reject items; Sign-off personas certify the overall release.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                {personas.map(persona => {
                  const roleColor = ROLE_COLORS[persona.role] || '#94a3b8'
                  return (
                    <Box
                      key={persona.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>
                            {persona.label}
                          </Typography>
                          <Chip
                            label={persona.role}
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              height: 20,
                              bgcolor: `${roleColor}22`,
                              color: roleColor,
                              border: `1px solid ${roleColor}44`,
                            }}
                          />
                        </Box>
                        {persona.description && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#64748b', display: 'block', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {persona.description}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <InputLabel sx={{ fontSize: 12 }}>Role</InputLabel>
                          <Select
                            value={persona.role}
                            label="Role"
                            onChange={e => handleRoleChange(persona.id, e.target.value as RoleType)}
                            sx={{ fontSize: 13, height: 34 }}
                          >
                            {ROLE_ORDER.map(role => (
                              <MenuItem key={role} value={role} sx={{ fontSize: 13 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: ROLE_COLORS[role],
                                    }}
                                  />
                                  <span>{role}</span>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Tooltip title={ROLE_DESCRIPTIONS[persona.role]}>
                          <InfoOutlinedIcon sx={{ color: '#64748b', fontSize: 18, cursor: 'help' }} />
                        </Tooltip>

                        <IconButton
                          size="small"
                          disabled={personas.length <= 1}
                          onClick={() => handleDeletePersona(persona.id)}
                          sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              disabled={!project.trim() || !version.trim() || personas.length === 0}
              onClick={() => onSubmit(project.trim(), version.trim(), branch.trim(), personas)}
              sx={{
                height: 46,
                fontWeight: 600,
                fontSize: 15,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              Create Checklist ({personas.length} Personas Configured)
            </Button>
          </Box>
        </Box>

        {/* Add Persona Modal */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: 420,
              },
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>Add Team Persona</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            <TextField
              label="Persona Label"
              placeholder="e.g. Lead Penetration Tester"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              size="small"
              fullWidth
              autoFocus
              required
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Role Level</InputLabel>
              <Select
                value={newRole}
                label="Role Level"
                onChange={e => setNewRole(e.target.value as RoleType)}
              >
                {ROLE_ORDER.map(role => (
                  <MenuItem key={role} value={role}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: ROLE_COLORS[role],
                        }}
                      />
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{role}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#94a3b8', ml: 1 }}>
                        — {ROLE_DESCRIPTIONS[role].slice(0, 45)}...
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description / Scope (Optional)"
              placeholder="Responsibilities and assignment notes"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              size="small"
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddDialogOpen(false)} sx={{ color: '#94a3b8' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!newLabel.trim()}
              onClick={handleAddPersona}
              sx={{ bgcolor: '#2563eb' }}
            >
              Add Persona
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

