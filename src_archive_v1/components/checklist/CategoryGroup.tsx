import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ReviewAction, ReviewedItem } from '../../types'
import { meetsMinimum } from '../../utils/capability'
import { ChecklistItem } from './ChecklistItem'

const STATUS_COLORS = { pass: '#16a34a', fail: '#dc2626', na: '#94a3b8', pending: '#d97706' }

interface Props {
  category: string; items: ReviewedItem[]; file: ChecklistFile
  userCapability: CapabilityLevel; userName: string; userRole: string
  onSaveResponse: (itemId: string, action: ReviewAction) => void
  onConfirm: (itemId: string, action: ReviewAction) => void
  onEditItem?: (itemId: string) => void
}

export function CategoryGroup({ category, items, file, userCapability, userName, userRole, onSaveResponse, onConfirm, onEditItem }: Props) {
  const [expanded, setExpanded] = useState(true)
  const canEdit = meetsMinimum(userCapability, file.rules?.structureEditableBy ?? 'editor')

  const pass = items.filter(i => i.status === 'pass').length
  const fail = items.filter(i => i.status === 'fail').length
  const pending = items.filter(i => i.status === 'pending').length
  const resolved = items.length - pending
  const pct = items.length === 0 ? 0 : Math.round((resolved / items.length) * 100)

  return (
    <Accordion expanded={expanded} onChange={(_, e) => setExpanded(e)} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, mr: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{category}</Typography>

          {/* Status chips */}
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            {pass > 0 && <Chip label={`${pass} pass`} color="success" size="small" />}
            {fail > 0 && <Chip label={`${fail} fail`} color="error" size="small" />}
            {pending > 0 && <Chip label={`${pending} pending`} color="warning" size="small" />}
          </Stack>

          {/* Stacked mini bar */}
          <Box sx={{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', bgcolor: '#f1f5f9', display: 'flex', maxWidth: 120 }}>
            {(['pass', 'fail', 'na', 'pending'] as const).map(s => {
              const n = items.filter(i => i.status === s).length
              const w = items.length === 0 ? 0 : (n / items.length) * 100
              return w > 0 ? <Box key={s} sx={{ width: `${w}%`, bgcolor: STATUS_COLORS[s] }} /> : null
            })}
          </Box>

          <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap', ml: 'auto' }}>
            {resolved}/{items.length} · {pct}%
          </Typography>

          {canEdit && onEditItem && (
            <Tooltip title={`Add item to ${category}`}>
              <IconButton
                size="small"
                onClick={e => { e.stopPropagation(); onEditItem('__new__' + category) }}
                sx={{ ml: 0.5, flexShrink: 0 }}
              >
                <AddIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          {items.map(item => (
            <ChecklistItem
              key={item.id} item={item} file={file}
              userCapability={userCapability} userName={userName} userRole={userRole}
              onSaveResponse={onSaveResponse} onConfirm={onConfirm}
              onEditItem={canEdit && onEditItem ? () => onEditItem(item.id) : undefined}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}
