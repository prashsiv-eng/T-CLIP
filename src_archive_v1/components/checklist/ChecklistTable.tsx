import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import type { CapabilityLevel, ChecklistFile, FieldSchema, ItemStatus, ReviewAction, ReviewedItem } from '../../types'

const STATUS_COLOR: Record<ItemStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning', pass: 'success', fail: 'error', na: 'default',
}

interface Props {
  items: ReviewedItem[]; file: ChecklistFile; userCapability: CapabilityLevel
  userName: string; userRole: string
  onSaveResponse: (itemId: string, action: ReviewAction) => void
  onConfirm: (itemId: string, action: ReviewAction) => void
  onEditItem?: (itemId: string) => void
}

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ px: 1.5, py: 1, gap: 1, borderBottom: '1px solid #f1f5f9' }}>
      <GridToolbarQuickFilter debounceMs={200} placeholder="Quick filter…" />
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

  const col: GridColDef = {
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
      ? <Tooltip title={String(p.value)}><Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.value}</Typography></Tooltip>
      : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>,
  }
  return col
}

export function ChecklistTable({ items, file, onEditItem }: Props) {
  const columns: GridColDef[] = [
    {
      field: 'id', headerName: 'ID', width: 100,
      renderCell: (p: GridRenderCellParams) => <Typography component="code" sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{p.value}</Typography>,
    },
    {
      field: 'description', headerName: 'Description', flex: 1, minWidth: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title={String(p.value)} placement="top-start">
          <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      type: 'singleSelect', valueOptions: ['pending', 'pass', 'fail', 'na'],
      renderCell: (p: GridRenderCellParams) => <Chip label={p.value} color={STATUS_COLOR[p.value as ItemStatus]} size="small" />,
    },
    {
      field: 'required', headerName: 'Required', width: 100, type: 'boolean',
      renderCell: (p: GridRenderCellParams) => p.value
        ? <Chip label="Required" size="small" color="warning" variant="outlined" />
        : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>Optional</Typography>,
    },
    {
      field: 'category', headerName: 'Category', width: 140,
      type: 'singleSelect',
      valueOptions: [...new Set(items.map(i => i.category))].sort(),
      renderCell: (p: GridRenderCellParams) => <Chip label={p.value} size="small" variant="outlined" />,
    },
    {
      field: 'assignedTo', headerName: 'Assigned To', width: 140,
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
      valueOptions: [...new Set(items.map(i => {
        const last = i.history[i.history.length - 1]
        return last ? `${last.actorName} (${last.role})` : ''
      }).filter(Boolean))].sort(),
      renderCell: (p: GridRenderCellParams) => {
        const last = (p.row as ReviewedItem).history.at(-1)
        return last
          ? <Tooltip title={`${last.role} · ${new Date(last.timestamp).toLocaleString()}`}>
              <Box><Typography sx={{ fontSize: 12 }}>{last.actorName}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{last.role}</Typography></Box>
            </Tooltip>
          : <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>
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
    ...(onEditItem ? [{
      field: '__actions', headerName: '', width: 48,
      sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => (
        <IconButton size="small" onClick={() => onEditItem((p.row as ReviewedItem).id)}>
          <EditOutlinedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      ),
    }] : []),
  ]

  return (
    <DataGrid
      rows={items}
      columns={columns}
      getRowId={r => r.id}
      density="compact"
      autoHeight
      disableRowSelectionOnClick
      slots={{ toolbar: Toolbar }}
      getRowClassName={r => `row-${(r.row as ReviewedItem).status}`}
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}
    />
  )
}
