import ClearIcon from '@mui/icons-material/Clear'
import {
  Box, Button, Card, CardContent, Checkbox, Divider,
  FormControlLabel, MenuItem, TextField, Typography,
} from '@mui/material'
import { useMemo } from 'react'
import type { DashboardFilters, ReviewedItem } from '../../types'

interface Props {
  items: ReviewedItem[]
  filters: DashboardFilters
  filteredCount?: number
  onChange: (f: DashboardFilters) => void
}

export function DashboardFiltersPanel({ items, filters, filteredCount, onChange }: Props) {
  const allCategories = useMemo<string[]>(
    () => Array.from(new Set(items.map(i => i.category))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [items]
  )

  const allRoles = useMemo<string[]>(() => {
    const set = new Set<string>()
    items.forEach(i => {
      if (i.assignedTo?.role) set.add(i.assignedTo.role)
      i.history.forEach(h => { if (h.role) set.add(h.role) })
    })
    return Array.from(set).sort()
  }, [items])

  const hasActive = filters.status !== 'all' || filters.categories.length > 0 || filters.role !== '' || filters.requiredOnly

  return (
    <Card elevation={0} sx={{ position: 'sticky', top: 92 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 600 }}>Filters</Typography>
          {hasActive && (
            <Button
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: 12 }} />}
              sx={{ fontSize: 11, minWidth: 0, p: '2px 6px', textTransform: 'none' }}
              onClick={() => onChange({ status: 'all', categories: [], role: '', requiredOnly: false })}
            >
              Clear
            </Button>
          )}
        </Box>

        {filteredCount !== undefined && (
          <Box sx={{ mb: 1.75, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 11, color: hasActive ? 'primary.main' : 'text.disabled', fontWeight: hasActive ? 600 : 400 }}>
              {hasActive ? `${filteredCount} of ${items.length} items matching` : `All ${items.length} items`}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Box>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 0.75 }}>Status</Typography>
            <TextField
              select
              size="small"
              fullWidth
              value={filters.status}
              onChange={e => onChange({ ...filters, status: e.target.value as typeof filters.status })}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="pass">Pass</MenuItem>
              <MenuItem value="fail">Fail</MenuItem>
              <MenuItem value="na">N/A</MenuItem>
            </TextField>
          </Box>

          {allCategories.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h5" sx={{ color: 'text.secondary' }}>Category</Typography>
                {filters.categories.length > 0 ? (
                  <Button
                    size="small"
                    sx={{ fontSize: 10, p: 0, minWidth: 0, textTransform: 'none', color: 'text.disabled' }}
                    onClick={() => onChange({ ...filters, categories: [] })}
                  >
                    Clear ({filters.categories.length})
                  </Button>
                ) : (
                  <Button
                    size="small"
                    sx={{ fontSize: 10, p: 0, minWidth: 0, textTransform: 'none', color: 'primary.main' }}
                    onClick={() => onChange({ ...filters, categories: allCategories })}
                  >
                    Select All
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 180, overflowY: 'auto', pr: 0.5 }}>
                {allCategories.map((cat: string) => (
                  <FormControlLabel
                    key={cat}
                    sx={{ mx: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={filters.categories.includes(cat)}
                        onChange={e =>
                          onChange({
                            ...filters,
                            categories: e.target.checked
                              ? [...filters.categories, cat]
                              : filters.categories.filter(c => c !== cat),
                          })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: 11, lineHeight: 1.3 }}>{cat}</Typography>}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 0.75 }}>Role</Typography>
            {allRoles.length > 0 ? (
              <TextField
                select
                size="small"
                fullWidth
                value={filters.role}
                onChange={e => onChange({ ...filters, role: e.target.value })}
              >
                <MenuItem value="">All Roles</MenuItem>
                {allRoles.map((r: string) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                size="small"
                fullWidth
                value={filters.role}
                onChange={e => onChange({ ...filters, role: e.target.value })}
                placeholder="Filter by role..."
              />
            )}
          </Box>

          <Divider />
          <FormControlLabel
            sx={{ mx: 0 }}
            control={
              <Checkbox
                size="small"
                checked={filters.requiredOnly}
                onChange={e => onChange({ ...filters, requiredOnly: e.target.checked })}
              />
            }
            label={<Typography sx={{ fontSize: 12 }}>Required only</Typography>}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
