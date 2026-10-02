import type { ReviewedItem } from '../types'

export interface SavedReviewState {
  reviewedItems: ReviewedItem[]
  savedAt: string
}

let storageWarningShown = false

function sessionKey(hash: string): string {
  return `tclip_session_${hash}`
}

export function saveSession(hash: string, reviewedItems: ReviewedItem[]): void {
  try {
    const state: SavedReviewState = {
      reviewedItems,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(sessionKey(hash), JSON.stringify(state))
  } catch {
    if (!storageWarningShown) {
      storageWarningShown = true
      // Caller is responsible for surfacing this to the user
      console.warn('T-CLIP: localStorage unavailable — session will not be saved')
    }
  }
}

export function restoreSession(hash: string): SavedReviewState | null {
  try {
    const raw = localStorage.getItem(sessionKey(hash))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as SavedReviewState).reviewedItems)
    ) {
      return null
    }
    return parsed as SavedReviewState
  } catch {
    return null
  }
}

export function clearSession(hash: string): void {
  try {
    localStorage.removeItem(sessionKey(hash))
  } catch {
    // Silently ignore
  }
}

export function isStorageAvailable(): boolean {
  try {
    const test = '__tclip_test__'
    localStorage.setItem(test, '1')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
