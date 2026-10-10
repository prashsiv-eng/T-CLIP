import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {
  Box,
  ButtonBase,
  CircularProgress,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import { formatTime, isFileSystemAccessSupported } from '../../utils/fileStorage'

export interface AutoSaveToggleProps {
  enabled: boolean
  status: 'saved' | 'saving' | 'error' | 'off'
  target: 'disk' | 'browser' | 'none'
  fileName?: string | null
  lastSavedAt?: string | null
  error?: string | null
  onToggle: () => void
  onConnectDisk?: () => void
  onSaveNow?: () => void
}

export function AutoSaveToggle({
  enabled,
  status,
  target,
  fileName,
  lastSavedAt,
  error,
  onToggle,
  onConnectDisk,
  onSaveNow,
}: AutoSaveToggleProps) {
  const fsSupported = isFileSystemAccessSupported()
  const formattedTime = formatTime(lastSavedAt)

  let tooltipText = ''
  if (!enabled) {
    tooltipText = 'Auto-save is OFF. Changes are kept in temporary memory until manually exported.'
  } else if (status === 'saving') {
    tooltipText = 'Saving your latest changes...'
  } else if (status === 'error') {
    tooltipText = `Auto-save error: ${error || 'Failed to save to disk'}. Click to retry.`
  } else if (target === 'disk') {
    tooltipText = `Auto-save is ON: Changes automatically saved to ${fileName || 'disk file'}${
      formattedTime ? ` (last saved ${formattedTime})` : ''
    }. No manual export required!`
  } else {
    tooltipText = `Auto-save is ON: Changes automatically saved in browser session${
      formattedTime ? ` (${formattedTime})` : ''
    }.${fsSupported ? ' Click "Connect File" to save directly to a file on your computer.' : ''}`
  }

  return (
    <Tooltip title={tooltipText} arrow enterDelay={400}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: enabled
            ? target === 'disk'
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(56, 189, 248, 0.1)'
            : 'rgba(30, 41, 59, 0.7)',
          border: '1px solid',
          borderColor: enabled
            ? target === 'disk'
              ? 'rgba(52, 211, 153, 0.4)'
              : 'rgba(56, 189, 248, 0.35)'
            : 'rgba(71, 85, 105, 0.4)',
          borderRadius: 2,
          px: 1.25,
          py: 0.25,
          height: 32,
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          boxShadow: enabled
            ? '0 0 10px rgba(16, 185, 129, 0.1)'
            : 'none',
        }}
      >
        {/* Toggle Switch */}
        <Switch
          size="small"
          checked={enabled}
          onChange={onToggle}
          slotProps={{
            input: {
              'aria-label': 'Toggle auto-save',
              role: 'switch',
            },
          }}
          sx={{
            m: 0,
            p: 0.5,
            width: 36,
            height: 22,
            '& .MuiSwitch-switchBase': {
              p: 0.5,
              '&.Mui-checked': {
                transform: 'translateX(14px)',
                color: target === 'disk' ? '#34d399' : '#38bdf8',
                '& + .MuiSwitch-track': {
                  bgcolor: target === 'disk' ? '#059669' : '#0284c7',
                  opacity: 0.9,
                },
              },
            },
            '& .MuiSwitch-thumb': {
              width: 12,
              height: 12,
            },
            '& .MuiSwitch-track': {
              borderRadius: 11,
              bgcolor: '#475569',
              opacity: 0.7,
            },
          }}
        />

        {/* Label & Status Container */}
        <ButtonBase
          onClick={status === 'error' && onSaveNow ? onSaveNow : onToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: 1,
            py: 0.25,
            '&:hover': { opacity: 0.9 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: enabled ? '#f8fafc' : '#94a3b8',
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                }}
              >
                Auto-save
              </Typography>

              {/* Status Icons */}
              {!enabled && (
                <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                  OFF
                </Typography>
              )}

              {enabled && status === 'saving' && (
                <CircularProgress size={10} thickness={6} sx={{ color: '#38bdf8' }} />
              )}

              {enabled && status === 'error' && (
                <ErrorOutlineIcon sx={{ fontSize: 13, color: '#f87171' }} />
              )}

              {enabled && status === 'saved' && target === 'disk' && (
                <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#34d399' }} />
              )}

              {enabled && status === 'saved' && target === 'browser' && (
                <CloudDoneOutlinedIcon sx={{ fontSize: 13, color: '#38bdf8' }} />
              )}
            </Box>

            {/* Sub-label */}
            {enabled && (
              <Typography
                noWrap
                sx={{
                  fontSize: 9.5,
                  color:
                    status === 'error'
                      ? '#f87171'
                      : target === 'disk'
                        ? '#6ee7b7'
                        : '#7dd3fc',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  maxWidth: 105,
                }}
              >
                {status === 'saving'
                  ? 'Saving…'
                  : status === 'error'
                    ? 'Save error'
                    : target === 'disk'
                      ? 'Saved to Disk'
                      : 'Browser session'}
              </Typography>
            )}
          </Box>
        </ButtonBase>

        {/* Connect Disk Button if browser target and FS supported */}
        {enabled && target === 'browser' && fsSupported && onConnectDisk && (
          <ButtonBase
            onClick={onConnectDisk}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 10,
              fontWeight: 600,
              color: '#38bdf8',
              bgcolor: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 1.25,
              px: 0.75,
              py: 0.25,
              ml: 0.25,
              '&:hover': {
                bgcolor: 'rgba(56, 189, 248, 0.25)',
                borderColor: '#38bdf8',
              },
            }}
          >
            <SaveOutlinedIcon sx={{ fontSize: 11 }} />
            Connect File
          </ButtonBase>
        )}
      </Box>
    </Tooltip>
  )
}
