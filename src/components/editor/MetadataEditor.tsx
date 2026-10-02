import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, IconButton, Popover, TextField, Tooltip } from '@mui/material'
import { useState } from 'react'

interface Props { project: string; version: string; branch: string; onSave: (p: string, v: string, b: string) => void }

export function MetadataEditor({ project, version, branch, onSave }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [form, setForm] = useState({ project, version, branch })

  return (
    <>
      <Tooltip title="Edit project metadata">
        <IconButton size="small" onClick={e => { setForm({ project, version, branch }); setAnchor(e.currentTarget) }}
          sx={{ color: 'text.secondary' }}>
          <EditOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, width: 300 } } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField label="Project" size="small" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} />
          <TextField label="Version" size="small" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
          <TextField label="Branch" size="small" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setAnchor(null)}>Cancel</Button>
            <Button size="small" variant="contained"
              onClick={() => { onSave(form.project, form.version, form.branch); setAnchor(null) }}>
              Save
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
