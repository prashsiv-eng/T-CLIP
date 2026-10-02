import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Grid,
  IconButton,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { darkTheme } from '../../theme'
import type { CapabilityLevel, ChecklistFile, ReviewedItem, RoleCapabilityMap, UserPersona } from '../../types'
import { resolveCapability } from '../../utils/capability'
import { getFilePersonasAndRoles } from '../../utils/persona'
import { RoleAutoComplete } from '../shared/IdentityForm'

const CAP_COLOR: Record<CapabilityLevel, 'default' | 'primary' | 'secondary' | 'warning' | 'success'> = {
  observer: 'default', contributor: 'secondary', reviewer: 'primary',
  approver: 'warning', editor: 'success',
}

interface Props {
  file: ChecklistFile
  fileName?: string | null
  reviewedItems: ReviewedItem[]
  capabilityMap: RoleCapabilityMap
  onSelectPersona: (name: string, role: string) => void
  onAddPersonaToFile: (persona: UserPersona) => void
  onBack: () => void
}

export function PersonaSelectScreen({ file, fileName, reviewedItems, capabilityMap, onSelectPersona, onAddPersonaToFile, onBack }: Props) {
  const { users, roles } = getFilePersonasAndRoles(file, reviewedItems)

  const [selectedUser, setSelectedUser] = useState<UserPersona | null>(users[0] ?? null)
  const [customName, setCustomName] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(users.length === 0)

  const activeName = isCreatingNew ? customName.trim() : (selectedUser?.name ?? '')
  const activeRole = isCreatingNew ? customRole.trim() : (selectedUser?.role ?? '')
  const activeCapability = resolveCapability(activeRole, capabilityMap)
  const isValid = activeName.length > 0 && activeRole.length > 0

  function handleProceed() {
    if (!isValid) return
    if (isCreatingNew) {
      onAddPersonaToFile({ name: activeName, role: activeRole })
    }
    onSelectPersona(activeName, activeRole)
  }

  function handleSelectExisting(u: UserPersona) {
    setSelectedUser(u)
    setIsCreatingNew(false)
  }

  function handleSelectRoleClaim(role: string) {
    setIsCreatingNew(true)
    setCustomRole(role)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh', bgcolor: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <Box sx={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <IconButton size="small" onClick={onBack} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: 20 }}>
                  Select Your Persona
                </Typography>
                {file.project && (
                  <Chip label={file.project} size="small" sx={{ bgcolor: 'rgba(37,99,235,0.15)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.3)', fontSize: 11 }} />
                )}
                {fileName && (
                  <Chip
                    icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: '13px !important', color: '#60a5fa !important' }} />}
                    label={fileName}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.12)',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  />
                )}
              </Box>
              <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>
                Identify who you are to determine your review permissions and assignments
              </Typography>
            </Box>
          </Box>

          {/* Section 1: Predefined users from the file */}
          {users.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 1.5 }}>
                Team Members in File ({users.length})
              </Typography>
              <Grid container spacing={1.5}>
                {users.map(u => {
                  const cap = resolveCapability(u.role, capabilityMap)
                  const isSelected = !isCreatingNew && selectedUser?.name === u.name && selectedUser?.role === u.role
                  return (
                    <Grid key={`${u.name}-${u.role}`} size={{ xs: 12, sm: 6 }}>
                      <Card sx={{
                        bgcolor: isSelected ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid',
                        borderColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        transition: 'all 0.15s ease',
                      }}>
                        <CardActionArea onClick={() => handleSelectExisting(u)} sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                              width: 36, height: 36, fontSize: 14, fontWeight: 700,
                              bgcolor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                              color: '#fff',
                            }}>
                              {u.name[0]?.toUpperCase() ?? '?'}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }} noWrap>
                                {u.name}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: '#94a3b8' }} noWrap>
                                {u.role}
                              </Typography>
                            </Box>
                            <Chip label={cap} color={CAP_COLOR[cap]} size="small" sx={{ textTransform: 'capitalize', fontSize: 11 }} />
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          )}

          {/* Section 2: Roles defined in file to quick-claim */}
          {roles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 1 }}>
                {users.length > 0 ? 'Or claim a role from the file:' : 'Available Template Roles (click to select):'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {roles.map(r => (
                  <Chip
                    key={r}
                    label={r}
                    clickable
                    variant={isCreatingNew && customRole === r ? 'filled' : 'outlined'}
                    color={isCreatingNew && customRole === r ? 'primary' : 'default'}
                    onClick={() => handleSelectRoleClaim(r)}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: isCreatingNew && customRole === r ? '#fff' : '#e2e8f0',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Section 3: Create / customize persona */}
          <Card sx={{
            bgcolor: isCreatingNew ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: isCreatingNew ? '#3b82f6' : 'rgba(255,255,255,0.08)',
            borderRadius: 2,
            p: 2.5,
            mb: 3,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonAddOutlinedIcon sx={{ fontSize: 20, color: '#60a5fa' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                {isCreatingNew ? (users.length === 0 ? 'Your Persona Details' : 'Enter Your Persona Details') : 'Or Create a New Persona'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Your Name"
                placeholder="Enter your name"
                value={customName}
                onChange={e => {
                  setCustomName(e.target.value)
                  setIsCreatingNew(true)
                }}
                onFocus={() => setIsCreatingNew(true)}
                size="small"
                required
              />
              <RoleAutoComplete
                value={customRole}
                onChange={v => {
                  setCustomRole(v)
                  setIsCreatingNew(true)
                }}
                label="Role"
                placeholder="Select or enter role"
              />
            </Box>
          </Card>

          {/* Current Selection Summary & Submit */}
          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2, p: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, color: '#fff' }}>
                <PersonOutlinedIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }} noWrap>
                  {activeName || 'No persona selected'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }} noWrap>
                  {activeRole || 'Select or enter a role'}
                </Typography>
              </Box>
              {activeRole && (
                <Chip label={activeCapability} color={CAP_COLOR[activeCapability]} size="small" sx={{ textTransform: 'capitalize', fontSize: 11 }} />
              )}
            </Box>

            <Button
              variant="contained"
              size="medium"
              disabled={!isValid}
              onClick={handleProceed}
              sx={{ fontWeight: 600, px: 3, whiteSpace: 'nowrap' }}
            >
              Continue to Checklist
            </Button>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
