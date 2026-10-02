import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'
import type { CapabilityLevel, FieldSchema, FieldType, ItemStatus } from '../../types'

const TYPES: FieldType[] = ['text', 'textarea', 'select', 'url', 'boolean', 'date']
const STATUSES: ItemStatus[] = ['pass', 'fail', 'na']
const CAPS: CapabilityLevel[] = ['observer', 'contributor', 'reviewer', 'approver', 'editor']
const BLANK: FieldSchema = { id: '', label: '', type: 'text', requiredWhen: [], editableBy: 'reviewer', visibleTo: 'observer' }

interface Props { fields: FieldSchema[]; onChange: (fields: FieldSchema[]) => void }

export function FieldSchemaEditor({ fields, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [form, setForm] = useState<FieldSchema>(BLANK)
  const [optionsText, setOptionsText] = useState('')

  function openAdd() { setForm(BLANK); setOptionsText(''); setEditIdx(null); setOpen(true) }
  function openEdit(idx: number) { const f = fields[idx]; setForm(f); setOptionsText((f.options ?? []).join('\n')); setEditIdx(idx); setOpen(true) }
  function handleSave() {
    if (!form.id.trim() || !form.label.trim()) return
    const field: FieldSchema = { ...form, id: form.id.trim(), options: form.type === 'select' ? optionsText.split('\n').map(s => s.trim()).filter(Boolean) : undefined }
    onChange(editIdx !== null ? fields.map((f, i) => i === editIdx ? field : f) : [...fields, field])
    setOpen(false)
  }
  function set<K extends keyof FieldSchema>(k: K, v: FieldSchema[K]) { setForm(f => ({ ...f, [k]: v })) }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 120, renderCell: (p: GridRenderCellParams) => <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.value}</Typography> },
    { field: 'label', headerName: 'Label', flex: 1 },
    { field: 'type', headerName: 'Type', width: 90, renderCell: (p: GridRenderCellParams) => <Chip label={p.value} size="small" /> },
    { field: 'requiredWhen', headerName: 'Required when', width: 150,
      renderCell: (p: GridRenderCellParams) => (p.value as string[]).length > 0
        ? (p.value as string[]).map((s: string) => <Chip key={s} label={s} size="small" color="warning" sx={{ mr: 0.25 }} />)
        : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>always opt.</Typography> },
    { field: '__actions', headerName: '', width: 80, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => (
        <Stack direction="row">
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row.idx)}><EditOutlinedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onChange(fields.filter((_, i) => i !== p.row.idx))}><DeleteOutlinedIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
        </Stack>
      ) },
  ]

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>Field Schema</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>Add field</Button>
      </Stack>

      <DataGrid
        rows={fields.map((f, i) => ({ ...f, id: f.id || i, idx: i }))}
        columns={columns} autoHeight density="compact" hideFooter disableRowSelectionOnClick
        sx={{ '& .MuiDataGrid-cell': { fontSize: 12 } }}
        localeText={{ noRowsLabel: 'No fields defined' }}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 600 }}>{editIdx !== null ? 'Edit Field' : 'New Field'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="ID" size="small" required value={form.id} onChange={e => set('id', e.target.value)} slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }} placeholder="evidence" />
            <TextField label="Label" size="small" required value={form.label} onChange={e => set('label', e.target.value)} placeholder="Evidence" />
            <TextField select label="Type" size="small" value={form.type} onChange={e => set('type', e.target.value as FieldType)}>
              {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            {form.type === 'select' && (
              <TextField label="Options (one per line)" size="small" multiline rows={4} value={optionsText}
                onChange={e => setOptionsText(e.target.value)} placeholder={'Option A\nOption B'} slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 12 } } }} />
            )}
            <TextField label="Max length (optional)" size="small" type="number"
              value={form.maxLength ?? ''} onChange={e => set('maxLength', e.target.value ? parseInt(e.target.value) : undefined)} />
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Required when status is</Typography>
              <FormGroup row>
                {STATUSES.map(s => (
                  <FormControlLabel key={s} control={
                    <Checkbox size="small" checked={(form.requiredWhen ?? []).includes(s)}
                      onChange={e => { const cur = form.requiredWhen ?? []; set('requiredWhen', e.target.checked ? [...cur, s] : cur.filter(x => x !== s)) }} />
                  } label={<Typography sx={{ fontSize: 12 }}>{s}</Typography>} />
                ))}
              </FormGroup>
            </Box>
            <TextField select label="Editable by (min)" size="small" value={form.editableBy ?? 'reviewer'} onChange={e => set('editableBy', e.target.value as CapabilityLevel)}>
              {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select label="Visible to (min)" size="small" value={form.visibleTo ?? 'observer'} onChange={e => set('visibleTo', e.target.value as CapabilityLevel)}>
              {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button size="small" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={!form.id.trim() || !form.label.trim()}>Save Field</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
