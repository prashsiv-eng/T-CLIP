import ClearIcon from '@mui/icons-material/Clear'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import SearchIcon from '@mui/icons-material/Search'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { CapabilityLevel, ChecklistFile, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { isResolvedStatus } from '../../utils/fields'
import { BulkActionBar } from './BulkActionBar'
import { CategoryGroup } from './CategoryGroup'
import { ChecklistTable } from './ChecklistTable'
import { WorkflowRibbon, type StatusFilterType } from './WorkflowRibbon'

export type ViewMode = 'list' | 'table'

interface Filters {
  status: StatusFilterType
  search: string
  categories: string[]
  assignedToMe: boolean
  requiredOnly: boolean
}

const DEFAULT: Filters = { status: 'all', search: '', categories: [], assignedToMe: false, requiredOnly: false }

const STATUS_PILLS: { value: Filters['status']; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#64748b' },
  { value: 'not-started', label: 'Not Started', color: '#64748b' },
  { value: 'in-progress-or-blocked', label: 'In-Progress / Blocked', color: '#0284c7' },
  { value: 'in-review', label: 'In Review', color: '#9333ea' },
  { value: 'pass', label: 'Pass', color: '#16a34a' },
  { value: 'failed', label: 'Failed', color: '#dc2626' },
  { value: 'na', label: 'N/A', color: '#64748b' },
]

interface Props {
  file: ChecklistFile
  reviewedItems: ReviewedItem[]
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onBatchUpdateStatus?: (
    ids: string[],
    status: ItemStatus,
    meta: { actorName: string; role: string; notes?: string }
  ) => void
  onBatchConfirm?: (
    ids: string[],
    meta: { actorName: string; role: string; notes?: string }
  ) => void
  onAssignItem?: (id: string, assignedTo?: { role?: string; name?: string }) => void
  onBatchAssign?: (ids: string[], assignedTo?: { role?: string; name?: string }) => void
  onNavigateToAttestation?: () => void
  onEditItem?: (id: string) => void
}

function applyFilters(items: ReviewedItem[], f: Filters, userName: string, userRole: string) {
  return items.filter(item => {
    const itemStatus = item.status || 'not-started'
    if (f.status !== 'all') {
      if (f.status === 'not-started') {
        if (itemStatus !== 'not-started' && (itemStatus as string) !== 'pending') return false
      } else if (f.status === 'in-progress-or-blocked') {
        if (itemStatus !== 'in-progress' && itemStatus !== 'blocked') return false
      } else if (f.status === 'resolved') {
        if (!isResolvedStatus(itemStatus)) return false
      } else if (f.status === 'failed') {
        if (itemStatus !== 'failed' && (itemStatus as string) !== 'fail') return false
      } else if (itemStatus !== f.status) {
        return false
      }
    }
    if (f.requiredOnly && !item.required) return false
    if (f.categories.length > 0 && !f.categories.includes(item.category)) return false
    if (f.assignedToMe) {
      const nm = item.assignedTo?.name?.toLowerCase() === userName.toLowerCase()
      const rm = item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase())
      if (!nm && !rm) return false
    }
    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase()
      const hit =
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        itemStatus.toLowerCase().includes(q) ||
        (itemStatus === 'not-started' && ('not started'.includes(q) || 'not-started'.includes(q))) ||
        (itemStatus === 'in-progress' && ('in progress'.includes(q) || 'in-progress'.includes(q))) ||
        (itemStatus === 'in-review' && ('in review'.includes(q) || 'in-review'.includes(q))) ||
        item.history.some(a => a.actorName.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) ||
        item.assignedTo?.name?.toLowerCase().includes(q) ||
        item.assignedTo?.role?.toLowerCase().includes(q)
      if (!hit) return false
    }
    return true
  })
}

export function ChecklistView({
  file,
  reviewedItems,
  userCapability,
  userName,
  userRole,
  onSaveResponse,
  onConfirm,
  onBatchUpdateStatus,
  onBatchConfirm,
  onAssignItem,
  onBatchAssign,
  onNavigateToAttestation,
  onEditItem,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [filters, setFilters] = useState<Filters>(DEFAULT)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const allCategories = useMemo(() => [...new Set(reviewedItems.map(i => i.category))].sort(), [reviewedItems])
  const filtered = useMemo(() => applyFilters(reviewedItems, filters, userName, userRole), [reviewedItems, filters, userName, userRole])
  const grouped = useMemo(() =>
    filtered.reduce<Record<string, ReviewedItem[]>>((acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item]; return acc
    }, {}), [filtered])

  const total = reviewedItems.length
  const resolved = reviewedItems.filter(i => isResolvedStatus(i.status)).length
  const pct = total === 0 ? 0 : Math.round((resolved / total) * 100)
  const pendingReviewCount = reviewedItems.filter(i => i.status === 'in-review').length

  const activeCount =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.search.trim() ? 1 : 0) +
    filters.categories.length +
    (filters.assignedToMe ? 1 : 0) +
    (filters.requiredOnly ? 1 : 0)

  function set<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  return (
    <Box sx={{ pb: 10, width: '100%', minWidth: 0, maxWidth: '100vw' }}>
      {/* ── Visual Workflow Pipeline Ribbon ─────────────────────────── */}
      <WorkflowRibbon
        items={reviewedItems}
        activeFilter={filters.status}
        onSelectFilter={f => set('status', f)}
        onNavigateToAttestation={onNavigateToAttestation}
        hasSignoff={!!file.attestation?.signoff}
      />

      {/* ── Sticky filter bar ─────────────────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 52, zIndex: 40,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 2.5, py: 1.25,
        width: '100%', maxWidth: '100vw', boxSizing: 'border-box',
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

          {/* Progress */}
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, pr: 2, borderRight: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ width: 100 }}>
              <LinearProgress variant="determinate" value={pct} sx={{
                height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: pct === 100 ? '#16a34a' : pct > 0 ? '#2563eb' : '#94a3b8',
                },
              }} />
            </Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{pct}%</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>{resolved}/{total}</Typography>
            {pendingReviewCount > 0 && (
              <Tooltip title={`${pendingReviewCount} items currently in review`}>
                <Badge
                  badgeContent={pendingReviewCount}
                  max={999}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 10,
                      height: 16,
                      minWidth: 16,
                      px: '4px',
                      bgcolor: 'rgba(147, 51, 234, 0.15)',
                      color: '#9333ea',
                      fontWeight: 700,
                      border: '1px solid #d8b4fe',
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Status pills */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexWrap: 'wrap' }}>
            {STATUS_PILLS.map(p => {
              const active = filters.status === p.value
              return (
                <Chip
                  key={p.value}
                  label={p.label}
                  size="small"
                  clickable
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => set('status', active && p.value !== 'all' ? 'all' : p.value)}
                  sx={{
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    bgcolor: active ? `${p.color}22` : 'transparent',
                    color: active ? p.color : 'text.secondary',
                    borderColor: active ? p.color : 'divider',
                    '&:hover': { bgcolor: `${p.color}33` },
                  }}
                />
              )
            })}
          </Box>

          {/* Search */}
          <TextField size="small" placeholder="Search ID, description, actor…"
            value={filters.search} onChange={e => set('search', e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: filters.search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => set('search', '')}>
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ width: 220 }}
          />

          {/* Category multi-select */}
          {allCategories.length > 1 && (
            <Autocomplete
              multiple size="small" options={allCategories}
              value={filters.categories}
              onChange={(_, v) => set('categories', v)}
              disableCloseOnSelect
              limitTags={2}
              renderInput={params => (
                <TextField {...params} placeholder={filters.categories.length === 0 ? 'All categories' : undefined}
                  sx={{ minWidth: 160 }} />
              )}
            />
          )}

          {/* Mine toggle */}
          <Tooltip title={`Assigned to ${userName || 'me'}`}>
            <Chip
              label="Mine"
              icon={<PersonOutlinedIcon sx={{ fontSize: '14px !important' }} />}
              size="small"
              clickable
              variant={filters.assignedToMe ? 'filled' : 'outlined'}
              onClick={() => set('assignedToMe', !filters.assignedToMe)}
              color={filters.assignedToMe ? 'primary' : 'default'}
              sx={{ fontSize: 11, fontWeight: filters.assignedToMe ? 700 : 400 }}
            />
          </Tooltip>

          {/* Required toggle */}
          <Chip
            label="Required"
            size="small"
            clickable
            variant={filters.requiredOnly ? 'filled' : 'outlined'}
            onClick={() => set('requiredOnly', !filters.requiredOnly)}
            sx={{
              fontSize: 11,
              fontWeight: filters.requiredOnly ? 700 : 400,
              bgcolor: filters.requiredOnly ? '#475569' : 'transparent',
              color: filters.requiredOnly ? '#ffffff' : 'text.secondary',
              borderColor: filters.requiredOnly ? '#475569' : 'divider',
              '&:hover': {
                bgcolor: filters.requiredOnly ? '#334155' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          />

          {/* Clear all */}
          {activeCount > 0 && (
            <Chip label={`Clear ${activeCount}`} size="small" variant="outlined"
              onDelete={() => setFilters(DEFAULT)}
              deleteIcon={<ClearIcon />}
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
            <Tooltip title="Grouped Card View" arrow>
              <ToggleButton value="list" aria-label="Grouped Card View" sx={{ px: 1, py: 0.5 }}>
                <ViewListOutlinedIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Spreadsheet View" arrow>
              <ToggleButton value="table" aria-label="Spreadsheet View" sx={{ px: 1, py: 0.5 }}>
                <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>

        {activeCount > 0 && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>
            Showing <strong>{filtered.length}</strong> of {total} items
          </Typography>
        )}
      </Box>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <Box sx={{ p: 2.5, width: '100%', minWidth: 0, maxWidth: '100vw', boxSizing: 'border-box' }}>
          <ChecklistTable
            items={filtered}
            file={file}
            userCapability={userCapability}
            userName={userName}
            userRole={userRole}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSaveResponse={onSaveResponse}
            onConfirm={onConfirm}
            onAssignItem={onAssignItem}
            onEditItem={onEditItem}
          />
        </Box>
      ) : (
        <Box sx={{ maxWidth: 860, mx: 'auto', px: 2.5, pt: 2.5 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1.5 }} />
              <Typography color="text.secondary">No items match the current filters</Typography>
              <Button size="small" onClick={() => setFilters(DEFAULT)} sx={{ mt: 1 }}>
                Clear filters
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Object.entries(grouped).map(([category, items]) => (
                <CategoryGroup key={category} category={category} items={items} file={file}
                  userCapability={userCapability} userName={userName} userRole={userRole}
                  onSaveResponse={onSaveResponse} onConfirm={onConfirm} onAssignItem={onAssignItem} onEditItem={onEditItem} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Multi-Row Floating Action Bar ────────────────────────────── */}
      {onBatchUpdateStatus && onBatchConfirm && (
        <BulkActionBar
          selectedIds={selectedIds}
          file={file}
          userCapability={userCapability}
          userName={userName}
          userRole={userRole}
          onClearSelection={() => setSelectedIds([])}
          onBatchUpdateStatus={onBatchUpdateStatus}
          onBatchConfirm={onBatchConfirm}
          onBatchAssign={onBatchAssign}
        />
      )}
    </Box>
  )
}
