import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import CloseIcon from '@mui/icons-material/Close'
import GitHubIcon from '@mui/icons-material/GitHub'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material'

interface Props {
  open: boolean
  onClose: () => void
}

const GITHUB_REPO_URL = 'https://github.com/thechecklistproject/t-clip'

export function AboutDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: 3,
            p: 1,
            backgroundImage: 'radial-gradient(ellipse at top, rgba(37,99,235,0.12) 0%, transparent 70%)',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 16px rgba(37,99,235,0.3)',
            }}
          >
            <Typography sx={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>✓</Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                About T-CLIP
              </Typography>
              <Chip
                label="v1.0.0"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: 'rgba(59,130,246,0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
              The Checklist Project · Open-Source Governance Engine
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', py: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2.5, lineHeight: 1.6 }}>
          <strong>T-CLIP</strong> is a local-first, schema-driven checklist engine designed for security reviews, compliance audits, change management, and release sign-offs. It ensures complete auditability, role separation, and cryptographic verification without requiring an external database or backend server.
        </Typography>

        <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', mb: 1.5 }}>
          Architectural Pillars
        </Typography>

        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <StorageOutlinedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>100% Local-First</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                Zero telemetry and zero cloud dependencies. Your compliance data never leaves your browser session.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18, color: '#4ade80' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Schema-Driven</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                Declarative JSON schema standardizing requirements, custom evidence fields, and completion conditions.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ShieldOutlinedIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Role Governance</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                Role-based capability model enforcing separation of duties for reviewers, approvers, and editors.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: '#fb7185' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>SHA-256 Attestations</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                Cryptographic source file hashing and tamper-evident attestation exports ready for audit logs.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', mb: 1 }}>
          Included Standards & Templates
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          <Chip label="OWASP ASVS v4.0.3 (AppSec)" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
          <Chip label="CSA CAIQ v4 (Cloud Security)" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
          <Chip label="NIST AI RMF 1.0 (AI Governance)" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
          <Chip label="OWASP Agentic AI Top 10" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
          <Chip label="OWASP LLMSVS (AI Verification)" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
          <Chip label="OWASP LLM Top 10 (GenAI)" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 11 }} />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="MIT License" size="small" variant="outlined" sx={{ color: '#94a3b8', borderColor: '#334155', fontSize: 11 }} />
            <Chip label="Open Source" size="small" variant="outlined" sx={{ color: '#94a3b8', borderColor: '#334155', fontSize: 11 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GitHubIcon />}
              endIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#f8fafc',
                borderColor: '#334155',
                textTransform: 'none',
                fontSize: 12,
                '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59,130,246,0.1)' },
              }}
            >
              GitHub Repository
            </Button>
            <Button variant="contained" size="small" onClick={onClose} sx={{ textTransform: 'none', fontSize: 12, px: 2 }}>
              Close
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
