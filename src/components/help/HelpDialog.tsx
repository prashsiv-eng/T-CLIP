import CloseIcon from '@mui/icons-material/Close'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  initialTab?: number
}

const GITHUB_REPO_URL = 'https://github.com/prashsiv-eng/T-CLIP'

export function HelpDialog({ open, onClose, initialTab = 0 }: Props) {
  const [tabIndex, setTabIndex] = useState(initialTab)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: 3,
            p: 0,
            overflow: 'hidden',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          bgcolor: '#0b1120',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <HelpOutlineOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                T-CLIP Quick Guide
              </Typography>
              <Chip
                label="Practical Help"
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
              How T-CLIP works and how your team can use it daily
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ bgcolor: '#0b1120', borderBottom: '1px solid #1e293b', px: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              color: '#94a3b8',
              '&.Mui-selected': { color: '#38bdf8' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#38bdf8', height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="1. What &amp; Why" />
          <Tab icon={<FactCheckOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="2. Daily Team Routine" />
          <Tab icon={<PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="3. Who Does What" />
          <Tab icon={<TableChartOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="4. Features &amp; Screens" />
          <Tab icon={<LightbulbOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="5. Tips for Success" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <DialogContent sx={{ p: { xs: 2.5, md: 3 }, overflowY: 'auto' }}>
        {/* TAB 1: WHAT & WHY */}
        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                What is T-CLIP?
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7 }}>
                Think of <strong>T-CLIP</strong> as an interactive pre-release checklist for your software. Before code goes to production, it helps your team verify that required security, quality, and architectural standards are actually met.
              </Typography>
            </Box>

            <Alert
              severity="success"
              sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#d1fae5' }}
            >
              <strong>Zero Setup &amp; 100% Private:</strong> T-CLIP runs entirely in your browser. There are no logins, no servers, and no third-party cloud accounts. Your checklist file (<code>checklist.json</code>) lives right inside your Git repository alongside your code.
            </Alert>

            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', mb: 1.5 }}>
                Why use T-CLIP instead of a spreadsheet?
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#f87171', mb: 0.75 }}>
                    Why Spreadsheets Fail
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6 }}>
                    • Cells get accidentally deleted or overwritten.<br />
                    • No way to tell who approved what or when.<br />
                    • Completely detached from your GitHub pull requests.<br />
                    • Teams rush to fill them out the day before launch.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#34d399', mb: 0.75 }}>
                    The T-CLIP Way
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                    • Clean checklist that anyone can search and filter.<br />
                    • Direct links to PRs and test runs as proof.<br />
                    • Clear roles (developer adds proof, lead approves).<br />
                    • Changes are tracked in Git commits like normal code.
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                Common Situations Where You&apos;ll Use It
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { title: 'Pre-Release Security Reviews', desc: 'Confirm authentication, encryption, input validation, and access control before shipping.' },
                  { title: 'AI & LLM Safeguards', desc: 'Verify prompt injection guardrails, sensitive data filters, and output sandboxing for AI apps.' },
                  { title: 'Compliance & Audit Evidence', desc: 'Keep an auditable, dated record for SOC 2, ISO 27001, or client security reviews without extra paperwork.' },
                  { title: 'Team Production Readiness', desc: 'Ensure logging, error handling, rate limiting, and rollback plans are ready.' },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ p: 1.25, px: 1.75, borderRadius: 1.5, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{item.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{item.desc}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 2: DAILY TEAM ROUTINE */}
        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                How Your Team Uses T-CLIP Day-to-Day
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                The secret to easy compliance is simple: <strong>update the checklist at every major PR</strong>, rather than doing everything the day before launch.
              </Typography>
            </Box>

            {/* Workflow steps */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {[
                {
                  step: 'Step 1: One-Time Project Setup (Lead / Architect)',
                  badge: 'Done Once',
                  badgeColor: '#3b82f6',
                  desc: 'Click "New Checklist", pick an industry standard (like OWASP ASVS or NIST AI) or create custom items, and export checklist.json into your Git repo root.',
                },
                {
                  step: 'Step 2: While Building Features (Developer / Contributor)',
                  badge: 'Every Major PR',
                  badgeColor: '#10b981',
                  desc: 'Whenever you write code that touches security, auth, or sensitive logic: open checklist.json in T-CLIP, find the relevant items, paste your PR link or test run into the Evidence URL field, and save.',
                },
                {
                  step: 'Step 3: During Code Review (Reviewer / Security Lead)',
                  badge: 'PR Review',
                  badgeColor: '#8b5cf6',
                  desc: 'When reviewing the PR, open T-CLIP, inspect the linked evidence, and toggle the item to "Pass" (or "Fail" if changes are needed). Commit the updated checklist.json with the PR.',
                },
                {
                  step: 'Step 4: Release Sign-Off (Release Manager / Approver)',
                  badge: 'Before Release',
                  badgeColor: '#f59e0b',
                  desc: 'Before tagging a release, check the T-CLIP Dashboard. If everything is green, click "Confirm Sign-Off" and download the final attestation file (checklist-attestation.json) for audit proof.',
                },
                {
                  step: 'Step 5: Start Next Release / PR Cycle',
                  badge: 'Next Phase',
                  badgeColor: '#10b981',
                  desc: 'Click "New Release / PR" in the top bar. T-CLIP warns you to export/save your current state first, then resets all checks to "Not Started" and wipes review comments, while keeping all evidence and responses intact so you don\'t have to re-enter them.',
                },
              ].map((item, idx) => (
                <Paper key={idx} sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75, flexWrap: 'wrap', gap: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{item.step}</Typography>
                    <Chip label={item.badge} size="small" sx={{ bgcolor: `${item.badgeColor}22`, color: item.badgeColor, fontWeight: 700, fontSize: 11 }} />
                  </Box>
                  <Typography sx={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</Typography>
                </Paper>
              ))}
            </Box>

            {/* Practical PR habit callout */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#0b1120', border: '1px dashed #3b82f6' }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#60a5fa', mb: 0.5 }}>
                Practical Rule of Thumb for Developers:
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                If your PR adds or changes authentication, payments, data storage, user permissions, or AI prompts, include the updated <code>checklist.json</code> in your PR commit. That way, the reviewer can approve code and compliance in one go!
              </Typography>
            </Box>
          </Box>
        )}

        {/* TAB 3: WHO DOES WHAT */}
        {tabIndex === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                Roles &amp; Separation of Duties
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                To keep audits trustworthy, T-CLIP makes sure the person writing the code isn&apos;t the sole person approving it.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                {
                  role: 'Contributor (Developer)',
                  color: '#38bdf8',
                  action: 'Can attach evidence, links, and notes.',
                  detail: 'You write code and link your PR as proof. You cannot unilaterally mark items as "Pass" or "Approved".',
                },
                {
                  role: 'Reviewer (Tech Lead / Security)',
                  color: '#a78bfa',
                  action: 'Can evaluate items and mark Pass / Fail / N/A.',
                  detail: 'You inspect the developer&apos;s evidence, test results, and code to verify that the control is genuinely met.',
                },
                {
                  role: 'Approver (Release Lead / Manager)',
                  color: '#34d399',
                  action: 'Can give final sign-off and seal the release.',
                  detail: 'You review the completed checklist before launch, confirm decisions, and export the official attestation.',
                },
                {
                  role: 'Editor (Admin / Checklist Creator)',
                  color: '#fbbf24',
                  action: 'Can customize items and categories.',
                  detail: 'You add or remove checklist items to tailor them to your team&apos;s specific architecture.',
                },
                {
                  role: 'Observer (Auditor / Stakeholder)',
                  color: '#94a3b8',
                  action: 'Read-only view.',
                  detail: 'You can inspect the entire checklist, view dashboard metrics, and verify proof without changing any data.',
                },
              ].map((item, idx) => (
                <Paper key={idx} sx={{ p: 1.75, px: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.role}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>— {item.action}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{item.detail}</Typography>
                </Paper>
              ))}
            </Box>

            <Alert severity="info" sx={{ bgcolor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#bae6fd' }}>
              <strong>How to switch roles:</strong> Click your name avatar in the top-right corner of the screen at any time to switch your role or active persona.
            </Alert>
          </Box>
        )}

        {/* TAB 4: FEATURES & SCREENS */}
        {tabIndex === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                Features &amp; Interface Walkthrough
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                Here is a quick look at the main screens you&apos;ll use in T-CLIP:
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Screen 1: Checklist */}
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#60a5fa', mb: 0.5 }}>
                  1. The Checklist Screen (Daily Workhorse)
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', mb: 1.5, lineHeight: 1.5 }}>
                  • <strong>Search &amp; Filter:</strong> Type keywords or click quick filters like <em>&quot;Pending&quot;</em> or <em>&quot;Assigned to me&quot;</em>.<br />
                  • <strong>Accordion vs Data Grid:</strong> Switch between a clean category list and a compact spreadsheet table.<br />
                  • <strong>Evidence Drawer:</strong> Click any item to attach PR URLs, test run links, or review notes.
                </Typography>
                <Box
                  component="img"
                  src="/screenshots/screenshot-checklist.svg"
                  alt="T-CLIP Checklist View"
                  sx={{ width: '100%', borderRadius: 1.5, border: '1px solid #334155' }}
                />
              </Card>

              {/* Screen 2: Dashboard */}
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#34d399', mb: 0.5 }}>
                  2. Executive Analytics Dashboard
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', mb: 1.5, lineHeight: 1.5 }}>
                  • <strong>Completion Donut:</strong> See overall progress across Pass, Fail, and Pending at a glance.<br />
                  • <strong>Category Bars:</strong> Instantly spot which areas (e.g. Auth, Encryption) still need work before release.<br />
                  • <strong>Action Items:</strong> See which items are waiting for reviewer evaluation or manager sign-off.
                </Typography>
                <Box
                  component="img"
                  src="/screenshots/screenshot-dashboard.svg"
                  alt="T-CLIP Dashboard View"
                  sx={{ width: '100%', borderRadius: 1.5, border: '1px solid #334155' }}
                />
              </Card>

              {/* Screen 3: Attestation */}
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', mb: 0.5 }}>
                  3. Pre-Release Attestation &amp; Sign-Off
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', mb: 1.5, lineHeight: 1.5 }}>
                  When 100% of required items are resolved, T-CLIP creates a tamper-proof <code>checklist-attestation.json</code> certificate recording who approved the release, complete with timestamps and a verification fingerprint.
                </Typography>
                <Box
                  component="img"
                  src="/screenshots/screenshot-attestation.svg"
                  alt="T-CLIP Attestation View"
                  sx={{ width: '100%', borderRadius: 1.5, border: '1px solid #334155' }}
                />
              </Card>
            </Box>
          </Box>
        )}

        {/* TAB 5: TIPS FOR SUCCESS */}
        {tabIndex === 4 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                Practical Tips for Everyday Success
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                Common questions and best practices from teams using T-CLIP in production:
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>
                  What if a check doesn&apos;t apply to our service?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                  Mark it as <strong>N/A</strong>! Simply write a short 1-sentence note explaining why (e.g. <em>&quot;This microservice has no public UI or web endpoints&quot;</em>). Auditors love clear N/A explanations much more than blank items.
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>
                  What if I close my browser tab accidentally?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                  Don&apos;t panic. T-CLIP automatically auto-saves your in-progress answers in your browser memory. When you reopen T-CLIP, a restore banner will appear asking if you want to restore your work.
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>
                  How do we save our changes permanently?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                  Click <strong>&quot;Export JSON&quot;</strong> in the top bar to download the updated <code>checklist.json</code> to your machine, then commit it to Git with <code>git commit checklist.json</code>.
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>
                  Can we edit or add custom items to our checklist?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                  Yes! Switch your persona to <strong>Editor</strong> (or Checklist Owner), and edit icons will appear next to items allowing you to add, modify, or delete questions.
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ borderColor: '#334155', my: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                Need more info or want to view source code?
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<GitHubIcon />}
                endIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#cbd5e1',
                  borderColor: '#334155',
                  textTransform: 'none',
                  fontSize: 12,
                  '&:hover': { borderColor: '#3b82f6', color: '#fff' },
                }}
              >
                GitHub Project
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: '#0b1120',
          borderTop: '1px solid #1e293b',
        }}
      >
        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
          100% Local-First · Zero Telemetry · Open Source (MIT)
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={onClose}
          sx={{
            bgcolor: '#2563eb',
            textTransform: 'none',
            fontSize: 12,
            px: 2.5,
            fontWeight: 600,
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          Got it, Close Guide
        </Button>
      </Box>
    </Dialog>
  )
}
