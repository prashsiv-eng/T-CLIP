import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EditNoteIcon from '@mui/icons-material/EditNote'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { Box, ButtonBase, Chip, Tooltip, Typography } from '@mui/material'
import type { ItemStatus, ReviewedItem } from '../../types'

export type StatusFilterType = ItemStatus | 'in-progress-or-blocked' | 'resolved' | 'all'

interface Props {
  items: ReviewedItem[]
  activeFilter?: StatusFilterType
  onSelectFilter?: (filter: StatusFilterType) => void
  onNavigateToAttestation?: () => void
  hasSignoff?: boolean
}

export function WorkflowRibbon({
  items,
  activeFilter = 'all',
  onSelectFilter,
  onNavigateToAttestation,
  hasSignoff = false,
}: Props) {
  const counts = {
    notStarted: items.filter(i => !i.status || i.status === 'not-started' || (i.status as string) === 'pending').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    blocked: items.filter(i => i.status === 'blocked').length,
    inReview: items.filter(i => i.status === 'in-review').length,
    pass: items.filter(i => i.status === 'pass').length,
    failed: items.filter(i => i.status === 'failed' || (i.status as string) === 'fail').length,
    na: items.filter(i => i.status === 'na').length,
  }

  const resolvedTotal = counts.pass + counts.failed + counts.na
  const total = items.length || 1

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        px: { xs: 1.5, md: 3 },
        py: 1.25,
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        {/* Workflow Title & Reset Filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 'fit-content' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              fontSize: 11,
            }}
          >
            Workflow Sequence:
          </Typography>
          {activeFilter !== 'all' && (
            <Chip
              label="Clear Filter"
              size="small"
              onDelete={() => onSelectFilter?.('all')}
              onClick={() => onSelectFilter?.('all')}
              sx={{
                height: 22,
                fontSize: 11,
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                border: '1px solid',
              }}
            />
          )}
        </Box>

        {/* 4-Stage Horizontal Pipeline */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, sm: 1.25 },
            overflowX: 'auto',
            pb: { xs: 0.5, md: 0 },
            flex: 1,
            justifyContent: { xs: 'flex-start', md: 'center' },
          }}
        >
          {/* Stage 1: Not Started */}
          <Tooltip title="Initial backlog: Items not yet picked up by editors. Click to filter.">
            <ButtonBase
              onClick={() => onSelectFilter?.(activeFilter === 'not-started' ? 'all' : 'not-started')}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                bgcolor:
                  activeFilter === 'not-started'
                    ? 'rgba(148, 163, 184, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor:
                  activeFilter === 'not-started' ? '#94a3b8' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.15)' },
              }}
            >
              <HourglassEmptyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
                  1. Not Started
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                  {counts.notStarted} ({Math.round((counts.notStarted / total) * 100)}%)
                </Typography>
              </Box>
            </ButtonBase>
          </Tooltip>

          <ArrowForwardIcon sx={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 16, flexShrink: 0 }} />

          {/* Stage 2: In-Progress / Blocked */}
          <Tooltip title="Active implementation: Editors add notes, code references, or mark blocked. Click to filter.">
            <ButtonBase
              onClick={() =>
                onSelectFilter?.(
                  activeFilter === 'in-progress-or-blocked' ? 'all' : 'in-progress-or-blocked'
                )
              }
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                bgcolor:
                  activeFilter === 'in-progress-or-blocked' ||
                  activeFilter === 'in-progress' ||
                  activeFilter === 'blocked'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor:
                  activeFilter === 'in-progress-or-blocked' ||
                  activeFilter === 'in-progress' ||
                  activeFilter === 'blocked'
                    ? '#38bdf8'
                    : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.12)' },
              }}
            >
              <EditNoteIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                  2. In-Progress / Blocked
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontSize: 11, color: '#bae6fd' }}>
                    {counts.inProgress} active
                  </Typography>
                  {counts.blocked > 0 && (
                    <Box
                      component="span"
                      onClick={e => {
                        e.stopPropagation()
                        onSelectFilter?.(activeFilter === 'blocked' ? 'all' : 'blocked')
                      }}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        px: 0.5,
                        py: 0.1,
                        borderRadius: 1,
                        bgcolor: 'rgba(244, 63, 94, 0.2)',
                        color: '#fda4af',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      <BlockIcon sx={{ fontSize: 10 }} />
                      {counts.blocked} blocked
                    </Box>
                  )}
                </Box>
              </Box>
            </ButtonBase>
          </Tooltip>

          <ArrowForwardIcon sx={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 16, flexShrink: 0 }} />

          {/* Stage 3: In Review */}
          <Tooltip title="Evaluation queue: Reviewers verify evidence and inspect controls. Click to filter.">
            <ButtonBase
              onClick={() => onSelectFilter?.(activeFilter === 'in-review' ? 'all' : 'in-review')}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                bgcolor:
                  activeFilter === 'in-review'
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor:
                  activeFilter === 'in-review' ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.15)' },
              }}
            >
              <FactCheckOutlinedIcon sx={{ fontSize: 18, color: '#a855f7' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#d8b4fe' }}>
                  3. In Review
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#c084fc', fontWeight: 600 }}>
                  {counts.inReview} awaiting decision
                </Typography>
              </Box>
            </ButtonBase>
          </Tooltip>

          <ArrowForwardIcon sx={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 16, flexShrink: 0 }} />

          {/* Stage 4: Resolved (Pass / Failed / N/A) */}
          <Tooltip title="Resolved findings: Final outcomes decided by reviewers. Click to filter.">
            <ButtonBase
              onClick={() => onSelectFilter?.(activeFilter === 'resolved' ? 'all' : 'resolved')}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                bgcolor:
                  activeFilter === 'resolved' ||
                  activeFilter === 'pass' ||
                  activeFilter === 'failed' ||
                  activeFilter === 'na'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor:
                  activeFilter === 'resolved' ||
                  activeFilter === 'pass' ||
                  activeFilter === 'failed' ||
                  activeFilter === 'na'
                    ? '#10b981'
                    : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' },
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
                  4. Pass / Failed / N/A
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
                  <Box
                    component="span"
                    onClick={e => {
                      e.stopPropagation()
                      onSelectFilter?.(activeFilter === 'pass' ? 'all' : 'pass')
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: '#4ade80',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircleOutlinedIcon sx={{ fontSize: 13 }} />
                    {counts.pass}
                  </Box>
                  <Box
                    component="span"
                    onClick={e => {
                      e.stopPropagation()
                      onSelectFilter?.(activeFilter === 'failed' ? 'all' : 'failed')
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: '#f87171',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <HighlightOffIcon sx={{ fontSize: 13 }} />
                    {counts.failed}
                  </Box>
                  <Box
                    component="span"
                    onClick={e => {
                      e.stopPropagation()
                      onSelectFilter?.(activeFilter === 'na' ? 'all' : 'na')
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: '#94a3b8',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <RemoveCircleOutlinedIcon sx={{ fontSize: 13 }} />
                    {counts.na}
                  </Box>
                </Box>
              </Box>
            </ButtonBase>
          </Tooltip>
        </Box>

        {/* Milestone 5: Overall Release Sign-Off */}
        <Tooltip title="Overall release certification: Authorized sign-off role signs and seals SHA-256 hash.">
          <ButtonBase
            onClick={onNavigateToAttestation}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: hasSignoff ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid',
              borderColor: hasSignoff ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minWidth: 'fit-content',
              '&:hover': { bgcolor: hasSignoff ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: hasSignoff ? '#10b981' : '#f59e0b' }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: hasSignoff ? '#4ade80' : '#fbbf24',
                }}
              >
                Release Sign-off
              </Typography>
              <Typography sx={{ fontSize: 11, color: hasSignoff ? '#86efac' : '#94a3b8' }}>
                {hasSignoff ? 'Signed & Attested' : `${resolvedTotal}/${total} Resolved`}
              </Typography>
            </Box>
          </ButtonBase>
        </Tooltip>
      </Box>
    </Box>
  )
}
