import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChecklistFile, ReviewedItem } from '../../types'
import {
  formatTime,
  isFileSystemAccessSupported,
  pickOpenFileHandle,
  pickSaveFileHandle,
  saveChecklistToDisk,
  writeFileHandle,
  type FileSystemFileHandleLike,
} from '../../utils/fileStorage'

describe('fileStorage utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isFileSystemAccessSupported', () => {
    it('returns false in jsdom environment when showSaveFilePicker is missing', () => {
      expect(isFileSystemAccessSupported()).toBe(false)
    })

    it('returns true when showSaveFilePicker is present on window', () => {
      const orig = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker
      ;(window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi.fn()
      expect(isFileSystemAccessSupported()).toBe(true)
      ;(window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = orig
    })
  })

  describe('formatTime', () => {
    it('returns empty string for null or undefined', () => {
      expect(formatTime(null)).toBe('')
      expect(formatTime(undefined)).toBe('')
    })

    it('formats a valid ISO timestamp', () => {
      const time = formatTime('2026-10-10T12:34:56.000Z')
      expect(time).toBeTruthy()
      expect(typeof time).toBe('string')
    })
  })

  describe('writeFileHandle', () => {
    it('writes content to writable stream and closes it', async () => {
      const writeMock = vi.fn().mockResolvedValue(undefined)
      const closeMock = vi.fn().mockResolvedValue(undefined)
      const handle: FileSystemFileHandleLike = {
        kind: 'file',
        name: 'test.json',
        getFile: vi.fn(),
        createWritable: vi.fn().mockResolvedValue({
          write: writeMock,
          close: closeMock,
        }),
      }

      await writeFileHandle(handle, '{"test": true}')

      expect(handle.createWritable).toHaveBeenCalledTimes(1)
      expect(writeMock).toHaveBeenCalledWith('{"test": true}')
      expect(closeMock).toHaveBeenCalledTimes(1)
    })

    it('requests permission if permission is not already granted', async () => {
      const queryPermission = vi.fn().mockResolvedValue('prompt')
      const requestPermission = vi.fn().mockResolvedValue('granted')
      const writeMock = vi.fn().mockResolvedValue(undefined)
      const closeMock = vi.fn().mockResolvedValue(undefined)

      const handle: FileSystemFileHandleLike = {
        kind: 'file',
        name: 'test.json',
        getFile: vi.fn(),
        createWritable: vi.fn().mockResolvedValue({
          write: writeMock,
          close: closeMock,
        }),
        queryPermission,
        requestPermission,
      }

      await writeFileHandle(handle, 'content')

      expect(queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
      expect(requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
      expect(writeMock).toHaveBeenCalledWith('content')
    })

    it('throws error when permission is denied', async () => {
      const queryPermission = vi.fn().mockResolvedValue('prompt')
      const requestPermission = vi.fn().mockResolvedValue('denied')

      const handle: FileSystemFileHandleLike = {
        kind: 'file',
        name: 'test.json',
        getFile: vi.fn(),
        createWritable: vi.fn(),
        queryPermission,
        requestPermission,
      }

      await expect(writeFileHandle(handle, 'content')).rejects.toThrow(/Permission to write to file was denied/)
    })
  })

  describe('saveChecklistToDisk', () => {
    it('serializes checklist file and items into JSON', async () => {
      const writeMock = vi.fn().mockResolvedValue(undefined)
      const closeMock = vi.fn().mockResolvedValue(undefined)
      const handle: FileSystemFileHandleLike = {
        kind: 'file',
        name: 'test.json',
        getFile: vi.fn(),
        createWritable: vi.fn().mockResolvedValue({
          write: writeMock,
          close: closeMock,
        }),
      }

      const file: ChecklistFile = {
        version: '1.0',
        project: 'DiskProject',
        fields: [],
        items: [],
      }
      const items: ReviewedItem[] = [
        {
          id: 'ITEM-1',
          category: 'General',
          description: 'Desc',
          status: 'pass',
          required: true,
          history: [],
          confirmedBy: null,
        },
      ]

      await saveChecklistToDisk(handle, file, items)

      expect(writeMock).toHaveBeenCalledTimes(1)
      const writtenStr = writeMock.mock.calls[0][0] as string
      const parsed = JSON.parse(writtenStr)
      expect(parsed.project).toBe('DiskProject')
      expect(parsed.items).toHaveLength(1)
      expect(parsed.items[0].id).toBe('ITEM-1')
      expect(parsed.items[0].status).toBe('pass')
    })
  })

  describe('pickSaveFileHandle & pickOpenFileHandle', () => {
    it('pickSaveFileHandle returns null when FS API is unsupported', async () => {
      const result = await pickSaveFileHandle('test.json')
      expect(result).toBeNull()
    })

    it('pickSaveFileHandle returns handle when selected', async () => {
      const mockHandle = { kind: 'file', name: 'picked.json' }
      ;(window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle)

      const result = await pickSaveFileHandle('picked.json')
      expect(result).toBe(mockHandle)
      delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker
    })

    it('pickSaveFileHandle returns null when user cancels (AbortError)', async () => {
      const abortErr = new Error('The user aborted a request.')
      abortErr.name = 'AbortError'
      ;(window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi.fn().mockRejectedValue(abortErr)

      const result = await pickSaveFileHandle('cancelled.json')
      expect(result).toBeNull()
      delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker
    })

    it('pickOpenFileHandle returns null when unsupported', async () => {
      const result = await pickOpenFileHandle()
      expect(result).toBeNull()
    })

    it('pickOpenFileHandle returns handle and file when chosen', async () => {
      const mockFile = new File(['{"hello": "world"}'], 'test.json', { type: 'application/json' })
      const mockHandle = {
        kind: 'file',
        name: 'test.json',
        getFile: vi.fn().mockResolvedValue(mockFile),
      }
      ;(window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle])

      const result = await pickOpenFileHandle()
      expect(result).not.toBeNull()
      expect(result?.handle).toBe(mockHandle)
      expect(result?.file).toBe(mockFile)
      delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker
    })
  })
})
