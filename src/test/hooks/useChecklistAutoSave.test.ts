import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTOSAVE_PREF_KEY, useChecklist } from '../../hooks/useChecklist'
import type { ChecklistFile, FileSystemFileHandleLike } from '../../types'

const SAMPLE_FILE: ChecklistFile = {
  version: '1.0',
  project: 'AutoSaveApp',
  fields: [],
  items: [
    {
      id: 'SEC-1',
      category: 'Sec',
      description: 'Test Item',
      status: 'not-started',
      required: true,
    },
  ],
}

describe('useChecklist auto-save', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('initializes autoSaveEnabled to true by default', () => {
    const { result } = renderHook(() => useChecklist())
    expect(result.current.autoSaveEnabled).toBe(true)
    expect(result.current.autoSaveStatus).toBe('saved')
  })

  it('toggles auto-save on and off and updates localStorage', async () => {
    const { result } = renderHook(() => useChecklist())

    await act(async () => {
      await result.current.toggleAutoSave()
    })

    expect(result.current.autoSaveEnabled).toBe(false)
    expect(result.current.autoSaveStatus).toBe('off')
    expect(localStorage.getItem(AUTOSAVE_PREF_KEY)).toBe('false')

    await act(async () => {
      await result.current.toggleAutoSave()
    })

    expect(result.current.autoSaveEnabled).toBe(true)
    expect(localStorage.getItem(AUTOSAVE_PREF_KEY)).toBe('true')
  })

  it('loadFile with file handle retains handle and sets autoSaveTarget to disk', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    const closeMock = vi.fn().mockResolvedValue(undefined)
    const mockHandle: FileSystemFileHandleLike = {
      kind: 'file',
      name: 'disk-checklist.json',
      getFile: vi.fn(),
      createWritable: vi.fn().mockResolvedValue({
        write: writeMock,
        close: closeMock,
      }),
    }

    const { result } = renderHook(() => useChecklist())
    const jsonStr = JSON.stringify(SAMPLE_FILE)
    const bytes = new TextEncoder().encode(jsonStr).buffer

    await act(async () => {
      await result.current.loadFile(bytes, jsonStr, 'disk-checklist.json', mockHandle)
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.fileName).toBe('disk-checklist.json')
    expect(result.current.autoSaveTarget).toBe('disk')
    expect(result.current.hasBeenSaved).toBe(true)
  })

  it('debounces and saves to file handle when review response is saved', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    const closeMock = vi.fn().mockResolvedValue(undefined)
    const mockHandle: FileSystemFileHandleLike = {
      kind: 'file',
      name: 'disk-checklist.json',
      getFile: vi.fn(),
      createWritable: vi.fn().mockResolvedValue({
        write: writeMock,
        close: closeMock,
      }),
    }

    const { result } = renderHook(() => useChecklist())
    const jsonStr = JSON.stringify(SAMPLE_FILE)
    const bytes = new TextEncoder().encode(jsonStr).buffer

    await act(async () => {
      await result.current.loadFile(bytes, jsonStr, 'disk-checklist.json', mockHandle)
      result.current.proceedToView()
    })

    // Perform an edit
    act(() => {
      result.current.saveItemResponse('SEC-1', {
        actorName: 'Bob',
        role: 'reviewer',
        status: 'pass',
        timestamp: new Date().toISOString(),
      })
    })

    // Check status is saving
    expect(result.current.autoSaveStatus).toBe('saving')

    // Fast-forward debounce timer (600ms)
    await act(async () => {
      vi.advanceTimersByTime(650)
    })

    expect(writeMock).toHaveBeenCalled()
    expect(result.current.autoSaveStatus).toBe('saved')
    expect(result.current.hasBeenSaved).toBe(true)
  })
})
