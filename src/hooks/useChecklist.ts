import { useCallback, useEffect, useRef, useState } from 'react'
import { validateChecklistFile } from '../schema/validate'
import type { ChecklistFile, ChecklistItem, ChecklistPhase, FieldSchema, FileRules, ItemStatus, PersonaDefinition, ReviewAction, ReviewedItem, UserPersona } from '../types'
import { sha256Hex } from '../utils/hash'
import { clearActiveSession, restoreActiveSession, restoreSession, saveActiveSession, saveSession } from '../utils/session'
import { STANDARD_PERSONAS } from '../utils/capability'
import { prepareNewRelease, type NewReleaseOptions } from '../utils/release'
import {
  type FileSystemFileHandleLike,
  isFileSystemAccessSupported,
  pickSaveFileHandle,
  saveChecklistToDisk,
} from '../utils/fileStorage'

export type { ChecklistPhase }

export const AUTOSAVE_PREF_KEY = 'tclip_autosave_enabled'

export function getAutoSavePreference(): boolean {
  try {
    const val = localStorage.getItem(AUTOSAVE_PREF_KEY)
    if (val === null) return true
    return val === 'true'
  } catch {
    return true
  }
}

export function setAutoSavePreference(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOSAVE_PREF_KEY, String(enabled))
  } catch {
    // Ignore storage quota issues
  }
}

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
  autoSaveEnabled: boolean
  autoSaveStatus: 'saved' | 'saving' | 'error' | 'off'
  autoSaveTarget: 'disk' | 'browser' | 'none'
  lastSavedAt: string | null
  diskSaveError: string | null
  fileHandle: FileSystemFileHandleLike | null
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
  autoSaveEnabled: true,
  autoSaveStatus: 'saved',
  autoSaveTarget: 'browser',
  lastSavedAt: null,
  diskSaveError: null,
  fileHandle: null,
}

function normalizeItemStatus(status?: string): ItemStatus {
  if (!status || status === 'pending') return 'not-started'
  if (status === 'fail') return 'failed'
  return status as ItemStatus
}

function normalizeReviewedItem(item: ReviewedItem): ReviewedItem {
  return {
    ...item,
    status: normalizeItemStatus(item.status),
  }
}

function getInitialChecklistState(): ChecklistState {
  const autoSavePref = getAutoSavePreference()
  try {
    const active = restoreActiveSession()
    if (active && active.checklistFile && Array.isArray(active.reviewedItems) && active.reviewedItems.length > 0) {
      const normalizedItems = active.reviewedItems.map(normalizeReviewedItem)
      return {
        phase: active.phase || 'view',
        source: active.source ?? null,
        rawFileBytes: null,
        fileHash: active.fileHash ?? null,
        checklistFile: {
          ...active.checklistFile,
          items: active.checklistFile.items.map(i => ({ ...i, status: normalizeItemStatus(i.status) })),
        },
        reviewedItems: normalizedItems,
        isDirty: false,
        validationErrors: [],
        sessionRestored: true,
        storageWarning: false,
        fileName: active.fileName ?? null,
        hasBeenSaved: active.hasBeenSaved ?? false,
        autoSaveEnabled: autoSavePref,
        autoSaveStatus: autoSavePref ? 'saved' : 'off',
        autoSaveTarget: 'browser',
        lastSavedAt: active.savedAt ?? null,
        diskSaveError: null,
        fileHandle: null,
      }
    }
  } catch {
    // Ignore storage parse issues
  }
  return {
    ...INITIAL,
    autoSaveEnabled: autoSavePref,
    autoSaveStatus: autoSavePref ? 'saved' : 'off',
  }
}

export function useChecklist() {
  const [state, setState] = useState<ChecklistState>(getInitialChecklistState)
  const storageWarningShownRef = useRef(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save on every change to checklistFile or reviewedItems
  useEffect(() => {
    if (!state.checklistFile || state.reviewedItems.length === 0) return
    if (state.phase !== 'view' && state.phase !== 'persona-select') return

    // 1. Session storage (browser memory backup)
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

    // 2. Disk auto-save if handle is available and autoSaveEnabled
    if (state.autoSaveEnabled) {
      if (state.fileHandle) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        const handle = state.fileHandle
        const fileToSave = state.checklistFile
        const itemsToSave = state.reviewedItems
        saveTimeoutRef.current = setTimeout(async () => {
          setState(s => (s.autoSaveStatus === 'saving' ? s : { ...s, autoSaveStatus: 'saving' }))
          try {
            await saveChecklistToDisk(handle, fileToSave, itemsToSave)
            setState(s => ({
              ...s,
              autoSaveStatus: 'saved',
              autoSaveTarget: 'disk',
              hasBeenSaved: true,
              lastSavedAt: new Date().toISOString(),
              diskSaveError: null,
            }))
          } catch (err: unknown) {
            console.error('Auto-save to disk failed:', err)
            setState(s => ({
              ...s,
              autoSaveStatus: 'error',
              diskSaveError: err instanceof Error ? err.message : 'Failed to write to file',
            }))
          }
        }, 600)
      } else {
        // No disk handle, but auto-saved to browser session
        setState(s => ({
          ...s,
          autoSaveStatus: 'saved',
          autoSaveTarget: 'browser',
          lastSavedAt: new Date().toISOString(),
          diskSaveError: null,
        }))
      }
    } else {
      setState(s => (s.autoSaveStatus === 'off' ? s : { ...s, autoSaveStatus: 'off', autoSaveTarget: 'none' }))
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    state.checklistFile,
    state.reviewedItems,
    state.phase,
    state.source,
    state.fileHash,
    state.fileName,
    state.hasBeenSaved,
    state.autoSaveEnabled,
    state.fileHandle,
  ])

  const reset = useCallback(() => {
    clearActiveSession()
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    const autoSavePref = getAutoSavePreference()
    setState({
      ...INITIAL,
      autoSaveEnabled: autoSavePref,
      autoSaveStatus: autoSavePref ? 'saved' : 'off',
      autoSaveTarget: 'browser',
    })
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

  const setMetadata = useCallback((project: string, version: string, branch: string, personas?: PersonaDefinition[]) => {
    setState(s => {
      if (!s.checklistFile) return s
      const file: ChecklistFile = {
        ...s.checklistFile,
        project,
        version,
        branch,
        personas: personas && personas.length > 0 ? personas : (s.checklistFile.personas ?? STANDARD_PERSONAS),
      }
      const items: ReviewedItem[] = file.items.map(item => ({
        ...item,
        status: normalizeItemStatus(item.status),
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

  const loadFile = useCallback(async (
    bytes: ArrayBuffer,
    text: string,
    loadedFileName?: string,
    handle?: FileSystemFileHandleLike | null
  ) => {
    const result = validateChecklistFile(JSON.parse(text))
    if (!result.valid || !result.file) {
      setState(s => ({ ...s, validationErrors: result.errors }))
      return
    }
    const hash = await sha256Hex(bytes)
    const saved = restoreSession(hash)
    const reviewedItems: ReviewedItem[] = saved
      ? saved.reviewedItems.map(normalizeReviewedItem)
      : result.file.items.map(item => ({
          ...item,
          status: normalizeItemStatus(item.status),
          history: (item as unknown as ReviewedItem).history ?? [],
          confirmedBy: (item as unknown as ReviewedItem).confirmedBy ?? null,
        }))

    const fileName = handle?.name || loadedFileName || `${result.file.project ? result.file.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'}-${result.file.version || '1.0'}.json`
    const autoSavePref = getAutoSavePreference()

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
      fileHandle: handle ?? null,
      autoSaveEnabled: autoSavePref,
      autoSaveStatus: autoSavePref ? 'saved' : 'off',
      autoSaveTarget: autoSavePref ? (handle ? 'disk' : 'browser') : 'none',
      lastSavedAt: new Date().toISOString(),
      diskSaveError: null,
    }))
  }, [])

  const loadChecklistFile = useCallback(async (
    file: ChecklistFile,
    loadedFileName?: string,
    handle?: FileSystemFileHandleLike | null
  ) => {
    const result = validateChecklistFile(file)
    if (!result.valid || !result.file) {
      setState(s => ({ ...s, validationErrors: result.errors }))
      return
    }
    const jsonStr = JSON.stringify(result.file)
    const bytes = new TextEncoder().encode(jsonStr).buffer
    const hash = await sha256Hex(bytes)
    const saved = restoreSession(hash)
    const reviewedItems: ReviewedItem[] = saved
      ? saved.reviewedItems.map(normalizeReviewedItem)
      : result.file.items.map(item => ({
          ...item,
          status: normalizeItemStatus(item.status),
          history: (item as unknown as ReviewedItem).history ?? [],
          confirmedBy: (item as unknown as ReviewedItem).confirmedBy ?? null,
        }))

    const safeProject = result.file.project ? result.file.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'
    const fileName = handle?.name || loadedFileName || `${safeProject}-${result.file.version || '1.0'}.json`
    const autoSavePref = getAutoSavePreference()

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
      hasBeenSaved: false,
      fileHandle: handle ?? null,
      autoSaveEnabled: autoSavePref,
      autoSaveStatus: autoSavePref ? 'saved' : 'off',
      autoSaveTarget: autoSavePref ? (handle ? 'disk' : 'browser') : 'none',
      lastSavedAt: new Date().toISOString(),
      diskSaveError: null,
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

  function pendingAutoSaveStatus(s: ChecklistState): ChecklistState['autoSaveStatus'] {
    return s.autoSaveEnabled && s.fileHandle ? 'saving' : s.autoSaveStatus
  }

  const saveItemResponse = useCallback((itemId: string, action: ReviewAction) => {
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      reviewedItems: s.reviewedItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: action.status,
              values: action.fieldValues ? { ...(item.values ?? {}), ...action.fieldValues } : item.values,
              history: [...item.history, action],
            }
          : item
      ),
    }))
  }, [])

  const confirmItem = useCallback((itemId: string, action: ReviewAction) => {
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      reviewedItems: s.reviewedItems.map(item =>
        item.id === itemId ? { ...item, confirmedBy: action } : item
      ),
    }))
  }, [])

  const batchUpdateStatus = useCallback((
    itemIds: string[],
    status: ItemStatus,
    meta: { actorName: string; role: string; notes?: string }
  ) => {
    if (itemIds.length === 0) return
    const timestamp = new Date().toISOString()
    const idSet = new Set(itemIds)
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      reviewedItems: s.reviewedItems.map(item => {
        if (!idSet.has(item.id)) return item
        const action: ReviewAction = {
          actorName: meta.actorName,
          role: meta.role,
          status,
          notes: meta.notes ?? `Batch update to ${status}`,
          timestamp,
        }
        return {
          ...item,
          status,
          history: [...item.history, action],
        }
      }),
    }))
  }, [])

  const batchConfirm = useCallback((
    itemIds: string[],
    meta: { actorName: string; role: string; notes?: string }
  ) => {
    if (itemIds.length === 0) return
    const timestamp = new Date().toISOString()
    const idSet = new Set(itemIds)
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      reviewedItems: s.reviewedItems.map(item => {
        if (!idSet.has(item.id)) return item
        const action: ReviewAction = {
          actorName: meta.actorName,
          role: meta.role,
          status: item.status,
          notes: meta.notes ?? 'Batch confirmed review',
          timestamp,
        }
        return {
          ...item,
          confirmedBy: action,
        }
      }),
    }))
  }, [])

  const updatePersonas = useCallback((personas: PersonaDefinition[]) => {
    setState(s => {
      if (!s.checklistFile) return s
      return {
        ...s,
        isDirty: true,
        checklistFile: {
          ...s.checklistFile,
          personas,
        },
      }
    })
  }, [])

  const editItem = useCallback((itemId: string, patch: Partial<ChecklistItem>) => {
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      checklistFile: s.checklistFile
        ? { ...s.checklistFile, items: s.checklistFile.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : s.checklistFile,
      reviewedItems: s.reviewedItems.map(i => i.id === itemId ? { ...i, ...patch } : i),
    }))
  }, [])

  const assignItem = useCallback((itemId: string, assignedTo?: { role?: string; name?: string }) => {
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      checklistFile: s.checklistFile
        ? {
            ...s.checklistFile,
            items: s.checklistFile.items.map(i => (i.id === itemId ? { ...i, assignedTo } : i)),
          }
        : s.checklistFile,
      reviewedItems: s.reviewedItems.map(i => (i.id === itemId ? { ...i, assignedTo } : i)),
    }))
  }, [])

  const batchAssign = useCallback((itemIds: string[], assignedTo?: { role?: string; name?: string }) => {
    const idsSet = new Set(itemIds)
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
      checklistFile: s.checklistFile
        ? {
            ...s.checklistFile,
            items: s.checklistFile.items.map(i => (idsSet.has(i.id) ? { ...i, assignedTo } : i)),
          }
        : s.checklistFile,
      reviewedItems: s.reviewedItems.map(i => (idsSet.has(i.id) ? { ...i, assignedTo } : i)),
    }))
  }, [])

  const addItem = useCallback((item: ChecklistItem) => {
    setState(s => ({
      ...s,
      isDirty: true,
      autoSaveStatus: pendingAutoSaveStatus(s),
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
      autoSaveStatus: pendingAutoSaveStatus(s),
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
        autoSaveStatus: pendingAutoSaveStatus(s),
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

  const toggleAutoSave = useCallback(async () => {
    if (state.autoSaveEnabled) {
      setAutoSavePreference(false)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      setState(s => ({
        ...s,
        autoSaveEnabled: false,
        autoSaveStatus: 'off',
        autoSaveTarget: 'none',
      }))
    } else {
      setAutoSavePreference(true)
      // If we don't have a file handle yet, and user is in view phase with File System Access supported, prompt to pick save file
      if (!state.fileHandle && isFileSystemAccessSupported() && state.phase === 'view') {
        try {
          const handle = await pickSaveFileHandle(state.fileName || 'checklist.json')
          if (handle) {
            if (state.checklistFile) {
              await saveChecklistToDisk(handle, state.checklistFile, state.reviewedItems)
            }
            setState(s => ({
              ...s,
              autoSaveEnabled: true,
              autoSaveStatus: 'saved',
              autoSaveTarget: 'disk',
              fileHandle: handle,
              fileName: handle.name,
              hasBeenSaved: true,
              lastSavedAt: new Date().toISOString(),
              diskSaveError: null,
            }))
            return
          }
        } catch (err: unknown) {
          console.warn('File picker for auto-save was dismissed or failed:', err)
        }
      }

      // If user declined or FS access unsupported, enable browser auto-save
      setState(s => ({
        ...s,
        autoSaveEnabled: true,
        autoSaveStatus: 'saved',
        autoSaveTarget: s.fileHandle ? 'disk' : 'browser',
        lastSavedAt: new Date().toISOString(),
        diskSaveError: null,
      }))
    }
  }, [state.autoSaveEnabled, state.fileHandle, state.phase, state.fileName, state.checklistFile, state.reviewedItems])

  const connectDiskFile = useCallback(async () => {
    if (!isFileSystemAccessSupported()) return false
    try {
      const handle = await pickSaveFileHandle(state.fileName || 'checklist.json')
      if (handle) {
        if (state.checklistFile) {
          await saveChecklistToDisk(handle, state.checklistFile, state.reviewedItems)
        }
        setAutoSavePreference(true)
        setState(s => ({
          ...s,
          autoSaveEnabled: true,
          autoSaveStatus: 'saved',
          autoSaveTarget: 'disk',
          fileHandle: handle,
          fileName: handle.name,
          hasBeenSaved: true,
          lastSavedAt: new Date().toISOString(),
          diskSaveError: null,
        }))
        return true
      }
      return false
    } catch (err: unknown) {
      console.error('Failed to connect disk file:', err)
      setState(s => ({
        ...s,
        diskSaveError: err instanceof Error ? err.message : 'Failed to connect file',
      }))
      return false
    }
  }, [state.fileName, state.checklistFile, state.reviewedItems])

  const saveToDiskNow = useCallback(async () => {
    if (state.fileHandle && state.checklistFile) {
      try {
        setState(s => ({ ...s, autoSaveStatus: 'saving' }))
        await saveChecklistToDisk(state.fileHandle, state.checklistFile, state.reviewedItems)
        setState(s => ({
          ...s,
          autoSaveStatus: 'saved',
          hasBeenSaved: true,
          lastSavedAt: new Date().toISOString(),
          diskSaveError: null,
        }))
        return true
      } catch (err: unknown) {
        setState(s => ({
          ...s,
          autoSaveStatus: 'error',
          diskSaveError: err instanceof Error ? err.message : 'Failed to save',
        }))
        return false
      }
    } else {
      return connectDiskFile()
    }
  }, [state.fileHandle, state.checklistFile, state.reviewedItems, connectDiskFile])

  const startNewRelease = useCallback((options?: NewReleaseOptions) => {
    setState(s => {
      if (!s.checklistFile) return s
      const { updatedFile, updatedItems } = prepareNewRelease(s.checklistFile, s.reviewedItems, options)

      const safeProject = updatedFile.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'checklist'
      const safeVersion = updatedFile.version.toLowerCase().replace(/[^a-z0-9._-]/g, '_') || '1.0'
      const updatedFileName = `${safeProject}-${safeVersion}.json`

      return {
        ...s,
        isDirty: true,
        hasBeenSaved: false,
        fileName: updatedFileName,
        checklistFile: updatedFile,
        reviewedItems: updatedItems,
        fileHandle: null,
        autoSaveTarget: s.autoSaveEnabled ? 'browser' : 'none',
      }
    })
  }, [])

  return {
    ...state,
    reset,
    startNew,
    startOpen,
    selectTemplate,
    setMetadata,
    loadFile,
    loadChecklistFile,
    markSaved,
    addUserPersona,
    proceedToView,
    goBack,
    saveItemResponse,
    confirmItem,
    batchUpdateStatus,
    batchConfirm,
    updatePersonas,
    editItem,
    assignItem,
    batchAssign,
    addItem,
    deleteItem,
    updateFields,
    updateRules,
    updateMetadata,
    clearSessionRestored,
    startNewRelease,
    toggleAutoSave,
    connectDiskFile,
    saveToDiskNow,
  }
}
