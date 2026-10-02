import { useCallback, useEffect, useRef, useState } from 'react'
import { validateChecklistFile } from '../schema/validate'
import type { ChecklistFile, ChecklistItem, ChecklistPhase, FieldSchema, FileRules, ReviewAction, ReviewedItem, UserPersona } from '../types'
import { sha256Hex } from '../utils/hash'
import { clearActiveSession, restoreActiveSession, restoreSession, saveActiveSession, saveSession } from '../utils/session'

export type { ChecklistPhase }

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
  fileName: string | null
  hasBeenSaved: boolean
}

const INITIAL: ChecklistState = {
  phase: 'start',
  source: null,
  rawFileBytes: null,
  fileHash: null,
  checklistFile: null,
  reviewedItems: [],
  isDirty: false,
  validationErrors: [],
  sessionRestored: false,
  storageWarning: false,
  fileName: null,
  hasBeenSaved: false,
}

function getInitialChecklistState(): ChecklistState {
  try {
    const active = restoreActiveSession()
    if (active && active.checklistFile && Array.isArray(active.reviewedItems) && active.reviewedItems.length > 0) {
      return {
        phase: active.phase || 'view',
        source: active.source ?? null,
        rawFileBytes: null,
        fileHash: active.fileHash ?? null,
        checklistFile: active.checklistFile,
        reviewedItems: active.reviewedItems,
        isDirty: false,
        validationErrors: [],
        sessionRestored: true,
        storageWarning: false,
        fileName: active.fileName ?? null,
        hasBeenSaved: active.hasBeenSaved ?? false,
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return INITIAL
}

export function useChecklist() {
  const [state, setState] = useState<ChecklistState>(getInitialChecklistState)
  const storageWarningShownRef = useRef(false)

  // Auto-save on every change to checklistFile or reviewedItems
  useEffect(() => {
    if (!state.checklistFile || state.reviewedItems.length === 0) return
    if (state.phase !== 'view' && state.phase !== 'persona-select') return
    try {
      saveActiveSession({
        phase: state.phase,
        source: state.source,
        fileHash: state.fileHash,
        checklistFile: state.checklistFile,
        reviewedItems: state.reviewedItems,
        savedAt: new Date().toISOString(),
        fileName: state.fileName,
        hasBeenSaved: state.hasBeenSaved,
      })
      if (state.fileHash) {
        saveSession(state.fileHash, state.reviewedItems)
      }
    } catch {
      if (!storageWarningShownRef.current) {
        storageWarningShownRef.current = true
        setState(s => ({ ...s, storageWarning: true }))
      }
    }
  }, [state.checklistFile, state.reviewedItems, state.phase, state.source, state.fileHash, state.fileName, state.hasBeenSaved])

  const reset = useCallback(() => {
    clearActiveSession()
    setState(INITIAL)
  }, [])

  const startNew = useCallback(() => {
    clearActiveSession()
    setState(s => ({ ...INITIAL, phase: 'template-choose', source: 'new' as const, storageWarning: s.storageWarning }))
  }, [])

  const startOpen = useCallback(() => {
    setState(s => ({ ...INITIAL, phase: 'open-file', source: 'open' as const, storageWarning: s.storageWarning }))
  }, [])

  const selectTemplate = useCallback((file: ChecklistFile) => {
    // Clone the template, blank out project/version/branch, and ensure users is empty
    const clone: ChecklistFile = { ...file, project: '', version: '', branch: '', users: [] }
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
      const safeProject = project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'checklist'
      const safeVersion = version.toLowerCase().replace(/[^a-z0-9._-]/g, '_') || '1.0'
      const defaultFileName = `${safeProject}-${safeVersion}.json`

      return {
        ...s,
        phase: 'persona-select',
        checklistFile: file,
        reviewedItems: items,
        isDirty: true,
        fileName: defaultFileName,
        hasBeenSaved: false,
      }
    })
  }, [])

  const loadFile = useCallback(async (bytes: ArrayBuffer, text: string, loadedFileName?: string) => {
    const result = validateChecklistFile(JSON.parse(text))
    if (!result.valid || !result.file) {
      setState(s => ({ ...s, validationErrors: result.errors }))
      return
    }
    const hash = await sha256Hex(bytes)
    const saved = restoreSession(hash)
    const reviewedItems: ReviewedItem[] = saved
      ? saved.reviewedItems
      : result.file.items.map(item => ({
          ...item,
          history: (item as unknown as ReviewedItem).history ?? [],
          confirmedBy: (item as unknown as ReviewedItem).confirmedBy ?? null,
        }))

    const fileName = loadedFileName || `${result.file.project ? result.file.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'}-${result.file.version || '1.0'}.json`

    setState(s => ({
      ...s,
      phase: 'persona-select',
      source: 'open',
      rawFileBytes: bytes,
      fileHash: hash,
      checklistFile: result.file!,
      reviewedItems,
      isDirty: false,
      validationErrors: [],
      sessionRestored: !!saved,
      fileName,
      hasBeenSaved: true,
    }))
  }, [])

  const addUserPersona = useCallback((persona: UserPersona) => {
    setState(s => {
      if (!s.checklistFile) return s
      const currentUsers = s.checklistFile.users ?? []
      const currentRoles = s.checklistFile.roles ?? []
      const userExists = currentUsers.some(
        u => u.name.toLowerCase() === persona.name.toLowerCase() && u.role.toLowerCase() === persona.role.toLowerCase()
      )
      const roleExists = currentRoles.some(r => r.toLowerCase() === persona.role.toLowerCase())

      const updatedUsers = userExists ? currentUsers : [...currentUsers, persona]
      const updatedRoles = roleExists ? currentRoles : [...currentRoles, persona.role]

      return {
        ...s,
        isDirty: true,
        checklistFile: {
          ...s.checklistFile,
          users: updatedUsers,
          roles: updatedRoles,
        },
      }
    })
  }, [])

  const proceedToView = useCallback(() => {
    setState(s => ({ ...s, phase: 'view' }))
  }, [])

  const goBack = useCallback(() => {
    setState(s => {
      if (s.phase === 'template-choose' || s.phase === 'open-file') {
        return { ...INITIAL, phase: 'start' }
      }
      if (s.phase === 'meta-entry') {
        return { ...s, phase: 'template-choose' }
      }
      if (s.phase === 'persona-select') {
        return {
          ...s,
          phase: s.source === 'new' ? 'meta-entry' : 'open-file',
        }
      }
      return s
    })
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
    setState(s => {
      const updatedFile = s.checklistFile ? { ...s.checklistFile, ...patch } : s.checklistFile
      let updatedFileName = s.fileName
      if (!s.hasBeenSaved && updatedFile && (patch.project !== undefined || patch.version !== undefined)) {
        const safeProject = updatedFile.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'checklist'
        const safeVersion = updatedFile.version.toLowerCase().replace(/[^a-z0-9._-]/g, '_') || '1.0'
        updatedFileName = `${safeProject}-${safeVersion}.json`
      }
      return {
        ...s,
        isDirty: true,
        checklistFile: updatedFile,
        fileName: updatedFileName,
      }
    })
  }, [])

  const markSaved = useCallback(() => {
    setState(s => ({ ...s, hasBeenSaved: true }))
  }, [])

  const clearSessionRestored = useCallback(() => {
    setState(s => ({ ...s, sessionRestored: false }))
  }, [])

  return {
    ...state,
    reset,
    startNew,
    startOpen,
    selectTemplate,
    setMetadata,
    loadFile,
    markSaved,
    addUserPersona,
    proceedToView,
    goBack,
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
