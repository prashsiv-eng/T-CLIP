import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EditNoteIcon from '@mui/icons-material/EditNote'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import { Chip, type ChipProps } from '@mui/material'
import type { ItemStatus } from '../../types'

export interface StatusMeta {
  label: string
  color: string
  borderColor: string
  bgColor: string
  icon: React.ReactElement
}

export const STATUS_META: Record<ItemStatus, StatusMeta> = {
  'not-started': {
    label: 'Not Started',
    color: '#64748b',
    borderColor: '#cbd5e1',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} />,
  },
  'in-progress': {
    label: 'In Progress',
    color: '#0284c7',
    borderColor: '#7dd3fc',
    bgColor: 'rgba(2, 132, 199, 0.15)',
    icon: <EditNoteIcon sx={{ fontSize: 14 }} />,
  },
  blocked: {
    label: 'Blocked',
    color: '#e11d48',
    borderColor: '#fda4af',
    bgColor: 'rgba(225, 29, 72, 0.15)',
    icon: <BlockIcon sx={{ fontSize: 13 }} />,
  },
  'in-review': {
    label: 'In Review',
    color: '#9333ea',
    borderColor: '#d8b4fe',
    bgColor: 'rgba(147, 51, 234, 0.15)',
    icon: <FactCheckOutlinedIcon sx={{ fontSize: 13 }} />,
  },
  pass: {
    label: 'Pass',
    color: '#16a34a',
    borderColor: '#86efac',
    bgColor: 'rgba(22, 163, 74, 0.15)',
    icon: <CheckCircleOutlinedIcon sx={{ fontSize: 13 }} />,
  },
  failed: {
    label: 'Failed',
    color: '#dc2626',
    borderColor: '#fca5a5',
    bgColor: 'rgba(220, 38, 38, 0.15)',
    icon: <HighlightOffIcon sx={{ fontSize: 13 }} />,
  },
  na: {
    label: 'N/A',
    color: '#64748b',
    borderColor: '#cbd5e1',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    icon: <RemoveCircleOutlinedIcon sx={{ fontSize: 13 }} />,
  },
}

interface Props extends Omit<ChipProps, 'color'> {
  status: ItemStatus
  showIcon?: boolean
}

export function StatusBadge({ status, showIcon = true, size = 'small', sx, ...rest }: Props) {
  const meta = STATUS_META[status] ?? STATUS_META['not-started']

  return (
    <Chip
      label={meta.label}
      icon={showIcon ? meta.icon : undefined}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? 11 : 12,
        height: size === 'small' ? 22 : 26,
        color: meta.color,
        bgcolor: meta.bgColor,
        border: '1px solid',
        borderColor: meta.borderColor,
        '& .MuiChip-icon': {
          color: meta.color,
          ml: 0.5,
          mr: -0.25,
        },
        ...sx,
      }}
      {...rest}
    />
  )
}
