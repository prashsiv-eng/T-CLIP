import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, FieldSchema, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { ItemResponseDrawer } from './ItemResponseDrawer'
import { StatusBadge, STATUS_META } from './StatusBadge'

interface Props {
  items: ReviewedItem[]
  file: ChecklistFile
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
  onAssignItem?: (id: string, assignedTo?: { role?: string; name?: string }) => void
  onEditItem?: (id: string) => void
}

function Toolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarQuickFilter slotProps={{ root: { placeholder: 'Quick filter…' } }} />
      <GridToolbarFilterButton />
    </GridToolbarContainer>
  )
}

function buildFieldCol(field: FieldSchema, items: ReviewedItem[]): GridColDef {
  const valueOptions = field.options?.length
    ? field.options
    : [...new Set(items.flatMap(i => {
        const last = i.history[i.history.length - 1]
        const v = last?.fieldValues?.[field.id] ?? i.values?.[field.id] ?? ''
        return v ? [v] : []
      }))].sort()

  return {
    field: `f_${field.id}`,
    headerName: field.label,
    width: 140,
    type: valueOptions.length ? 'singleSelect' : 'string',
    valueOptions: valueOptions.length ? valueOptions : undefined,
    valueGetter: (_v: unknown, row: ReviewedItem) => {
      const last = row.history[row.history.length - 1]
      return last?.fieldValues?.[field.id] ?? row.values?.[field.id] ?? ''
    },
    renderCell: (p: GridRenderCellParams) => p.value
      ? <Tooltip title={String(p.value)}><Typography sx={{ fontSize: 12 }} noWrap>{p.value}</Typography></Tooltip>
      : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>,
  }
}

export function ChecklistTable({
  items,
  file,
  userCapability,
  userName,
  userRole,
  selectedIds = [],
  onSelectionChange,
  onSaveResponse,
  onConfirm,
  onAssignItem,
  onEditItem,
}: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) ?? null : null

  const columns: GridColDef[] = [
    {
      field: 'id', headerName: 'ID', width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Typography component="code" sx={{ fontSize: 11, fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: 'description', headerName: 'Description', flex: 1, minWidth: 220,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={String(p.value)} placement="top-start">
          <Typography sx={{ fontSize: 12 }} noWrap>{p.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      type: 'singleSelect',
      valueGetter: (_v: unknown, row: ReviewedItem) => {
        if (!row.status || (row.status as string) === 'pending') return 'not-started'
        if ((row.status as string) === 'fail') return 'failed'
        return row.status
      },
      valueOptions: [
        { value: 'not-started', label: 'Not Started' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'in-review', label: 'In Review' },
        { value: 'pass', label: 'Pass' },
        { value: 'failed', label: 'Failed' },
        { value: 'na', label: 'N/A' },
      ],
      valueFormatter: (value: unknown) => {
        if (!value) return 'Not Started'
        const s = value as ItemStatus
        return STATUS_META[s]?.label ?? String(value)
      },
      renderCell: (p: GridRenderCellParams) => <StatusBadge status={p.value as ItemStatus} />,
    },
    {
      field: 'required', headerName: 'Required', width: 95, type: 'boolean',
      renderCell: (p: GridRenderCellParams) => p.value
        ? (
          <Chip
            label="Required"
            size="small"
            variant="outlined"
            sx={{
              color: '#475569',
              borderColor: '#cbd5e1',
              bgcolor: 'rgba(241, 245, 249, 0.6)',
              fontSize: 10,
              fontWeight: 600,
              height: 20,
            }}
          />
        )
        : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>Optional</Typography>,
    },
    {
      field: 'category', headerName: 'Category', width: 130,
      type: 'singleSelect',
      valueOptions: [...new Set(items.map(i => i.category))].sort(),
      renderCell: (p: GridRenderCellParams) => <Chip label={p.value} size="small" variant="outlined" />,
    },
    {
      field: 'assignedTo', headerName: 'Assigned To', width: 150,
      valueGetter: (_v: unknown, row: ReviewedItem) => row.assignedTo?.name ?? row.assignedTo?.role ?? '',
      type: 'singleSelect',
      valueOptions: [...new Set(items.map(i => i.assignedTo?.name ?? i.assignedTo?.role ?? '').filter(Boolean))].sort(),
      renderCell: (p: GridRenderCellParams) => p.value
        ? <Chip label={p.value} size="small" color="primary" variant="outlined" />
        : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>,
    },
    {
      field: 'lastActor', headerName: 'Last Actor', width: 160,
      valueGetter: (_v: unknown, row: ReviewedItem) => {
        const last = row.history[row.history.length - 1]
        return last ? `${last.actorName} (${last.role})` : ''
      },
      type: 'singleSelect',
      valueOptions: [...new Set(
        items.map(i => { const l = i.history[i.history.length - 1]; return l ? `${l.actorName} (${l.role})` : '' }).filter(Boolean)
      )].sort(),
      renderCell: (p: GridRenderCellParams) => {
        const last = (p.row as ReviewedItem).history.at(-1)
        if (!last) return <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>
        return (
          <Tooltip title={`${last.role} · ${new Date(last.timestamp).toLocaleString()}`}>
            <Box>
              <Typography sx={{ fontSize: 12 }}>{last.actorName}</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{last.role}</Typography>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'confirmedBy', headerName: 'Confirmed', width: 120,
      type: 'singleSelect', valueOptions: ['Yes', 'No'],
      valueGetter: (_v: unknown, row: ReviewedItem) => row.confirmedBy ? 'Yes' : 'No',
      renderCell: (p: GridRenderCellParams) => p.value === 'Yes'
        ? <Chip label={`✓ ${(p.row as ReviewedItem).confirmedBy?.actorName}`} color="success" size="small" />
        : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>,
    },
    ...file.fields.map(f => buildFieldCol(f, items)),
    {
      field: '__actions', headerName: 'Action', width: 130,
      sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => {
        const item = p.row as ReviewedItem
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RateReviewOutlinedIcon sx={{ fontSize: 14 }} />}
              onClick={e => {
                e.stopPropagation()
                setSelectedItemId(item.id)
              }}
              sx={{ fontSize: 11, py: 0.25, px: 1, minWidth: 64 }}
            >
              {userCapability === 'read-only' ? 'View' : 'Respond'}
            </Button>
            {onEditItem && (
              <Tooltip title="Edit item structure">
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    onEditItem(item.id)
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      },
    },
  ]

  return (
    <>
      <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={r => r.id}
          density="compact"
          autoHeight
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={{
            type: 'include',
            ids: new Set(selectedIds),
          }}
          onRowSelectionModelChange={(newModel: GridRowSelectionModel) => {
            if (newModel.type === 'include') {
              onSelectionChange?.(Array.from(newModel.ids).map(String))
            } else {
              const allIds = items.map(i => i.id)
              onSelectionChange?.(allIds.filter(id => !newModel.ids.has(id)))
            }
          }}
          onRowClick={p => setSelectedItemId((p.row as ReviewedItem).id)}
          slots={{ toolbar: Toolbar }}
          getRowClassName={r => {
            const item = r.row as ReviewedItem
            const isAssigned =
              (item.assignedTo?.name && item.assignedTo.name.toLowerCase() === userName.toLowerCase()) ||
              (item.assignedTo?.role && userRole.toLowerCase().includes(item.assignedTo.role.toLowerCase()))
            return `row-${item.status} ${isAssigned ? 'row-assigned' : ''}`
          }}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          sx={{
            width: '100%',
            maxWidth: '100%',
            cursor: 'pointer',
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
            '& .row-assigned': {
              borderLeft: '3px solid #2563eb !important',
            },
          }}
        />
      </Box>

      <ItemResponseDrawer
        open={!!selectedItem}
        item={selectedItem}
        file={file}
        userCapability={userCapability}
        userName={userName}
        userRole={userRole}
        onSaveResponse={onSaveResponse}
        onConfirm={onConfirm}
        onAssignItem={onAssignItem}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  )
}
