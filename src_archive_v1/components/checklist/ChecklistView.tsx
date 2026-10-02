import ClearIcon from '@mui/icons-material/Clear'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import {
  Autocomplete,
  Badge,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { CategoryGroup } from './CategoryGroup'
import { ChecklistTable } from './ChecklistTable'

export type ViewMode = 'list' | 'table'

interface Filters {
  status: ItemStatus | 'all'
  search: string
  categories: string[]
  assignedToMe: boolean
  requiredOnly: boolean
}

const DEFAULT: Filters = { status: 'all', search: '', categories: [], assignedToMe: false, requiredOnly: false }

const STATUS_PILLS = [
  { value: 'all',     label: 'All',     color: '#64748b' },
  { value: 'pending', label: 'Pending', color: '#d97706' },
  { value: 'pass',    label: 'Pass',    color: '#16a34a' },
  { value: 'fail',    label: 'Fail',    color: '#dc2626' },
  { value: 'na',      label: 'N/A',     color: '#94a3b8' },
] as const

interface Props {
  file: ChecklistFile
  reviewedItems: ReviewedItem[]
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onSaveResponse: (itemId: string, action: ReviewAction) => void
  onConfirm: (itemId: string, action: ReviewAction) => void
  onEditItem?: (itemId: string) => void
}

function applyFilters(items: ReviewedItem[], f: Filters, userName: string, userRole: string) {
  return items.filter(item => {
    if (f.status !== 'all' && item.status !== f.status) return false
    if (f.requiredOnly && !item.required) return false
    if (f.categories.length > 0 && !f.categories.includes(item.category)) return false
    if (f.assignedToMe) {
      const nm = item.assignedTo?.name?.toLowerCase() === userName.toLowerCase()
      const rm = item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase())
      if (!nm && !rm) return false
    }
    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase()
      const hit = item.id.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.history.some(a => a.actorName.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) ||
        item.assignedTo?.name?.toLowerCase().includes(q) || item.assignedTo?.role?.toLowerCase().includes(q)
      if (!hit) return false
    }
    return true
  })
}

export function ChecklistView({ file, reviewedItems, userCapability, userName, userRole, onSaveResponse, onConfirm, onEditItem }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<Filters>(DEFAULT)

  const allCategories = useMemo(() => [...new Set(reviewedItems.map(i => i.category))].sort(), [reviewedItems])
  const filtered = useMemo(() => applyFilters(reviewedItems, filters, userName, userRole), [reviewedItems, filters, userName, userRole])
  const grouped = useMemo(() => filtered.reduce<Record<string, ReviewedItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item]; return acc
  }, {}), [filtered])

  const total = reviewedItems.length
  const resolved = reviewedItems.filter(i => i.status !== 'pending').length
  const pct = total === 0 ? 0 : Math.round((resolved / total) * 100)
  const pendingCount = reviewedItems.filter(i => i.status === 'pending').length

  const activeCount =
    (filters.status !== 'all' ? 1 : 0) + (filters.search.trim() ? 1 : 0) +
    filters.categories.length + (filters.assignedToMe ? 1 : 0) + (filters.requiredOnly ? 1 : 0)

  function set<K extends keyof Filters>(k: K, v: Filters[K]) { setFilters(f => ({ ...f, [k]: v })) }

  return (
    <Box sx={{ pb: 8 }}>
      {/* ── Sticky filter bar ──────────────────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 52, zIndex: 40,
        bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
        px: 2.5, py: 1.25,
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>

          {/* Progress */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 2, borderRight: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ width: 110 }}>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6, borderRadius: 3,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: pct === 100 ? '#16a34a' : pct > 50 ? '#2563eb' : '#d97706',
                  },
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap' }}>{pct}%</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>{resolved}/{total}</Typography>
            {pendingCount > 0 && (
              <Badge badgeContent={pendingCount} color="warning" max={999}
                sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, p: '0 4px' } }} />
            )}
          </Stack>

          {/* Status pills */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {STATUS_PILLS.map(p => {
              const active = filters.status === p.value
              return (
                <Box
                  key={p.value}
                  component="button"
                  onClick={() => set('status', p.value)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1.25, py: 0.375, borderRadius: 10, cursor: 'pointer', border: '1px solid',
                    borderColor: active ? `${p.color}55` : 'divider',
                    bgcolor: active ? `${p.color}12` : 'transparent',
                    fontSize: 11, fontWeight: active ? 700 : 400,
                    color: active ? p.color : 'text.secondary',
                    transition: 'all 0.12s',
                    fontFamily: 'inherit',
                  }}
                >
                  {p.value !== 'all' && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />}
                  {p.label}
                </Box>
              )
            })}
          </Stack>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search ID, description, actor…"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment>,
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => set('search', '')} edge="end"><ClearIcon sx={{ fontSize: 14 }} /></IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ width: 210, '& .MuiInputBase-input': { fontSize: 12 } }}
          />

          {/* Category */}
          {allCategories.length > 1 && (
            <Autocomplete
              multiple
              size="small"
              options={allCategories}
              value={filters.categories}
              onChange={(_, v) => set('categories', v)}
              renderInput={params => <TextField {...params} placeholder="All categories" sx={{ minWidth: 160, '& .MuiInputBase-input': { fontSize: 12 } }} />}
              renderTags={(v, getProps) => v.map((o, i) => <Chip key={o} label={o} size="small" {...getProps({ index: i })} />)}
              disableCloseOnSelect
              limitTags={2}
            />
          )}

          {/* Toggles */}
          <Tooltip title={`Assigned to ${userName || 'me'}`}>
            <Box component="button" onClick={() => set('assignedToMe', !filters.assignedToMe)} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.25, py: 0.375, borderRadius: 10, cursor: 'pointer', border: '1px solid',
              borderColor: filters.assignedToMe ? '#2563eb55' : 'divider',
              bgcolor: filters.assignedToMe ? '#eff6ff' : 'transparent',
              fontSize: 11, fontWeight: filters.assignedToMe ? 700 : 400,
              color: filters.assignedToMe ? '#2563eb' : 'text.secondary',
              fontFamily: 'inherit', transition: 'all 0.12s',
            }}>
              <PersonOutlinedIcon sx={{ fontSize: 13 }} /> Mine
            </Box>
          </Tooltip>

          <Box component="button" onClick={() => set('requiredOnly', !filters.requiredOnly)} sx={{
            px: 1.25, py: 0.375, borderRadius: 10, cursor: 'pointer', border: '1px solid',
            borderColor: filters.requiredOnly ? '#d9770655' : 'divider',
            bgcolor: filters.requiredOnly ? '#fffbeb' : 'transparent',
            fontSize: 11, fontWeight: filters.requiredOnly ? 700 : 400,
            color: filters.requiredOnly ? '#d97706' : 'text.secondary',
            fontFamily: 'inherit', transition: 'all 0.12s',
          }}>Required</Box>

          {/* Clear */}
          {activeCount > 0 && (
            <Chip
              label={`Clear ${activeCount}`}
              size="small"
              onDelete={() => setFilters(DEFAULT)}
              deleteIcon={<ClearIcon />}
              variant="outlined"
              sx={{ ml: 'auto', fontSize: 11 }}
            />
          )}

          {/* View toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
            sx={{ ml: activeCount > 0 ? 0 : 'auto', flexShrink: 0 }}
          >
            <ToggleButton value="list" sx={{ px: 1, py: 0.5 }}><ViewListOutlinedIcon sx={{ fontSize: 16 }} /></ToggleButton>
            <ToggleButton value="table" sx={{ px: 1, py: 0.5 }}><GridViewOutlinedIcon sx={{ fontSize: 16 }} /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Filter summary strip */}
        {activeCount > 0 && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>
            Showing <strong>{filtered.length}</strong> of {total} items
          </Typography>
        )}
      </Box>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <Box sx={{ p: 2.5 }}>
          <ChecklistTable
            items={filtered}
            file={file}
            userCapability={userCapability}
            userName={userName}
            userRole={userRole}
            onSaveResponse={onSaveResponse}
            onConfirm={onConfirm}
            onEditItem={onEditItem}
          />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 860, mx: 'auto', px: 2.5, pt: 2.5 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography color="text.secondary">No items match the current filters</Typography>
              <Typography component="button" onClick={() => setFilters(DEFAULT)} sx={{ mt: 1, cursor: 'pointer', color: 'primary.main', background: 'none', border: 'none', fontSize: 13, fontFamily: 'inherit' }}>
                Clear filters
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {Object.entries(grouped).map(([category, items]) => (
                <CategoryGroup
                  key={category} category={category} items={items} file={file}
                  userCapability={userCapability} userName={userName} userRole={userRole}
                  onSaveResponse={onSaveResponse} onConfirm={onConfirm} onEditItem={onEditItem}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  )
}
