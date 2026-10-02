import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { ChecklistFile } from '../../types'
import { downloadJSON } from '../../utils/export'

export const STARTER_TEMPLATE: ChecklistFile = {
  version: '1.0',
  project: '',
  branch: 'pre-dev',
  rules: {
    structureEditableBy: 'editor',
    enforcedAssignment: false,
  },
  roles: [
    'Security Reviewer',
    'Lead Developer',
    'DevOps Engineer',
    'Compliance Officer',
  ],
  users: [],
  fields: [
    {
      id: 'verification_method',
      label: 'Verification Method',
      type: 'select',
      options: [
        'Automated Scan (SAST/DAST)',
        'Manual Code Review',
        'Functional Test',
        'Architecture Review',
      ],
      requiredWhen: ['pass', 'fail'],
      editableBy: 'contributor',
      visibleTo: 'observer',
    },
    {
      id: 'evidence_url',
      label: 'Evidence / PR Link',
      type: 'url',
      requiredWhen: ['pass', 'fail'],
      editableBy: 'contributor',
      visibleTo: 'observer',
    },
    {
      id: 'finding_notes',
      label: 'Findings & Notes',
      type: 'textarea',
      requiredWhen: ['pass', 'fail'],
      editableBy: 'contributor',
      visibleTo: 'observer',
      maxLength: 1000,
    },
    {
      id: 'disposition',
      label: 'Disposition / Exception',
      type: 'select',
      options: [
        'Verified Compliant',
        'Remediation In Progress',
        'Compensating Control',
        'Risk Accepted',
        'Out of Scope / Not Applicable',
      ],
      requiredWhen: ['na'],
      editableBy: 'reviewer',
      visibleTo: 'observer',
    },
  ],
  items: [
    {
      id: 'AUTH-01',
      category: 'Authentication & Access',
      description: 'Verify that multi-factor authentication (MFA) is required for all administrative and privileged user access.',
      status: 'pending',
      required: true,
      assignedTo: { role: 'Security Reviewer' },
      values: {},
    },
    {
      id: 'AUTH-02',
      category: 'Authentication & Access',
      description: 'Verify that authentication tokens are stored securely with HttpOnly, Secure, and SameSite flags.',
      status: 'pending',
      required: true,
      assignedTo: { role: 'Lead Developer' },
      values: {},
    },
    {
      id: 'DATA-01',
      category: 'Data Protection & Cryptography',
      description: 'Verify that sensitive customer data and encryption keys are encrypted at rest using AES-256 or stronger.',
      status: 'pending',
      required: true,
      assignedTo: { role: 'Security Reviewer' },
      values: {},
    },
    {
      id: 'OPS-01',
      category: 'Operations & Deployment',
      description: 'Verify that all automated CI/CD pipeline tests pass and container images are scanned for critical vulnerabilities before production deployment.',
      status: 'pending',
      required: true,
      assignedTo: { role: 'DevOps Engineer' },
      values: {},
    },
    {
      id: 'COMP-01',
      category: 'Governance & Compliance',
      description: 'Verify that audit logs are retained in an immutable, tamper-evident storage location for at least 90 days.',
      status: 'pending',
      required: false,
      assignedTo: { role: 'Compliance Officer' },
      values: {},
    },
  ],
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateTemplateDialog({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  function handleDownload() {
    downloadJSON(STARTER_TEMPLATE, 'starter-template.json')
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(STARTER_TEMPLATE, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            backgroundImage: 'none',
            border: '1px solid #1e293b',
            borderRadius: 3,
            color: '#f8fafc',
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <PostAddOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              Create Your Own Template
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
              Author custom schema-driven checklists with role governance and custom evidence fields
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', px: 3, py: 2.5 }}>
        {/* Quick Download Action Box */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2.5,
            bgcolor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#93c5fd', mb: 0.5 }}>
              Download Starter Template (starter-template.json)
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
              A pre-configured, valid JSON checklist with placeholder categories, roles, and evidence fields ready for immediate customization.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleDownload}
              startIcon={<DownloadOutlinedIcon />}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 12,
                px: 2,
                py: 0.75,
              }}
            >
              Download JSON
            </Button>
            <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy raw JSON'}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCopy}
                startIcon={copied ? <CheckIcon sx={{ color: '#4ade80' }} /> : <ContentCopyOutlinedIcon />}
                sx={{
                  color: '#e2e8f0',
                  borderColor: '#334155',
                  textTransform: 'none',
                  fontSize: 12,
                  '&:hover': { borderColor: '#64748b', bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Step-by-Step Instructions */}
        <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', mb: 2 }}>
          How to Structure Your Template
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Step 1 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <Box sx={{ height: 20, width: 20, borderRadius: '50%', bgcolor: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  1
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Metadata & Rules</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                • <code>version</code>: Schema version (e.g. <code>"1.0"</code>).<br />
                • <code>project</code>: Name of project, or <code>""</code> to prompt on load.<br />
                • <code>rules.structureEditableBy</code>: Minimum capability needed to alter checklist items (<code>"editor"</code>, <code>"approver"</code>).<br />
                • <code>rules.enforcedAssignment</code>: Set <code>true</code> to restrict review responses only to assigned roles.
              </Typography>
            </Box>
          </Grid>

          {/* Step 2 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <Box sx={{ height: 20, width: 20, borderRadius: '50%', bgcolor: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  2
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Define Roles (&quot;roles&quot;)</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                Specify an array of strings representing the personas participating in the review (e.g. <code>[&quot;Security Reviewer&quot;, &quot;Lead Developer&quot;, &quot;QA Engineer&quot;]</code>). These enable item assignment and role-based duty separation.
              </Typography>
            </Box>
          </Grid>

          {/* Step 3 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <Box sx={{ height: 20, width: 20, borderRadius: '50%', bgcolor: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  3
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Custom Fields (&quot;fields&quot;)</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                Define input fields collected for every item.<br />
                • Types: <code>&quot;text&quot;</code>, <code>&quot;textarea&quot;</code>, <code>&quot;select&quot;</code>, <code>&quot;url&quot;</code>, <code>&quot;boolean&quot;</code>, <code>&quot;date&quot;</code>.<br />
                • <code>requiredWhen: [&quot;pass&quot;, &quot;fail&quot;]</code>: Enforces that evidence must be provided when marked pass or fail.<br />
                • <code>editableBy</code> / <code>visibleTo</code>: Role governance tiers.
              </Typography>
            </Box>
          </Grid>

          {/* Step 4 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <Box sx={{ height: 20, width: 20, borderRadius: '50%', bgcolor: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  4
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Checklist Items (&quot;items&quot;)</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                • <code>id</code>: Unique code (e.g. <code>"AUTH-01"</code>).<br />
                • <code>category</code>: Group/Domain name.<br />
                • <code>description</code>: Verification requirement text.<br />
                • <code>required</code>: <code>true</code> or <code>false</code>.<br />
                • <code>assignedTo</code>: <code>&#123; "role": "Lead Developer" &#125;</code>.<br />
                • <code>values</code>: Pre-filled custom metadata (e.g. <code>&#123; "level": "L1" &#125;</code>).
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Step 5 */}
        <Alert severity="info" sx={{ bgcolor: 'rgba(56, 189, 248, 0.08)', color: '#bae6fd', border: '1px solid rgba(56, 189, 248, 0.2)', mb: 3 }}>
          <Typography sx={{ fontSize: 12, lineHeight: 1.6 }}>
            <strong>How to Load into T-CLIP:</strong> Once you have edited your JSON file, return to the <strong>Choose a Template</strong> screen and click <strong>"Import Custom Schema"</strong> at the top of the template grid. Your custom template will be validated and loaded into an active review session immediately.
          </Typography>
        </Alert>

        {/* JSON Structure Preview */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
            Starter Template Preview
          </Typography>
          <Button size="small" onClick={handleCopy} sx={{ fontSize: 11, color: '#38bdf8', textTransform: 'none' }}>
            {copied ? '✓ Copied' : 'Copy JSON'}
          </Button>
        </Box>

        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            bgcolor: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: 2,
            overflowX: 'auto',
            maxHeight: 280,
            fontSize: 11,
            fontFamily: 'monospace',
            color: '#a5b4fc',
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(STARTER_TEMPLATE, null, 2)}
        </Box>
      </DialogContent>

      <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 12, color: '#64748b' }}>
          Valid for all T-CLIP releases · 100% Client-side JSON
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="text" size="small" onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Close
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadOutlinedIcon />}
            onClick={handleDownload}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Download Starter Template
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
