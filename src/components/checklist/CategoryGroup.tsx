import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ReviewAction, ReviewedItem } from '../../types'
import { meetsMinimum } from '../../utils/capability'
import { ChecklistItem } from './ChecklistItem'

const S_COLORS = { pass: '#16a34a', fail: '#dc2626', na: '#94a3b8', pending: '#64748b' }

interface Props {
  category: string; items: ReviewedItem[]; file: ChecklistFile
  userCapability: CapabilityLevel; userName: string; userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onEditItem?: (id: string) => void
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
    <Accordion
      expanded={expanded}
      onChange={(_, e) => setExpanded(e)}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px !important',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: '#cbd5e1',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
        sx={{
          bgcolor: '#f8fafc',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          minHeight: 48,
          px: 2,
          '& .MuiAccordionSummary-content': { my: 0.75 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, flex: 1, mr: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', color: 'text.primary' }}>{category}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexShrink: 0 }}>
            {pass > 0 && <Chip label={`${pass} pass`} color="success" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22 }} />}
            {fail > 0 && <Chip label={`${fail} fail`} color="error" size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22 }} />}
            {pending > 0 && (
              <Chip
                label={`${pending} pending`}
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 11,
                  height: 22,
                }}
              />
            )}
          </Box>
          {/* Stacked bar */}
          <Box sx={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: '#e2e8f0', display: 'flex', maxWidth: 130 }}>
            {(['pass', 'fail', 'na', 'pending'] as const).map(s => {
              const n = items.filter(i => i.status === s).length
              const w = items.length === 0 ? 0 : (n / items.length) * 100
              return w > 0 ? <Box key={s} sx={{ width: `${w}%`, bgcolor: S_COLORS[s] }} /> : null
            })}
          </Box>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {resolved}/{items.length} · {pct}%
          </Typography>
          {canEdit && onEditItem && (
            <Tooltip title={`Add item to ${category}`}>
              <IconButton size="small" onClick={e => { e.stopPropagation(); onEditItem('__new__' + category) }}>
                <AddIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {items.map(item => (
            <ChecklistItem key={item.id} item={item} file={file}
              userCapability={userCapability} userName={userName} userRole={userRole}
              onSaveResponse={onSaveResponse} onConfirm={onConfirm}
              onEditItem={canEdit && onEditItem ? () => onEditItem(item.id) : undefined} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
