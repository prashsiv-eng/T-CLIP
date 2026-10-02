import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReviewedItem } from '../../types'
import { clearSession, restoreSession, saveSession } from '../../utils/session'

const HASH = 'abc123'

const ITEM: ReviewedItem = {
  id: 'SEC-001',
  category: 'Security',
  description: 'Test',
  status: 'pass',
  required: true,
  history: [{ actorName: 'Alice', role: 'Reviewer', status: 'pass', fieldValues: {}, timestamp: '2026-01-01T00:00:00Z' }],
  confirmedBy: null,
}

describe('session persistence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('saves and restores a session round-trip', () => {
    saveSession(HASH, [ITEM])
    const restored = restoreSession(HASH)
    expect(restored).not.toBeNull()
    expect(restored!.reviewedItems).toHaveLength(1)
    expect(restored!.reviewedItems[0].id).toBe('SEC-001')
  })

  it('returns null when no saved session exists', () => {
    expect(restoreSession('nonexistent')).toBeNull()
  })

  it('returns null for corrupt stored JSON', () => {
    localStorage.setItem(`tclip_session_${HASH}`, '{bad json}}}')
    expect(restoreSession(HASH)).toBeNull()
  })

  it('returns null for stored JSON missing reviewedItems', () => {
    localStorage.setItem(`tclip_session_${HASH}`, JSON.stringify({ foo: 'bar' }))
    expect(restoreSession(HASH)).toBeNull()
  })

  it('clears a saved session', () => {
    saveSession(HASH, [ITEM])
    clearSession(HASH)
    expect(restoreSession(HASH)).toBeNull()
  })

  it('does not throw when localStorage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveSession(HASH, [ITEM])).not.toThrow()
    getItem.mockRestore()
  })
})
