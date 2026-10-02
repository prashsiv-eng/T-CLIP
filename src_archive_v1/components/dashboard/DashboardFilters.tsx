import ClearIcon from '@mui/icons-material/Clear'
import { Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardFilters, ReviewedItem } from '../../types'

interface Props { items: ReviewedItem[]; filters: DashboardFilters; onChange: (f: DashboardFilters) => void }

export function DashboardFiltersPanel({ items, filters, onChange }: Props) {
  const allCategories = [...new Set(items.map(i => i.category))].sort()
  const [roleInput, setRoleInput] = useState(filters.role)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setRoleInput(filters.role) }, [filters.role])

  const handleRole = useCallback((val: string) => {
    setRoleInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange({ ...filters, role: val }), 200)
  }, [filters, onChange])

  const hasActive = filters.status !== 'all' || filters.categories.length > 0 || filters.role !== '' || filters.requiredOnly

  return (
    <Card elevation={0} sx={{ position: 'sticky', top: 92 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Filters</Typography>
          {hasActive && (
            <Button size="small" startIcon={<ClearIcon sx={{ fontSize: 13 }} />} onClick={() => { setRoleInput(''); onChange({ status: 'all', categories: [], role: '', requiredOnly: false }) }}
              sx={{ fontSize: 11, minWidth: 0, p: '2px 6px' }}>
              Clear
            </Button>
          )}
        </Stack>

        <Stack spacing={1.5}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>Status</Typography>
            <TextField select size="small" fullWidth value={filters.status} onChange={e => onChange({ ...filters, status: e.target.value as typeof filters.status })}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="pass">Pass</MenuItem>
              <MenuItem value="fail">Fail</MenuItem>
              <MenuItem value="na">N/A</MenuItem>
            </TextField>
          </Box>

          {allCategories.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>Category</Typography>
              <Stack spacing={0.25} sx={{ maxHeight: 160, overflowY: 'auto' }}>
                {allCategories.map(cat => (
                  <FormControlLabel key={cat} control={
                    <Checkbox size="small" checked={filters.categories.includes(cat)}
                      onChange={e => onChange({ ...filters, categories: e.target.checked ? [...filters.categories, cat] : filters.categories.filter(c => c !== cat) })} />
                  } label={<Typography sx={{ fontSize: 12 }}>{cat}</Typography>} sx={{ mx: 0 }} />
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>Role</Typography>
            <TextField size="small" fullWidth value={roleInput} onChange={e => handleRole(e.target.value)} placeholder="e.g. Security Lead" />
          </Box>

          <Divider />
          <FormControlLabel control={
            <Checkbox size="small" checked={filters.requiredOnly} onChange={e => onChange({ ...filters, requiredOnly: e.target.checked })} />
          } label={<Typography sx={{ fontSize: 12 }}>Required only</Typography>} sx={{ mx: 0 }} />
        </Stack>
      </CardContent>
    </Card>
  )
}
