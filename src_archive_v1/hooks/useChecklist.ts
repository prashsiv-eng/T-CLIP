import { useCallback, useEffect, useRef, useState } from 'react'
import { validateChecklistFile } from '../schema/validate'
import type { ChecklistFile, ChecklistItem, FieldSchema, FileRules, ReviewAction, ReviewedItem } from '../types'
import { sha256Hex } from '../utils/hash'
import { restoreSession, saveSession } from '../utils/session'

export type ChecklistPhase = 'home' | 'template-choose' | 'meta-entry' | 'view'

export interface ChecklistState {
  phase: ChecklistPhase
  source: 'new' | 'open' | null
  rawFileBytes: ArrayBuffer | null
  fileHash: string | null
  checklistFile: ChecklistFile | null
  reviewedItems: ReviewedItem[]
  isDirty: boolean
  validationErrors: string[]
  sessionRestored: boolean
  storageWarning: boolean
}

const INITIAL: ChecklistState = {
  phase: 'home',
  source: null,
  rawFileBytes: null,
  fileHash: null,
  checklistFile: null,
  reviewedItems: [],
  isDirty: false,
  validationErrors: [],
  sessionRestored: false,
  storageWarning: false,
}

export function useChecklist() {
  const [state, setState] = useState<ChecklistState>(INITIAL)
  const storageWarningShownRef = useRef(false)

  // Auto-save on every reviewedItems change
  useEffect(() => {
    if (!state.fileHash || state.reviewedItems.length === 0) return
    try {
      saveSession(state.fileHash, state.reviewedItems)
    } catch {
      if (!storageWarningShownRef.current) {
        storageWarningShownRef.current = true
        setState(s => ({ ...s, storageWarning: true }))
      }
    }
  }, [state.reviewedItems, state.fileHash])

  const reset = useCallback(() => setState(INITIAL), [])

  const startNew = useCallback(() => {
    setState(s => ({ ...INITIAL, phase: 'template-choose', source: 'new' as const, storageWarning: s.storageWarning }))
  }, [])

  const selectTemplate = useCallback((file: ChecklistFile) => {
    // Clone the template and blank out project/version/branch for user to fill
    const clone: ChecklistFile = { ...file, project: '', version: '', branch: '' }
    setState(s => ({ ...s, phase: 'meta-entry', checklistFile: clone }))
  }, [])

  const setMetadata = useCallback((project: string, version: string, branch: string) => {
    setState(s => {
      if (!s.checklistFile) return s
      const file = { ...s.checklistFile, project, version, branch }
      const items: ReviewedItem[] = file.items.map(item => ({
        ...item,
        history: [],
        confirmedBy: null,
      }))
      return { ...s, phase: 'view', checklistFile: file, reviewedItems: items, isDirty: true }
    })
  }, [])

  const loadFile = useCallback(async (bytes: ArrayBuffer, text: string) => {
    const result = validateChecklistFile(JSON.parse(text))
    if (!result.valid || !result.file) {
      setState(s => ({ ...s, validationErrors: result.errors }))
      return
    }
    const hash = await sha256Hex(bytes)
    const saved = restoreSession(hash)
    const reviewedItems: ReviewedItem[] = saved
      ? saved.reviewedItems
      : result.file.items.map(item => ({ ...item, history: [], confirmedBy: null }))

    setState(s => ({
      ...s,
      phase: 'view',
      source: 'open',
      rawFileBytes: bytes,
      fileHash: hash,
      checklistFile: result.file!,
      reviewedItems,
      isDirty: false,
      validationErrors: [],
      sessionRestored: !!saved,
    }))
  }, [])

  const saveItemResponse = useCallback((itemId: string, action: ReviewAction) => {
    setState(s => ({
      ...s,
      reviewedItems: s.reviewedItems.map(item =>
        item.id === itemId
          ? { ...item, status: action.status, history: [...item.history, action] }
          : item
      ),
    }))
  }, [])

  const confirmItem = useCallback((itemId: string, action: ReviewAction) => {
    setState(s => ({
      ...s,
      reviewedItems: s.reviewedItems.map(item =>
        item.id === itemId ? { ...item, confirmedBy: action } : item
      ),
    }))
  }, [])

  const editItem = useCallback((itemId: string, patch: Partial<ChecklistItem>) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile
        ? { ...s.checklistFile, items: s.checklistFile.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : s.checklistFile,
      reviewedItems: s.reviewedItems.map(i => i.id === itemId ? { ...i, ...patch } : i),
    }))
  }, [])

  const addItem = useCallback((item: ChecklistItem) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile
        ? { ...s.checklistFile, items: [...s.checklistFile.items, item] }
        : s.checklistFile,
      reviewedItems: [...s.reviewedItems, { ...item, history: [], confirmedBy: null }],
    }))
  }, [])

  const deleteItem = useCallback((itemId: string) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile
        ? { ...s.checklistFile, items: s.checklistFile.items.filter(i => i.id !== itemId) }
        : s.checklistFile,
      reviewedItems: s.reviewedItems.filter(i => i.id !== itemId),
    }))
  }, [])

  const updateFields = useCallback((fields: FieldSchema[]) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile ? { ...s.checklistFile, fields } : s.checklistFile,
    }))
  }, [])

  const updateRules = useCallback((rules: FileRules) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile ? { ...s.checklistFile, rules } : s.checklistFile,
    }))
  }, [])

  const updateMetadata = useCallback((patch: Partial<Pick<ChecklistFile, 'project' | 'version' | 'branch'>>) => {
    setState(s => ({
      ...s,
      isDirty: true,
      checklistFile: s.checklistFile ? { ...s.checklistFile, ...patch } : s.checklistFile,
    }))
  }, [])

  const clearSessionRestored = useCallback(() => {
    setState(s => ({ ...s, sessionRestored: false }))
  }, [])

  return {
    ...state,
    reset,
    startNew,
    selectTemplate,
    setMetadata,
    loadFile,
    saveItemResponse,
    confirmItem,
    editItem,
    addItem,
    deleteItem,
    updateFields,
    updateRules,
    updateMetadata,
    clearSessionRestored,
  }
}
