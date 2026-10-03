import type { ChecklistFile, ReviewedItem } from '../types'

export interface NewReleaseOptions {
  version?: string
  branch?: string
}

/**
 * Suggests the next version number based on common versioning patterns:
 * - 1.0.0 -> 1.1.0
 * - 1.0 -> 1.1
 * - v2.4 -> v2.5
 * - v2.4.1 -> v2.5.0
 */
export function suggestNextVersion(current: string): string {
  if (!current || !current.trim()) return '1.1'
  const trimmed = current.trim()
  const hasV = trimmed.startsWith('v') || trimmed.startsWith('V')
  const numPart = hasV ? trimmed.slice(1) : trimmed

  const parts = numPart.split('.').map(p => parseInt(p, 10))
  if (parts.length === 3 && parts.every(p => !isNaN(p))) {
    // Semver: bump minor version (e.g. 1.0.0 -> 1.1.0)
    const next = `${parts[0]}.${parts[1] + 1}.0`
    return hasV ? `v${next}` : next
  }

  if (parts.length === 2 && parts.every(p => !isNaN(p))) {
    // 2-digit: bump minor (e.g. 1.0 -> 1.1)
    const next = `${parts[0]}.${parts[1] + 1}`
    return hasV ? `v${next}` : next
  }

  if (parts.length === 1 && !isNaN(parts[0])) {
    const next = `${parts[0] + 1}.0`
    return hasV ? `v${next}` : next
  }

  return `${trimmed}-next`
}

/**
 * Prepares the checklist for a new release or PR cycle.
 * - Resets all item statuses to 'not-started'.
 * - Clears all review history, review decisions, review comments, and approver sign-offs.
 * - RETAINS all responses and evidence values (e.g., evidence_url, notes, custom field answers).
 * - Clears any sealed attestation.
 * - Updates version and branch metadata if specified.
 */
export function prepareNewRelease(
  file: ChecklistFile,
  reviewedItems: ReviewedItem[],
  options?: NewReleaseOptions,
): { updatedFile: ChecklistFile; updatedItems: ReviewedItem[] } {
  const newVersion = options?.version?.trim() || file.version
  const newBranch = options?.branch?.trim() !== undefined ? options.branch.trim() : (file.branch ?? '')

  const updatedItems: ReviewedItem[] = reviewedItems.map(item => {
    // Accumulate all field responses so no evidence is lost
    const latestValues: Record<string, string> = { ...(item.values ?? {}) }
    if (Array.isArray(item.history)) {
      item.history.forEach(action => {
        if (action.fieldValues) {
          Object.assign(latestValues, action.fieldValues)
        }
      })
    }

    return {
      ...item,
      status: 'not-started',
      values: latestValues,
      // Clear the review evaluations, review comments, and dual sign-off
      history: [],
      confirmedBy: null,
    }
  })

  const updatedFile: ChecklistFile = {
    ...file,
    version: newVersion,
    branch: newBranch,
    attestation: undefined,
    items: updatedItems.map(item => ({
      id: item.id,
      category: item.category,
      description: item.description,
      status: 'not-started',
      required: item.required,
      statusEditableBy: item.statusEditableBy,
      assignedTo: item.assignedTo,
      fields: item.fields,
      values: item.values,
    })),
  }

  return {
    updatedFile,
    updatedItems,
  }
}
