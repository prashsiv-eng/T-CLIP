import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useState } from 'react'
import type { CapabilityLevel, ChecklistFile, FieldSchema, ItemStatus, ReviewAction, ReviewedItem } from '../../types'
import { ItemResponseDrawer } from './ItemResponseDrawer'


interface Props {
  items: ReviewedItem[]
  file: ChecklistFile
  userCapability: CapabilityLevel
  userName: string
  userRole: string
  onSaveResponse: (id: string, action: ReviewAction) => void
  onConfirm: (id: string, action: ReviewAction) => void
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
  items, file, userCapability, userName, userRole,
  onSaveResponse, onConfirm, onEditItem,
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
      field: 'status', headerName: 'Status', width: 110,
      type: 'singleSelect', valueOptions: ['pending', 'pass', 'fail', 'na'],
      renderCell: (p: GridRenderCellParams) => {
        const status = p.value as ItemStatus
        if (status === 'pass') return <Chip label="pass" color="success" size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
        if (status === 'fail') return <Chip label="fail" color="error" size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
        if (status === 'pending') {
          return (
            <Chip
              label="pending"
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          )
        }
        return (
          <Chip
            label="n/a"
            size="small"
            variant="outlined"
            sx={{ color: '#94a3b8', borderColor: '#e2e8f0', fontSize: 11 }}
          />
        )
      },
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
              {userCapability === 'observer' ? 'View' : 'Respond'}
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
          disableRowSelectionOnClick
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
        onClose={() => setSelectedItemId(null)}
      />
    </>
  )
}
