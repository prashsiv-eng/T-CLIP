import type { ChecklistFile, ReviewedItem } from '../types'

export interface FileSystemHandleLike {
  kind: 'file' | 'directory'
  name: string
}

export interface FileSystemWritableFileStreamLike {
  write(data: unknown): Promise<void>
  close(): Promise<void>
}

export interface FileSystemFileHandleLike extends FileSystemHandleLike {
  kind: 'file'
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStreamLike>
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>
}

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker === 'function'
  )
}

export async function pickSaveFileHandle(suggestedName?: string): Promise<FileSystemFileHandleLike | null> {
  if (!isFileSystemAccessSupported()) return null
  try {
    const win = window as unknown as {
      showSaveFilePicker: (options: {
        suggestedName?: string
        types?: Array<{ description: string; accept: Record<string, string[]> }>
      }) => Promise<FileSystemFileHandleLike>
    }
    const handle = await win.showSaveFilePicker({
      suggestedName: suggestedName || 'checklist.json',
      types: [
        {
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    })
    return handle
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
      return null
    }
    throw err
  }
}

export async function pickOpenFileHandle(): Promise<{ handle: FileSystemFileHandleLike; file: File } | null> {
  if (
    typeof window === 'undefined' ||
    typeof (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker !== 'function'
  ) {
    return null
  }
  try {
    const win = window as unknown as {
      showOpenFilePicker: (options: {
        multiple?: boolean
        types?: Array<{ description: string; accept: Record<string, string[]> }>
      }) => Promise<FileSystemFileHandleLike[]>
    }
    const [handle] = await win.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    })
    if (!handle) return null
    const file = await handle.getFile()
    return { handle, file }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
      return null
    }
    throw err
  }
}

export async function writeFileHandle(handle: FileSystemFileHandleLike, content: string): Promise<void> {
  if (typeof handle.queryPermission === 'function') {
    const status = await handle.queryPermission({ mode: 'readwrite' })
    if (status !== 'granted' && typeof handle.requestPermission === 'function') {
      const requested = await handle.requestPermission({ mode: 'readwrite' })
      if (requested !== 'granted') {
        throw new Error('Permission to write to file was denied')
      }
    }
  }
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function saveChecklistToDisk(
  handle: FileSystemFileHandleLike,
  file: ChecklistFile,
  reviewedItems: ReviewedItem[]
): Promise<void> {
  const fullFile: ChecklistFile = {
    ...file,
    items: reviewedItems,
  }
  const json = JSON.stringify(fullFile, null, 2)
  await writeFileHandle(handle, json)
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}
