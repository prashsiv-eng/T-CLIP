import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { ChecklistFile, FieldSchema, ReviewedItem, SignoffRecord } from '../../types'
import { canSignoff } from '../../utils/capability'
import { buildAttestation, downloadJSON } from '../../utils/export'
import { sha256String } from '../../utils/hash'

function FieldValuesList({ fieldValues, fields }: { fieldValues: Record<string, string>; fields: FieldSchema[] }) {
  const entries = Object.entries(fieldValues).filter(([, v]) => v !== '')
  if (!entries.length) return null
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
      {entries.map(([id, val]) => {
        const label = fields.find(f => f.id === id)?.label ?? id
        return <Chip key={id} label={`${label}: ${val}`} size="small" variant="outlined" />
      })}
    </Box>
  )
}

interface Props {
  file: ChecklistFile
  items: ReviewedItem[]
  fileHash: string
  userName: string
  userRole: string
  onSignoffAttestation?: (signoff: SignoffRecord) => void
}

export function AttestationSummary({
  file,
  items,
  fileHash,
  userName,
  userRole,
  onSignoffAttestation,
}: Props) {
  const [statement, setStatement] = useState(
    'I confirm that all compliance controls have been reviewed, verified, and approved for release.'
  )
  const [activeSignoff, setActiveSignoff] = useState<SignoffRecord | null>(file.attestation?.signoff ?? null)
  const [isSigning, setIsSigning] = useState(false)

  const pass = items.filter(i => i.status === 'pass')
  const fail = items.filter(i => i.status === 'failed' || (i.status as string) === 'fail')
  const na = items.filter(i => i.status === 'na')
  const inReview = items.filter(i => i.status === 'in-review')

  const isSignoffAuthorized = canSignoff(userRole, file.personas)

  async function handleSignoffAndExport() {
    setIsSigning(true)
    try {
      const now = new Date().toISOString()
      const payloadToHash = JSON.stringify({
        project: file.project,
        version: file.version,
        branch: file.branch,
        sourceHash: fileHash,
        signer: userName,
        role: userRole,
        statement,
        timestamp: now,
        itemCount: items.length,
        passCount: pass.length,
        failCount: fail.length,
      })

      const generatedHash = await sha256String(payloadToHash)
      const signoffRecord: SignoffRecord = {
        signerName: userName,
        role: userRole,
        statement: statement.trim(),
        timestamp: now,
        hash: generatedHash,
      }

      setActiveSignoff(signoffRecord)
      onSignoffAttestation?.(signoffRecord)

      // Export certified attestation
      const attestation = buildAttestation(file, items, fileHash, signoffRecord)
      downloadJSON(attestation, `${file.project.toLowerCase()}-attestation-${file.version}.json`)
    } finally {
      setIsSigning(false)
    }
  }

  function handlePreviewExport() {
    const attestation = buildAttestation(file, items, fileHash, activeSignoff ?? undefined)
    downloadJSON(attestation, `${file.project.toLowerCase()}-attestation-preview.json`)
  }

  function renderGroup(groupItems: ReviewedItem[], label: string, borderColor: string) {
    if (!groupItems.length) return null
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1 }}>
          {label} ({groupItems.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {groupItems.map(item => {
            const last = item.history[item.history.length - 1]
            return (
              <Card key={item.id} elevation={0} sx={{ borderLeft: `3px solid ${borderColor}`, bgcolor: 'background.paper' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}>
                    <Typography component="code" sx={{ fontSize: 11, fontFamily: 'monospace', color: 'primary.main', mt: 0.2, flexShrink: 0, fontWeight: 600 }}>
                      {item.id}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.description}</Typography>
                      {last && (
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                          {last.actorName} · {last.role} · {new Date(last.timestamp).toLocaleDateString()}
                          {last.notes && ` — "${last.notes}"`}
                        </Typography>
                      )}
                      {last && <FieldValuesList fieldValues={last.fieldValues ?? {}} fields={file.fields} />}
                    </Box>
                    {item.confirmedBy && (
                      <Chip label={`✓ ${item.confirmedBy.actorName}`} color="success" size="small" sx={{ fontSize: 10, height: 20 }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>
    )
  }

  return (
    <Box id="attestation-section" sx={{ mt: 4, borderTop: '2px solid', borderColor: '#3b82f6', pt: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon sx={{ color: '#10b981', fontSize: 24 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
              Release Attestation & Final Sign-Off
            </Typography>
          </Box>
          <Typography component="code" sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace', mt: 0.5, display: 'block' }}>
            Checklist Source SHA-256: {fileHash || 'Calculated in browser'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handlePreviewExport}
          sx={{ textTransform: 'none', fontSize: 12 }}
        >
          Export Attestation JSON
        </Button>
      </Box>

      {/* Warnings if unresolved or failed items */}
      {fail.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, fontSize: 13 }}>
          {fail.length} item(s) marked as <strong>Failed</strong> — require review before overall release sign-off.
        </Alert>
      )}
      {inReview.length > 0 && (
        <Alert severity="info" sx={{ mb: 2, fontSize: 13 }}>
          {inReview.length} item(s) still <strong>In Review</strong> — pending reviewer evaluation.
        </Alert>
      )}

      {/* Overall Sign-off Authority Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          bgcolor: isSignoffAuthorized ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: '1px solid',
          borderColor: isSignoffAuthorized ? 'rgba(16, 185, 129, 0.3)' : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeSignoff ? (
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
            ) : isSignoffAuthorized ? (
              <VerifiedUserIcon sx={{ color: '#10b981', fontSize: 20 }} />
            ) : (
              <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
            )}
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: isSignoffAuthorized ? '#10b981' : 'text.primary' }}>
              {activeSignoff ? 'Attestation Officially Signed' : 'Sign-Off Authorization'}
            </Typography>
          </Box>
          <Chip
            label={isSignoffAuthorized ? `Authorized (${userRole})` : `Restricted (${userRole})`}
            size="small"
            color={isSignoffAuthorized ? 'success' : 'default'}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        </Box>

        {activeSignoff ? (
          <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', p: 2, borderRadius: 1.5, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#10b981', mb: 0.5 }}>
              Signed by {activeSignoff.signerName} ({activeSignoff.role}) on {new Date(activeSignoff.timestamp).toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', mb: 1 }}>
              "{activeSignoff.statement}"
            </Typography>
            <Typography component="code" sx={{ fontSize: 11, color: '#059669', fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
              SHA-256 Digest: {activeSignoff.hash}
            </Typography>
          </Box>
        ) : isSignoffAuthorized ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              As a user with <strong>sign-off authority</strong> ({userRole}), you are authorized to provide final approval and seal this release with a cryptographic SHA-256 hash.
            </Typography>
            <TextField
              label="Attestation Statement"
              value={statement}
              onChange={e => setStatement(e.target.value)}
              multiline
              rows={2}
              size="small"
              fullWidth
            />
            <Button
              variant="contained"
              color="success"
              disabled={isSigning || !statement.trim()}
              startIcon={<VerifiedUserIcon />}
              onClick={handleSignoffAndExport}
              sx={{ alignSelf: 'flex-start', fontWeight: 600, px: 3, textTransform: 'none' }}
            >
              Sign & Generate Attestation SHA-256
            </Button>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Final release sign-off and cryptographic hashing require the <strong>sign-off</strong> role (e.g. Release Manager, CISO, Lead Auditor) or <strong>master</strong> authority. You are currently logged in as <strong>{userRole}</strong>.
          </Typography>
        )}
      </Paper>

      <Divider sx={{ mb: 2 }} />
      {renderGroup(fail, 'Failed Items', '#dc2626')}
      {renderGroup(na, 'Not Applicable (N/A)', '#94a3b8')}
      {renderGroup(pass, 'Passed Items', '#16a34a')}
    </Box>
  )
}
