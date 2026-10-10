import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import { Alert, Box, Button, Card, CardContent, IconButton, ThemeProvider, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { darkTheme } from '../../theme'
import type { ChecklistFile } from '../../types'
import { SpreadsheetImportDialog } from '../importer/SpreadsheetImportDialog'
import {
  type FileSystemFileHandleLike,
  isFileSystemAccessSupported,
  pickOpenFileHandle,
} from '../../utils/fileStorage'

interface Props {
  onFileLoaded: (
    bytes: ArrayBuffer,
    text: string,
    fileName?: string,
    handle?: FileSystemFileHandleLike | null
  ) => void
  onBack: () => void
  validationErrors: string[]
  onImportChecklist?: (file: ChecklistFile, fileName?: string) => void
  onImportTemplate?: (file: ChecklistFile) => void
}

export function OpenFileScreen({ onFileLoaded, onBack, validationErrors, onImportChecklist, onImportTemplate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [spreadsheetDialogOpen, setSpreadsheetDialogOpen] = useState(false)

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const b = ev.target?.result as ArrayBuffer
      onFileLoaded(b, new TextDecoder().decode(b), file.name, null)
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleOpenClick() {
    if (isFileSystemAccessSupported()) {
      try {
        const result = await pickOpenFileHandle()
        if (result) {
          const { handle, file } = result
          const text = await file.text()
          const bytes = await file.arrayBuffer()
          onFileLoaded(bytes, text, file.name, handle)
          return
        }
      } catch {
        // Fallback to standard input
      }
    }
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0]
      if (typeof (item as unknown as { getAsFileSystemHandle?: unknown }).getAsFileSystemHandle === 'function') {
        try {
          const handle = await (item as unknown as { getAsFileSystemHandle: () => Promise<FileSystemFileHandleLike> }).getAsFileSystemHandle()
          if (handle && handle.kind === 'file') {
            const file = await handle.getFile()
            const text = await file.text()
            const bytes = await file.arrayBuffer()
            onFileLoaded(bytes, text, file.name, handle)
            return
          }
        } catch {
          // fallback
        }
      }
    }
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh', bgcolor: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <Box sx={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <IconButton size="small" onClick={onBack} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: 20 }}>
                Open Checklist
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>
                Upload an existing checklist.json file to continue your work
              </Typography>
            </Box>
          </Box>

          {/* Upload Drop Zone Card */}
          <Card
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            sx={{
              bgcolor: isDragging ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.04)',
              border: '2px dashed',
              borderColor: isDragging ? '#3b82f6' : 'rgba(255,255,255,0.15)',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#3b82f6',
                bgcolor: 'rgba(255,255,255,0.06)',
              },
            }}
            onClick={handleOpenClick}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: 'rgba(37,99,235,0.12)', color: '#60a5fa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <FileUploadOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', mb: 0.75 }}>
                Click to browse or drag and drop
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#94a3b8', mb: 2 }}>
                Accepts valid JSON checklist files (*.json)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={e => {
                  e.stopPropagation()
                  handleOpenClick()
                }}
                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#f8fafc' }}
              >
                Select File
              </Button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
            </CardContent>
          </Card>

          {/* Import from Spreadsheet Option */}
          <Box sx={{ mt: 2.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: '#64748b', mb: 1 }}>— OR —</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TableChartOutlinedIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => setSpreadsheetDialogOpen(true)}
              sx={{
                color: '#6ee7b7',
                borderColor: 'rgba(16,185,129,0.4)',
                bgcolor: 'rgba(16,185,129,0.06)',
                fontWeight: 600,
                fontSize: 12,
                px: 2,
                '&:hover': {
                  borderColor: '#10b981',
                  bgcolor: 'rgba(16,185,129,0.15)',
                  color: '#ffffff',
                },
              }}
            >
              Import from CSV / Excel (.xlsx)
            </Button>
          </Box>

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Validation Errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '12px' }}>
                {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Alert>
          )}

          {/* Spreadsheet Import Dialog */}
          <SpreadsheetImportDialog
            open={spreadsheetDialogOpen}
            initialMode="checklist"
            onClose={() => setSpreadsheetDialogOpen(false)}
            onImportChecklist={onImportChecklist}
            onImportTemplate={onImportTemplate}
          />
        </Box>
      </Box>
    </ThemeProvider>
  )
}
