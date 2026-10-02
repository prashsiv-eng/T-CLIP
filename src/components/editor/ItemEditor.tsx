import {
  Autocomplete, Box, Button, Checkbox, Drawer, FormControlLabel,
  MenuItem, TextField, Typography,
} from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistItem, FieldSchema } from '../../types'
import { RoleAutoComplete } from '../shared/IdentityForm'

interface Props {
  item?: ChecklistItem; fields: FieldSchema[]; categories: string[]
  onSave: (item: ChecklistItem) => void; onDelete?: (id: string) => void; onClose: () => void
}

const CAPS: CapabilityLevel[] = ['read-only', 'editor', 'reviewer', 'approver', 'sign-off', 'master']

const BLANK: Omit<ChecklistItem, 'id'> = {
  category: '', description: '', required: true, status: 'not-started',
  statusEditableBy: 'reviewer', assignedTo: { role: '', name: '' }, values: {},
}

export function ItemEditor({ item, fields, categories, onSave, onDelete, onClose }: Props) {
  const isEdit = !!item
  const [form, setForm] = useState<ChecklistItem>({
    ...BLANK, id: '', ...item,
    assignedTo: item?.assignedTo ?? { role: '', name: '' },
    values: item?.values ?? {},
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set<K extends keyof ChecklistItem>(k: K, v: ChecklistItem[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleSave() {
    if (!form.id.trim() || !form.description.trim() || !form.category.trim()) return
    onSave({ ...form, id: form.id.trim() })
    onClose()
  }

  return (
    <Drawer anchor="right" open={true} onClose={onClose}
      slotProps={{ paper: { sx: { width: 480 } } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{isEdit ? 'Edit Item' : 'Add Item'}</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Item ID" required size="small" value={form.id}
              onChange={e => set('id', e.target.value)} placeholder="SEC-001"
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }} />

            <Autocomplete freeSolo options={categories} value={form.category}
              onInputChange={(_, v) => set('category', v)}
              renderInput={p => <TextField {...p} label="Category" required size="small" placeholder="Security" />} />

            <TextField label="Description" required size="small" multiline rows={3}
              value={form.description} onChange={e => set('description', e.target.value)} />

            <FormControlLabel
              control={<Checkbox checked={form.required} onChange={e => set('required', e.target.checked)} size="small" />}
              label={<Typography sx={{ fontSize: 13 }}>Required item</Typography>}
            />

            <TextField select label="Min capability to set status" size="small"
              value={form.statusEditableBy ?? 'reviewer'}
              onChange={e => set('statusEditableBy', e.target.value as CapabilityLevel)}>
              {CAPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            <Box>
              <Typography variant="h5" sx={{ color: 'text.secondary', mb: 1 }}>Assignment (optional)</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <RoleAutoComplete value={form.assignedTo?.role ?? ''}
                  onChange={v => set('assignedTo', { ...form.assignedTo, role: v, name: form.assignedTo?.name ?? '' })}
                  label="Role" />
                <TextField label="Name" size="small" placeholder="Jane Smith"
                  value={form.assignedTo?.name ?? ''}
                  onChange={e => set('assignedTo', { ...form.assignedTo, name: e.target.value, role: form.assignedTo?.role ?? '' })} />
              </Box>
            </Box>

            {fields.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ color: 'text.secondary', mb: 1 }}>Pre-fill values (optional)</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {fields.map(f => (
                    <TextField key={f.id} label={f.label} size="small"
                      value={form.values?.[f.id] ?? ''}
                      onChange={e => set('values', { ...form.values, [f.id]: e.target.value })} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
            {isEdit && onDelete && !confirmDelete && (
              <Button size="small" color="error" variant="outlined" onClick={() => setConfirmDelete(true)} sx={{ mr: 'auto' }}>
                Delete
              </Button>
            )}
            {confirmDelete && (
              <>
                <Typography sx={{ fontSize: 12, alignSelf: 'center', color: 'error.main', mr: 'auto' }}>Confirm delete?</Typography>
                <Button size="small" color="error" variant="contained" onClick={() => { onDelete!(form.id); onClose() }}>Yes</Button>
                <Button size="small" onClick={() => setConfirmDelete(false)}>No</Button>
              </>
            )}
            {!confirmDelete && (
              <>
                <Button size="small" onClick={onClose}>Cancel</Button>
                <Button size="small" variant="contained" onClick={handleSave}>
                  {isEdit ? 'Save Changes' : 'Add Item'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}
