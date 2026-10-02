import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import { Alert, Box, Button, Card, CardContent, IconButton, ThemeProvider, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { darkTheme } from '../../theme'

interface Props {
  onFileLoaded: (bytes: ArrayBuffer, text: string, fileName?: string) => void
  onBack: () => void
  validationErrors: string[]
}

export function OpenFileScreen({ onFileLoaded, onBack, validationErrors }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const b = ev.target?.result as ArrayBuffer
      onFileLoaded(b, new TextDecoder().decode(b), file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
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
            onClick={() => fileRef.current?.click()}
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
              <Button variant="outlined" size="small" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#f8fafc' }}>
                Select File
              </Button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
            </CardContent>
          </Card>

          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Validation Errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '12px' }}>
                {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Alert>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  )
}
