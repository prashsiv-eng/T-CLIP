import { describe, expect, it } from 'vitest'
import type { ChecklistFile, ReviewedItem } from '../../types'
import { prepareNewRelease, suggestNextVersion } from '../../utils/release'

describe('suggestNextVersion', () => {
  it('increments 3-part semver correctly', () => {
    expect(suggestNextVersion('1.0.0')).toBe('1.1.0')
    expect(suggestNextVersion('v2.4.0')).toBe('v2.5.0')
  })

  it('increments 2-part semver correctly', () => {
    expect(suggestNextVersion('1.0')).toBe('1.1')
    expect(suggestNextVersion('v2.4')).toBe('v2.5')
  })

  it('handles fallback or single number strings', () => {
    expect(suggestNextVersion('1')).toBe('2.0')
    expect(suggestNextVersion('custom-tag')).toBe('custom-tag-next')
    expect(suggestNextVersion('')).toBe('1.1')
  })
})

describe('prepareNewRelease', () => {
  const sampleFile: ChecklistFile = {
    version: '1.0.0',
    project: 'PaymentService',
    branch: 'release/v1.0',
    fields: [
      { id: 'evidence_url', label: 'Evidence PR', type: 'url' },
      { id: 'notes', label: 'Implementation Notes', type: 'text' },
    ],
    items: [
      {
        id: 'AUTH-01',
        category: 'Auth',
        description: 'Verify password hashing',
        status: 'pass',
        required: true,
        values: { evidence_url: 'https://github.com/org/repo/pull/1' },
      },
    ],
    attestation: {
      schemaVersion: '1.0',
      project: 'PaymentService',
      branch: 'release/v1.0',
      checklistVersion: '1.0.0',
      sourceFileHash: 'abc123',
      exportedAt: '2026-10-01T12:00:00Z',
      items: [],
    },
  }

  const sampleReviewedItems: ReviewedItem[] = [
    {
      id: 'AUTH-01',
      category: 'Auth',
      description: 'Verify password hashing',
      status: 'pass',
      required: true,
      values: { evidence_url: 'https://github.com/org/repo/pull/1' },
      history: [
        {
          actorName: 'Alex Dev',
          role: 'Developer',
          status: 'in-progress',
          fieldValues: { notes: 'Argon2id hashing configured' },
          timestamp: '2026-10-01T10:00:00Z',
        },
        {
          actorName: 'Sarah Security',
          role: 'Security Reviewer',
          status: 'pass',
          notes: 'Review comment: Pass verified in PR #1.',
          timestamp: '2026-10-01T11:00:00Z',
        },
      ],
      confirmedBy: {
        actorName: 'Marcus VP',
        role: 'VP Engineering',
        status: 'pass',
        notes: 'Sign-off approved',
        timestamp: '2026-10-01T11:30:00Z',
      },
    },
    {
      id: 'AUTH-02',
      category: 'Auth',
      description: 'Verify MFA enforcement',
      status: 'failed',
      required: true,
      values: { evidence_url: 'https://github.com/org/repo/pull/2', notes: 'Pending MFA implementation' },
      history: [
        {
          actorName: 'Sarah Security',
          role: 'Security Reviewer',
          status: 'failed',
          notes: 'Review comment: MFA failed to block non-registered devices.',
          timestamp: '2026-10-01T11:05:00Z',
        },
      ],
      confirmedBy: null,
    },
  ]

  it('resets workflow status to not-started for all items', () => {
    const { updatedItems, updatedFile } = prepareNewRelease(sampleFile, sampleReviewedItems)

    expect(updatedItems).toHaveLength(2)
    expect(updatedItems[0].status).toBe('not-started')
    expect(updatedItems[1].status).toBe('not-started')

    expect(updatedFile.items[0].status).toBe('not-started')
    expect(updatedFile.items[1].status).toBe('not-started')
  })

  it('clears review history, review comments, and approver sign-off', () => {
    const { updatedItems } = prepareNewRelease(sampleFile, sampleReviewedItems)

    expect(updatedItems[0].history).toEqual([])
    expect(updatedItems[0].confirmedBy).toBeNull()

    expect(updatedItems[1].history).toEqual([])
    expect(updatedItems[1].confirmedBy).toBeNull()
  })

  it('preserves all evidence and response field values', () => {
    const { updatedItems, updatedFile } = prepareNewRelease(sampleFile, sampleReviewedItems)

    // AUTH-01 had initial values + history fieldValues for 'notes'
    expect(updatedItems[0].values).toEqual({
      evidence_url: 'https://github.com/org/repo/pull/1',
      notes: 'Argon2id hashing configured',
    })

    // AUTH-02 had initial values
    expect(updatedItems[1].values).toEqual({
      evidence_url: 'https://github.com/org/repo/pull/2',
      notes: 'Pending MFA implementation',
    })

    // Also updated in file.items
    expect(updatedFile.items[0].values).toEqual(updatedItems[0].values)
    expect(updatedFile.items[1].values).toEqual(updatedItems[1].values)
  })

  it('clears prior attestation', () => {
    const { updatedFile } = prepareNewRelease(sampleFile, sampleReviewedItems)
    expect(updatedFile.attestation).toBeUndefined()
  })

  it('updates version and branch when provided', () => {
    const { updatedFile } = prepareNewRelease(sampleFile, sampleReviewedItems, {
      version: '1.1.0',
      branch: 'release/v1.1',
    })

    expect(updatedFile.version).toBe('1.1.0')
    expect(updatedFile.branch).toBe('release/v1.1')
  })
})
