import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { darkTheme } from '../../theme'
import { HelpDialog } from '../help/HelpDialog'
import { AboutDialog } from './AboutDialog'

interface Props {
  onNew: () => void
  onOpen: () => void
}

const GITHUB_REPO_URL = 'https://github.com/prashsiv-eng/T-CLIP'

export function HomeScreen({ onNew, onOpen }: Props) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh', bgcolor: '#0f172a',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />
        {/* Glow */}
        <Box sx={{
          position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 580, height: 380, borderRadius: '50%',
          background: 'radial-gradient(ellipse,#2563eb1a 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top Navbar */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2.5, sm: 4 }, py: 2,
          position: 'relative', zIndex: 2,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="v1.0.0"
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: 'rgba(59,130,246,0.12)',
                color: '#93c5fd',
                border: '1px solid rgba(59,130,246,0.25)',
              }}
            />
            <Chip
              label="Open Source"
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 600,
                color: '#94a3b8',
                borderColor: '#334155',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<HelpOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setHelpOpen(true)}
              sx={{
                color: '#cbd5e1',
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Help &amp; Guide
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setAboutOpen(true)}
              sx={{
                color: '#cbd5e1',
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              About
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<GitHubIcon sx={{ fontSize: 16 }} />}
              endIcon={<OpenInNewIcon sx={{ fontSize: '12px !important', opacity: 0.6 }} />}
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#f8fafc',
                borderColor: '#334155',
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                height: 30,
                px: 1.5,
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(59,130,246,0.1)',
                },
              }}
            >
              GitHub
            </Button>
          </Box>
        </Box>

        {/* Hero & Action Cards */}
        <Box sx={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          p: 3, position: 'relative', zIndex: 1,
        }}>
          <Box sx={{ width: '100%', maxWidth: 520 }}>
            {/* Brand Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '18px',
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.1),0 20px 40px rgba(37,99,235,0.3)',
              }}>
                <Typography sx={{ fontSize: 28, color: '#fff', fontWeight: 800, lineHeight: 1 }}>✓</Typography>
              </Box>
              <Typography sx={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', lineHeight: 1 }}>
                T-CLIP
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#93c5fd', letterSpacing: '0.03em' }}>
                The Checklist Project
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#94a3b8', letterSpacing: '0.01em', textAlign: 'center', maxWidth: 420 }}>
                Open-source, local-first compliance, security verification, and release governance framework.
              </Typography>
            </Box>

            {/* Action Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card sx={{
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.07)',
                  borderColor: '#3b82f6',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -10px rgba(37,99,235,0.3)',
                },
              }}>
                <CardActionArea onClick={onNew} sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 46, height: 46, borderRadius: '12px',
                      bgcolor: 'rgba(37,99,235,0.15)', color: '#60a5fa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(37,99,235,0.3)',
                      flexShrink: 0,
                    }}>
                      <AddCircleOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                        New Checklist
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                        Start from built-in industry standards: <strong>OWASP ASVS</strong>, <strong>CSA CAIQ</strong>, <strong>NIST AI RMF</strong>, or <strong>Agentic AI</strong>
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>

              <Card sx={{
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.07)',
                  borderColor: '#7c3aed',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px -10px rgba(124,58,237,0.3)',
                },
              }}>
                <CardActionArea onClick={onOpen} sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 46, height: 46, borderRadius: '12px',
                      bgcolor: 'rgba(124,58,237,0.15)', color: '#c4b5fd',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(124,58,237,0.3)',
                      flexShrink: 0,
                    }}>
                      <FolderOpenOutlinedIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                        Open Existing Checklist
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                        Load an existing <code>checklist.json</code> to review items, add responses, or sign off attestations
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </Box>

            {/* Footer Trust Indicators */}
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 2, mt: 4, flexWrap: 'wrap',
            }}>
              <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                100% Local-First
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>•</Typography>
              <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                Zero Telemetry
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>•</Typography>
              <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                MIT Licensed
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* About Dialog */}
        <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        {/* Help Dialog */}
        <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Box>
    </ThemeProvider>
  )
}
