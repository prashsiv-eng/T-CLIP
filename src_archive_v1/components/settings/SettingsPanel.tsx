import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Button, Chip, Divider, Drawer, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'
import type { CapabilityLevel, RoleCapabilityMap } from '../../types'

const CAPS: CapabilityLevel[] = ['observer', 'contributor', 'reviewer', 'approver', 'editor']
const CAP_COLOR: Record<CapabilityLevel, 'default' | 'secondary' | 'primary' | 'warning' | 'success'> = {
  observer: 'default', contributor: 'secondary', reviewer: 'primary', approver: 'warning', editor: 'success',
}

interface Props {
  userCapability: CapabilityLevel; roleCapabilityMap: RoleCapabilityMap
  fileHash: string | null; onUpdateCapabilityMap: (m: RoleCapabilityMap) => void
  onClearSession: () => void; onClose: () => void
}

export function SettingsPanel({ roleCapabilityMap, fileHash, onUpdateCapabilityMap, onClearSession, onClose }: Props) {
  const [newPattern, setNewPattern] = useState('')
  const [newLevel, setNewLevel] = useState<CapabilityLevel>('reviewer')
  const [confirmClear, setConfirmClear] = useState(false)

  function addRule() {
    if (!newPattern.trim()) return
    onUpdateCapabilityMap({ ...roleCapabilityMap, rules: [...roleCapabilityMap.rules, { pattern: newPattern.trim(), capability: newLevel }] })
    setNewPattern('')
  }
  function removeRule(idx: number) {
    onUpdateCapabilityMap({ ...roleCapabilityMap, rules: roleCapabilityMap.rules.filter((_, i) => i !== idx) })
  }
  function moveRule(idx: number, dir: -1 | 1) {
    const rules = [...roleCapabilityMap.rules]
    const t = idx + dir
    if (t < 0 || t >= rules.length) return
    ;[rules[idx], rules[t]] = [rules[t], rules[idx]]
    onUpdateCapabilityMap({ ...roleCapabilityMap, rules })
  }

  const columns: GridColDef[] = [
    {
      field: 'pattern', headerName: 'Pattern', flex: 1,
      renderCell: (p: GridRenderCellParams) => <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.value}</Typography>,
    },
    {
      field: 'capability', headerName: 'Capability', width: 120,
      renderCell: (p: GridRenderCellParams) => <Chip label={p.value} color={CAP_COLOR[p.value as CapabilityLevel]} size="small" />,
    },
    {
      field: '__actions', headerName: '', width: 110, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => {
        const idx = p.row.idx as number
        return (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Move up"><IconButton size="small" onClick={() => moveRule(idx, -1)} disabled={idx === 0}><ArrowUpwardIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Move down"><IconButton size="small" onClick={() => moveRule(idx, 1)} disabled={idx === roleCapabilityMap.rules.length - 1}><ArrowDownwardIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
            <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => removeRule(idx)}><DeleteOutlinedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
          </Stack>
        )
      },
    },
  ]

  const rows = roleCapabilityMap.rules.map((r, idx) => ({ id: idx, idx, ...r }))

  return (
    <Drawer anchor="right" open={true} onClose={onClose} PaperProps={{ sx: { width: 460 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Settings</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          {/* Capability map */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 0.75 }}>
            Role → Capability Rules
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 12 }}>
            Matched top-to-bottom (case-insensitive substring). First match wins.
          </Typography>

          <DataGrid
            rows={rows} columns={columns} autoHeight density="compact"
            hideFooter disableRowSelectionOnClick
            sx={{ mb: 1.5, '& .MuiDataGrid-cell': { fontSize: 12 } }}
            localeText={{ noRowsLabel: 'No rules defined' }}
          />

          {/* Add rule */}
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField size="small" placeholder="pattern (e.g. approver)" value={newPattern}
              onChange={e => setNewPattern(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRule()} sx={{ flex: 1 }} />
            <TextField select size="small" value={newLevel} onChange={e => setNewLevel(e.target.value as CapabilityLevel)} sx={{ width: 130 }}>
              {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addRule} disabled={!newPattern.trim()}
              sx={{ height: 32, whiteSpace: 'nowrap' }}>Add</Button>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {/* Session */}
          <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5 }}>
            Session
          </Typography>
          {fileHash ? (
            confirmClear ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: 13 }}>Clear saved session?</Typography>
                <Button size="small" color="error" variant="contained" onClick={() => { onClearSession(); onClose() }}>Clear</Button>
                <Button size="small" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </Stack>
            ) : (
              <Button size="small" color="error" variant="outlined" onClick={() => setConfirmClear(true)}>
                Clear saved session
              </Button>
            )
          ) : (
            <Typography variant="body2" color="text.secondary">No active session</Typography>
          )}
        </Box>

        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth variant="outlined" onClick={onClose}>Done</Button>
        </Box>
      </Box>
    </Drawer>
  )
}
