import type { Attestation, ChecklistFile, ReviewedItem, SignoffRecord } from '../types'

export function buildAttestation(
  file: ChecklistFile,
  reviewedItems: ReviewedItem[],
  fileHash: string,
  signoff?: SignoffRecord,
): Attestation {
  return {
    schemaVersion: '1.0',
    project: file.project,
    branch: file.branch ?? null,
    checklistVersion: file.version,
    sourceFileHash: fileHash,
    exportedAt: new Date().toISOString(),
    signoff,
    items: reviewedItems,
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportAttestation(
  file: ChecklistFile,
  reviewedItems: ReviewedItem[],
  fileHash: string,
  signoff?: SignoffRecord,
): void {
  const attestation = buildAttestation(file, reviewedItems, fileHash, signoff)
  downloadJSON(attestation, 'checklist-attestation.json')
}

export function exportChecklistJSON(file: ChecklistFile): void {
  downloadJSON(file, 'checklist.json')
}
