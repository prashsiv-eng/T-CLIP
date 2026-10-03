import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {
  Box, Button, Chip, Divider, Drawer, IconButton, MenuItem,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'
import type { CapabilityLevel, RoleCapabilityMap } from '../../types'

const CAPS: CapabilityLevel[] = ['read-only', 'editor', 'reviewer', 'approver', 'sign-off', 'master']
const CAP_COLOR: Record<CapabilityLevel, 'default' | 'info' | 'secondary' | 'warning' | 'success' | 'primary'> = {
  'read-only': 'default',
  editor: 'info',
  reviewer: 'secondary',
  approver: 'warning',
  'sign-off': 'success',
  master: 'primary',
}

interface Props {
  userCapability: CapabilityLevel; roleCapabilityMap: RoleCapabilityMap
  fileHash: string | null; onUpdateCapabilityMap: (m: RoleCapabilityMap) => void
  onClearSession: () => void; onRestart?: () => void; onClose: () => void
}

export function SettingsPanel({ roleCapabilityMap, fileHash, onUpdateCapabilityMap, onClearSession, onRestart, onClose }: Props) {
  const [newPattern, setNewPattern] = useState('')
  const [newLevel, setNewLevel] = useState<CapabilityLevel>('reviewer')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)

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
      renderCell: (p: GridRenderCellParams) => (
        <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.value}</Typography>
      ),
    },
    {
      field: 'capability', headerName: 'Capability', width: 120,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value} color={CAP_COLOR[p.value as CapabilityLevel]} size="small" />
      ),
    },
    {
      field: '__actions', headerName: '', width: 110, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => {
        const idx = p.row.idx as number
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.25 }}>
            <Tooltip title="Up">
              <span>
                <IconButton size="small" onClick={() => moveRule(idx, -1)} disabled={idx === 0}>
                  <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Down">
              <span>
                <IconButton size="small" onClick={() => moveRule(idx, 1)} disabled={idx === roleCapabilityMap.rules.length - 1}>
                  <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" color="error" onClick={() => removeRule(idx)}>
                <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )
      },
    },
  ]

  const rows = roleCapabilityMap.rules.map((r, idx) => ({ id: idx, idx, ...r }))

  return (
    <Drawer anchor="right" open={true} onClose={onClose}
      slotProps={{ paper: { sx: { width: 460 } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Settings</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          <Typography variant="h5" sx={{ color: 'text.secondary', mb: 0.75 }}>Role → Capability Rules</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 12 }}>
            Matched top-to-bottom (case-insensitive substring). First match wins.
          </Typography>

          <DataGrid rows={rows} columns={columns} autoHeight density="compact"
            hideFooter disableRowSelectionOnClick
            localeText={{ noRowsLabel: 'No rules defined' }}
            sx={{ mb: 1.5, '& .MuiDataGrid-cell': { fontSize: 12 } }} />

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'flex-start' }}>
            <TextField size="small" placeholder="pattern (e.g. approver)" value={newPattern}
              onChange={e => setNewPattern(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()} sx={{ flex: 1 }} />
            <TextField select size="small" value={newLevel}
              onChange={e => setNewLevel(e.target.value as CapabilityLevel)} sx={{ width: 130 }}>
              {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={addRule} disabled={!newPattern.trim()} sx={{ height: 32, whiteSpace: 'nowrap' }}>
              Add
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="h5" sx={{ color: 'text.secondary', mb: 1.5 }}>Session &amp; Workflow</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {onRestart && (
              confirmRestart ? (
                <Box sx={{ p: 1.5, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#fbbf24' }}>
                    Warning: Save current state before resetting!
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>
                    Returning to Home will close the active checklist. Be sure to export first if you have unsaved progress.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Button size="small" color="error" variant="contained" onClick={() => { onClose(); onRestart() }}>
                      Restart
                    </Button>
                    <Button size="small" onClick={() => setConfirmRestart(false)}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button size="small" color="primary" variant="outlined" onClick={() => setConfirmRestart(true)}>
                  Restart Workflow (Return to Home)
                </Button>
              )
            )}
            {fileHash ? (
              confirmClear ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 13 }}>Clear saved session?</Typography>
                  <Button size="small" color="error" variant="contained"
                    onClick={() => { onClearSession(); onClose() }}>Clear</Button>
                  <Button size="small" onClick={() => setConfirmClear(false)}>Cancel</Button>
                </Box>
              ) : (
                <Button size="small" color="error" variant="outlined" onClick={() => setConfirmClear(true)}>
                  Clear saved session
                </Button>
              )
            ) : null}
          </Box>
        </Box>

        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth variant="outlined" onClick={onClose}>Done</Button>
        </Box>
      </Box>
    </Drawer>
  )
}
