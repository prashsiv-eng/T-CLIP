import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import RestoreIcon from '@mui/icons-material/Restore'
import SearchIcon from '@mui/icons-material/Search'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Radio,
  Select,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import { validateChecklistFile } from '../../schema/validate'
import type { ChecklistFile, FieldType, ItemStatus } from '../../types'
import { downloadJSON } from '../../utils/export'
import {
  buildChecklistFile,
  buildEditableRowsFromSheets,
  detectColumnMapping,
  detectHeaderRow,
  parseSpreadsheetFile,
  type ColumnMapping,
  type EditableImportRow,
  type ImportMode,
  type SheetInput,
} from '../../utils/importer'
import { STATUS_META } from '../checklist/StatusBadge'

interface Props {
  open: boolean
  initialMode?: ImportMode
  onClose: () => void
  onImportChecklist?: (file: ChecklistFile, fileName?: string) => void
  onImportTemplate?: (file: ChecklistFile) => void
}

const STEPS = ['Upload File', 'Map Columns', 'Visual Edit & Review', 'Finalize']

export function SpreadsheetImportDialog({
  open,
  initialMode = 'checklist',
  onClose,
  onImportChecklist,
  onImportTemplate,
}: Props) {
  const [mode, setMode] = useState<ImportMode>(initialMode)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // File & Sheet state
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [allSheets, setAllSheets] = useState<Record<string, string[][]>>({})
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [activePreviewSheet, setActivePreviewSheet] = useState<string>('')
  const [useSheetNameAsCategory, setUseSheetNameAsCategory] = useState<boolean>(true)
  const [sheetRows, setSheetRows] = useState<string[][]>([])
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0)

  // Column Mapping state
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    idIndex: -1,
    categoryIndex: -1,
    fallbackCategory: 'General',
    descriptionIndex: -1,
    requiredIndex: -1,
    defaultRequired: true,
    statusIndex: -1,
    defaultStatus: 'not-started',
    assigneeIndex: -1,
    customFieldIndices: [],
  })

  // Metadata
  const [project, setProject] = useState('My-Audit')
  const [version, setVersion] = useState('1.0')
  const [branch, setBranch] = useState('main')

  // Visual Edit state
  const [editableRows, setEditableRows] = useState<EditableImportRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 20

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset or initialize state
  function handleReset() {
    setStep(0)
    setError(null)
    setFileName('')
    setFileSize(0)
    setSheetNames([])
    setAllSheets({})
    setSelectedSheets([])
    setActivePreviewSheet('')
    setSheetRows([])
    setEditableRows([])
    setSearchQuery('')
    setPage(1)
  }

  function handleCloseDialog() {
    handleReset()
    onClose()
  }

  // Step 0: Handle File Upload
  async function handleFileUpload(file: File) {
    setError(null)
    setLoading(true)
    try {
      const parsed = await parseSpreadsheetFile(file, file.name)
      if (parsed.sheetNames.length === 0) {
        throw new Error('No readable sheets found in file.')
      }

      setFileName(file.name)
      setFileSize(file.size)
      setSheetNames(parsed.sheetNames)
      setAllSheets(parsed.sheets)

      const initialSheet = parsed.sheetNames[0] || 'Sheet 1'
      setSelectedSheets([initialSheet])
      setActivePreviewSheet(initialSheet)
      const rows = parsed.sheets[initialSheet] || []
      setSheetRows(rows)

      const detectedHeader = detectHeaderRow(rows)
      setHeaderRowIndex(detectedHeader)

      const headers = rows[detectedHeader] || []
      const detectedMapping = detectColumnMapping(headers)
      setColumnMapping(detectedMapping)

      // Guess project name from filename
      const baseProject = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      setProject(baseProject || 'Checklist')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setLoading(false)
    }
  }

  function handleSwitchPreviewSheet(sheetName: string) {
    setActivePreviewSheet(sheetName)
    const rows = allSheets[sheetName] || []
    setSheetRows(rows)
    const detected = detectHeaderRow(rows)
    setHeaderRowIndex(detected)
    const headers = rows[detected] || []
    setColumnMapping(detectColumnMapping(headers))
  }

  function handleToggleSheet(sheetName: string) {
    setSelectedSheets(prev => {
      const exists = prev.includes(sheetName)
      const next = exists ? prev.filter(s => s !== sheetName) : [...prev, sheetName]
      if (!exists && prev.length === 0) {
        handleSwitchPreviewSheet(sheetName)
      } else if (exists && activePreviewSheet === sheetName && next.length > 0) {
        handleSwitchPreviewSheet(next[0])
      }
      return next
    })
  }

  function handleSelectAllSheets() {
    setSelectedSheets([...sheetNames])
  }

  function handleHeaderRowChange(newIndex: number) {
    setHeaderRowIndex(newIndex)
    if (sheetRows[newIndex]) {
      const mapping = detectColumnMapping(sheetRows[newIndex])
      setColumnMapping(mapping)
    }
  }

  // Move from Step 0 to Step 1
  function handleProceedToMapping() {
    if (selectedSheets.length === 0) {
      setError('Please select at least one sheet to import.')
      return
    }
    setError(null)
    setStep(1)
  }

  // Move from Step 1 to Step 2 (Build Editable Rows)
  function handleProceedToReview() {
    if (columnMapping.descriptionIndex < 0) {
      setError('Please select a column for "Requirement / Description" to continue.')
      return
    }
    setError(null)
    const sheetsToProcess: SheetInput[] = selectedSheets.map(sName => ({
      name: sName,
      rows: allSheets[sName] || [],
      headerRowIndex,
    }))
    const rows = buildEditableRowsFromSheets(
      sheetsToProcess,
      columnMapping,
      mode,
      { useSheetNameAsCategoryIfBlank: useSheetNameAsCategory }
    )
    if (rows.length === 0) {
      setError('No items could be parsed from the selected sheet(s). Check the header row selection.')
      return
    }
    setEditableRows(rows)
    setPage(1)
    setStep(2)
  }

  // Row editing helpers for Step 2
  function handleUpdateRow(rowId: string, field: keyof EditableImportRow, val: unknown) {
    setEditableRows(prev =>
      prev.map(r => (r.rowId === rowId ? { ...r, [field]: val } : r))
    )
  }

  function handleToggleExcludeRow(rowId: string) {
    setEditableRows(prev =>
      prev.map(r => (r.rowId === rowId ? { ...r, isExcluded: !r.isExcluded } : r))
    )
  }

  function handleAddEmptyRow() {
    const newId = `ITEM-${String(editableRows.length + 1).padStart(3, '0')}`
    const newRow: EditableImportRow = {
      rowId: `manual-${Date.now()}`,
      id: newId,
      category: columnMapping.fallbackCategory || 'General',
      description: '',
      required: true,
      status: mode === 'template' ? 'not-started' : 'not-started',
      customValues: {},
      isExcluded: false,
    }
    setEditableRows(prev => [newRow, ...prev])
  }

  // Computed properties for Step 2 & 3
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return editableRows
    const q = searchQuery.toLowerCase()
    return editableRows.filter(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.assignedTo?.role && r.assignedTo.role.toLowerCase().includes(q))
    )
  }, [editableRows, searchQuery])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, page])

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1

  const activeRowsCount = useMemo(() => editableRows.filter(r => !r.isExcluded).length, [editableRows])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    editableRows.filter(r => !r.isExcluded).forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })
    return counts
  }, [editableRows])

  // Move from Step 2 to Step 3 (Final Checklist generation)
  const finalChecklistFile = useMemo(() => {
    if (editableRows.length === 0) return null
    const customFields = columnMapping.customFieldIndices
      .filter(f => f.include)
      .map(f => ({
        id: f.fieldId,
        label: f.label,
        type: f.type,
      }))

    return buildChecklistFile({
      mode,
      project,
      version,
      branch,
      rows: editableRows,
      customFields,
    })
  }, [mode, project, version, branch, editableRows, columnMapping])

  const validationResult = useMemo(() => {
    if (!finalChecklistFile) return { valid: false, errors: ['No checklist data'] }
    return validateChecklistFile(finalChecklistFile)
  }, [finalChecklistFile])

  // Final Action Handlers
  function handleDownloadFinalJSON() {
    if (!finalChecklistFile) return
    const safeProject = project ? project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'
    const suffix = mode === 'template' ? '-template.json' : `-${version || '1.0'}.json`
    downloadJSON(finalChecklistFile, `${safeProject}${suffix}`)
  }

  function handleFinishAndOpen() {
    if (!finalChecklistFile || !validationResult.valid) return
    const safeProject = project ? project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'
    const defaultName = `${safeProject}-${version || '1.0'}.json`

    if (mode === 'checklist') {
      if (onImportChecklist) {
        onImportChecklist(finalChecklistFile, defaultName)
      }
    } else {
      if (onImportTemplate) {
        onImportTemplate(finalChecklistFile)
      }
    }
    handleCloseDialog()
  }

  const currentHeaders = useMemo(() => {
    return sheetRows[headerRowIndex] || []
  }, [sheetRows, headerRowIndex])

  const totalSelectedRows = useMemo(() => {
    return selectedSheets.reduce((acc, name) => acc + (allSheets[name]?.length || 0), 0)
  }, [selectedSheets, allSheets])

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0f172a',
            backgroundImage: 'none',
            border: '1px solid #1e293b',
            borderRadius: 3,
            color: '#f8fafc',
            minHeight: '82vh',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <TableChartOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                Spreadsheet Import Wizard
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                Convert CSV / XLSX files into T-CLIP checklists or reusable templates
              </Typography>
            </Box>
          </Box>

          <IconButton size="small" onClick={handleCloseDialog} sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label, index) => (
              <Step key={label} completed={step > index}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: 12,
                      fontWeight: 600,
                      color: step === index ? '#60a5fa' : '#64748b',
                    },
                    '& .MuiStepIcon-root': {
                      color: step >= index ? '#2563eb' : '#334155',
                      '&.Mui-active': { color: '#3b82f6' },
                      '&.Mui-completed': { color: '#16a34a' },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </Alert>
        )}

        {/* ── STEP 0: FILE UPLOAD & MODE SELECTION ──────────────────────── */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mode Selector */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', mb: 1 }}>
                Choose Import Purpose
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    onClick={() => setMode('checklist')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: mode === 'checklist' ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${mode === 'checklist' ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 2,
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(37,99,235,0.08)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Radio checked={mode === 'checklist'} size="small" sx={{ p: 0, color: '#3b82f6' }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        Import as Active Checklist
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', pl: 3.5 }}>
                      Preserve existing evaluation statuses (Pass, Fail, N/A, In-Progress), notes, and evidence to continue the review in T-CLIP.
                    </Typography>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    onClick={() => setMode('template')}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: mode === 'template' ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${mode === 'template' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 2,
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(124,58,237,0.08)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Radio checked={mode === 'template'} size="small" sx={{ p: 0, color: '#a78bfa' }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        Import as Reusable Template
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', pl: 3.5 }}>
                      Import baseline framework requirements or security standards. All item statuses are initialized to Not-Started for fresh audits.
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Drop Zone */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed rgba(59,130,246,0.3)',
                borderRadius: 2.5,
                bgcolor: 'rgba(37,99,235,0.04)',
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#3b82f6',
                  bgcolor: 'rgba(37,99,235,0.08)',
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                hidden
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFileUpload(f)
                }}
              />
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(59,130,246,0.15)',
                  color: '#60a5fa',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                {loading ? <CircularProgress size={28} color="inherit" /> : <FileUploadOutlinedIcon sx={{ fontSize: 30 }} />}
              </Box>

              <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
                {fileName ? fileName : 'Choose or Drag & Drop Spreadsheet'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                Supports Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) and CSV (<strong>.csv</strong>, <strong>.tsv</strong>)
              </Typography>
              {fileSize > 0 && (
                <Typography sx={{ fontSize: 11, color: '#60a5fa', mt: 1, fontWeight: 600 }}>
                  {sheetNames.length > 1
                    ? `Size: ${(fileSize / 1024).toFixed(1)} KB | Workbook: ${sheetNames.length} sheets | Selected: ${selectedSheets.length} sheet(s) (${totalSelectedRows} total rows)`
                    : `Size: ${(fileSize / 1024).toFixed(1)} KB | Rows parsed: ${sheetRows.length}`}
                </Typography>
              )}
            </Box>

            {!fileName && (
              <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#64748b', mb: 0.5 }}>
                  <LayersOutlinedIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    Sheet Selection & Column Detection
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                  Choose or drag & drop your Excel (.xlsx) or CSV file above. If your workbook contains multiple sheets/tabs, the sheet selector will appear here to let you select or combine them.
                </Typography>
              </Box>
            )}

            {/* Sheet & Header Row Settings (if file loaded) */}
            {sheetRows.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sheetNames.length > 1 && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LayersOutlinedIcon sx={{ fontSize: 20, color: '#60a5fa' }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                          Workbook Sheets ({selectedSheets.length} of {sheetNames.length} selected)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={handleSelectAllSheets}
                          sx={{ fontSize: 11, color: '#93c5fd', p: '2px 8px', minWidth: 0 }}
                        >
                          Select All ({sheetNames.length})
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setSelectedSheets([activePreviewSheet])}
                          sx={{ fontSize: 11, color: '#94a3b8', p: '2px 8px', minWidth: 0, '&:hover': { color: '#cbd5e1' } }}
                        >
                          Only Active Tab
                        </Button>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 1.5 }}>
                      Choose which sheet(s) to import. Click any sheet card to switch preview and configure its header row.
                    </Typography>

                    <Grid container spacing={1.5}>
                      {sheetNames.map(sName => {
                        const isSelected = selectedSheets.includes(sName)
                        const isPreviewing = activePreviewSheet === sName
                        const rowCount = (allSheets[sName] || []).length

                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sName}>
                            <Card
                              onClick={() => handleSwitchPreviewSheet(sName)}
                              sx={{
                                p: 1.25,
                                cursor: 'pointer',
                                bgcolor: isPreviewing
                                  ? 'rgba(59,130,246,0.12)'
                                  : isSelected
                                  ? 'rgba(59,130,246,0.04)'
                                  : 'rgba(255,255,255,0.02)',
                                border: `1.5px solid ${
                                  isPreviewing
                                    ? '#3b82f6'
                                    : isSelected
                                    ? 'rgba(59,130,246,0.3)'
                                    : 'rgba(255,255,255,0.06)'
                                }`,
                                borderRadius: 1.5,
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: isPreviewing ? '#3b82f6' : 'rgba(59,130,246,0.4)',
                                  bgcolor: isPreviewing ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mr: 1 }}>
                                  <Checkbox
                                    size="small"
                                    checked={isSelected}
                                    onClick={e => e.stopPropagation()}
                                    onChange={() => handleToggleSheet(sName)}
                                    sx={{ p: 0.25, mr: 0.75, color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: 12,
                                      fontWeight: isPreviewing ? 700 : isSelected ? 600 : 500,
                                      color: isSelected ? '#f8fafc' : '#94a3b8',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={sName}
                                  >
                                    {sName}
                                  </Typography>
                                </Box>
                                {isPreviewing ? (
                                  <Chip
                                    size="small"
                                    label="Previewing"
                                    sx={{
                                      height: 20,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      bgcolor: 'rgba(59,130,246,0.2)',
                                      color: '#93c5fd',
                                    }}
                                  />
                                ) : (
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleSwitchPreviewSheet(sName)
                                    }}
                                    sx={{
                                      minWidth: 0,
                                      p: '0 6px',
                                      height: 20,
                                      fontSize: 10,
                                      color: '#94a3b8',
                                      '&:hover': { color: '#60a5fa' },
                                    }}
                                  >
                                    Preview
                                  </Button>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: 11, color: '#64748b', pl: 3.5 }}>
                                {rowCount} rows
                              </Typography>
                            </Card>
                          </Grid>
                        )
                      })}
                    </Grid>

                    {/* Multi-sheet merger options */}
                    {selectedSheets.length > 1 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: 'rgba(59,130,246,0.06)',
                          borderRadius: 1.5,
                          border: '1px solid rgba(59,130,246,0.2)',
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          justifyContent: 'space-between',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                              Combining {selectedSheets.length} sheets ({totalSelectedRows} total rows)
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                              Previewing and mapping using headers from "{activePreviewSheet}".
                            </Typography>
                          </Box>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={useSheetNameAsCategory}
                              onChange={e => setUseSheetNameAsCategory(e.target.checked)}
                              sx={{ mr: 0.5 }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>
                              Use sheet name as Category if unmapped
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </Box>
                    )}

                    {selectedSheets.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, bgcolor: 'rgba(234,179,8,0.1)', color: '#fde047', border: '1px solid rgba(234,179,8,0.3)', fontSize: 12 }}>
                        Please select at least one sheet to import.
                      </Alert>
                    )}
                  </Box>
                )}

                {sheetNames.length === 1 && (
                  <Box sx={{ p: 1.75, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LayersOutlinedIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                        Workbook Sheet (1 sheet: "{sheetNames[0]}")
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                      Importing from sheet <strong>"{sheetNames[0]}"</strong> ({sheetRows.length} rows).
                    </Typography>
                  </Box>
                )}

                {/* Header Row and Column Preview Box */}
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                    Header Row & Column Preview {sheetNames.length > 1 ? `(${activePreviewSheet})` : ''}
                  </Typography>
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12 }}>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 0.5 }}>
                        Header Row (Column Titles):
                      </Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={headerRowIndex}
                        onChange={e => handleHeaderRowChange(Number(e.target.value))}
                        sx={{ bgcolor: 'rgba(0,0,0,0.2)', fontSize: 13 }}
                      >
                        {sheetRows.slice(0, 5).map((row, idx) => (
                          <MenuItem key={idx} value={idx}>
                            Row {idx + 1}: {row.filter(Boolean).slice(0, 5).join(' | ') || '(Empty)'}
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                  </Grid>

                  {/* Raw Preview */}
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 0.5, textTransform: 'uppercase' }}>
                      Detected Columns (Row {headerRowIndex + 1}):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {currentHeaders.map((col, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={col || `Col ${idx + 1}`}
                          sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ── STEP 1: MAP COLUMNS & CONFIGURATION ─────────────────────────── */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)', fontSize: 12 }}>
              Columns were auto-matched from header names. Review or adjust the mapping below.
            </Alert>

            {selectedSheets.length > 1 && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(59,130,246,0.06)',
                  borderRadius: 2,
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LayersOutlinedIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
                  <Typography sx={{ fontSize: 12, color: '#cbd5e1' }}>
                    Mapping columns for <strong>{selectedSheets.length} sheets</strong> ({totalSelectedRows} rows) based on headers from <strong>"{activePreviewSheet}"</strong>.
                  </Typography>
                </Box>
                {useSheetNameAsCategory && (
                  <Chip
                    size="small"
                    label="Sheet Name → Category enabled"
                    sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11 }}
                  />
                )}
              </Box>
            )}

            {/* Core Fields Grid */}
            <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', mb: 2 }}>
                1. Core Checklist Fields
              </Typography>

              <Grid container spacing={2}>
                {/* ID Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Control ID <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={columnMapping.idIndex}
                    onChange={e => setColumnMapping(prev => ({ ...prev, idIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>⚡ Auto-generate IDs (ITEM-001, ITEM-002…)</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Category Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Category / Domain <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={columnMapping.categoryIndex}
                    onChange={e => setColumnMapping(prev => ({ ...prev, categoryIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>Use Fallback: "{columnMapping.fallbackCategory || 'General'}"</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Description Column */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Requirement / Description Statement <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={columnMapping.descriptionIndex}
                    onChange={e => setColumnMapping(prev => ({ ...prev, descriptionIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>-- Select Column --</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Status Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Review Status {mode === 'template' ? '(Template sets to Not-Started)' : ''}
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={mode === 'template' ? -1 : columnMapping.statusIndex}
                    disabled={mode === 'template'}
                    onChange={e => setColumnMapping(prev => ({ ...prev, statusIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>Default: "Not Started"</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Required Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Mandatory / Required Flag
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={columnMapping.requiredIndex}
                    onChange={e => setColumnMapping(prev => ({ ...prev, requiredIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>Default: All Mandatory (Yes)</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Assignee Column */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Assigned Role / Owner
                  </Typography>
                  <Select
                    size="small"
                    fullWidth
                    value={columnMapping.assigneeIndex}
                    onChange={e => setColumnMapping(prev => ({ ...prev, assigneeIndex: Number(e.target.value) }))}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  >
                    <MenuItem value={-1}>None / Unassigned</MenuItem>
                    {currentHeaders.map((h, i) => (
                      <MenuItem key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* Fallback category input */}
                {columnMapping.categoryIndex === -1 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                      Fallback Category Name
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={columnMapping.fallbackCategory}
                      onChange={e => setColumnMapping(prev => ({ ...prev, fallbackCategory: e.target.value }))}
                      sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Custom Fields (Extra Columns) */}
            {columnMapping.customFieldIndices.length > 0 && (
              <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                  2. Additional Custom Fields / Evidence Columns
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 2 }}>
                  Selected columns will be added to the checklist evidence schema and populated with row values.
                </Typography>

                <Grid container spacing={1.5}>
                  {columnMapping.customFieldIndices.map((field, idx) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={field.columnIndex}>
                      <Card sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={field.include}
                                onChange={e => {
                                  const updated = [...columnMapping.customFieldIndices]
                                  updated[idx] = { ...field, include: e.target.checked }
                                  setColumnMapping(prev => ({ ...prev, customFieldIndices: updated }))
                                }}
                              />
                            }
                            label={<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{field.label}</Typography>}
                          />
                          <Select
                            size="small"
                            value={field.type}
                            disabled={!field.include}
                            onChange={e => {
                              const updated = [...columnMapping.customFieldIndices]
                              updated[idx] = { ...field, type: e.target.value as FieldType }
                              setColumnMapping(prev => ({ ...prev, customFieldIndices: updated }))
                            }}
                            sx={{ minWidth: 100, fontSize: 11, height: 28 }}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                            <MenuItem value="url">URL</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="boolean">Boolean</MenuItem>
                          </Select>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Metadata Section */}
            <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', mb: 2 }}>
                3. Metadata & Project Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Project / Standard Name <span style={{ color: '#ef4444' }}>*</span>
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={project}
                    onChange={e => setProject(e.target.value)}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Version
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', mb: 0.5 }}>
                    Branch
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* ── STEP 2: VISUAL REVIEW & IN-LINE EDITING ─────────────────────── */}
        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Top Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`Active: ${activeRowsCount} items`}
                  sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontWeight: 700 }}
                />
                {Object.entries(statusCounts).map(([st, cnt]) => {
                  const meta = STATUS_META[st as ItemStatus]
                  return (
                    <Chip
                      key={st}
                      size="small"
                      label={`${meta?.label || st}: ${cnt}`}
                      sx={{ bgcolor: meta?.bgColor || 'rgba(255,255,255,0.06)', color: meta?.color || '#cbd5e1', fontSize: 11 }}
                    />
                  )
                })}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search items…"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: 220, bgcolor: 'rgba(0,0,0,0.2)' }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlinedIcon />}
                  onClick={handleAddEmptyRow}
                  sx={{ color: '#93c5fd', borderColor: 'rgba(59,130,246,0.4)', fontSize: 12 }}
                >
                  Add Item
                </Button>
              </Box>
            </Box>

            {/* Editable Table */}
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                maxHeight: '52vh',
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#1e293b', color: '#cbd5e1', fontWeight: 700, fontSize: 12 } }}>
                    <TableCell width={50}>#</TableCell>
                    <TableCell width={110}>ID</TableCell>
                    <TableCell width={140}>Category</TableCell>
                    <TableCell>Description / Requirement</TableCell>
                    <TableCell width={80}>Req?</TableCell>
                    <TableCell width={130}>Status</TableCell>
                    <TableCell width={120}>Assignee</TableCell>
                    <TableCell width={60} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row, index) => {
                    const rowNum = (page - 1) * rowsPerPage + index + 1
                    return (
                      <TableRow
                        key={row.rowId}
                        sx={{
                          opacity: row.isExcluded ? 0.35 : 1,
                          textDecoration: row.isExcluded ? 'line-through' : 'none',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        }}
                      >
                        <TableCell sx={{ fontSize: 11, color: '#64748b' }}>{rowNum}</TableCell>

                        {/* ID */}
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={row.id}
                            disabled={row.isExcluded}
                            onChange={e => handleUpdateRow(row.rowId, 'id', e.target.value)}
                            slotProps={{ input: { sx: { fontSize: 12, fontWeight: 700, color: '#f8fafc' } } }}
                          />
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={row.category}
                            disabled={row.isExcluded}
                            onChange={e => handleUpdateRow(row.rowId, 'category', e.target.value)}
                            slotProps={{ input: { sx: { fontSize: 12, color: '#93c5fd' } } }}
                          />
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            multiline
                            maxRows={3}
                            fullWidth
                            value={row.description}
                            disabled={row.isExcluded}
                            onChange={e => handleUpdateRow(row.rowId, 'description', e.target.value)}
                            slotProps={{ input: { sx: { fontSize: 12, color: '#f8fafc' } } }}
                          />
                        </TableCell>

                        {/* Required */}
                        <TableCell>
                          <Switch
                            size="small"
                            checked={row.required}
                            disabled={row.isExcluded}
                            onChange={e => handleUpdateRow(row.rowId, 'required', e.target.checked)}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Select
                            size="small"
                            variant="standard"
                            value={row.status}
                            disabled={row.isExcluded}
                            onChange={e => handleUpdateRow(row.rowId, 'status', e.target.value as ItemStatus)}
                            sx={{ fontSize: 11 }}
                          >
                            <MenuItem value="not-started">Not Started</MenuItem>
                            <MenuItem value="in-progress">In Progress</MenuItem>
                            <MenuItem value="blocked">Blocked</MenuItem>
                            <MenuItem value="in-review">In Review</MenuItem>
                            <MenuItem value="pass">Pass</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="na">N/A</MenuItem>
                          </Select>
                        </TableCell>

                        {/* Assignee */}
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            value={row.assignedTo?.role || ''}
                            disabled={row.isExcluded}
                            placeholder="Unassigned"
                            onChange={e =>
                              handleUpdateRow(row.rowId, 'assignedTo', e.target.value ? { role: e.target.value } : undefined)
                            }
                            slotProps={{ input: { sx: { fontSize: 12, color: '#cbd5e1' } } }}
                          />
                        </TableCell>

                        {/* Action: Exclude / Restore */}
                        <TableCell align="center">
                          <Tooltip title={row.isExcluded ? 'Restore row' : 'Exclude / Delete row'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExcludeRow(row.rowId)}
                              sx={{ color: row.isExcluded ? '#4ade80' : '#ef4444' }}
                            >
                              {row.isExcluded ? <RestoreIcon fontSize="small" /> : <DeleteOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </Box>
        )}

        {/* ── STEP 3: FINALIZE & EXPORT ───────────────────────────────────── */}
        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Validation Banner */}
            {validationResult.valid ? (
              <Alert
                severity="success"
                icon={<CheckCircleOutlinedIcon />}
                sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  Checklist Schema 100% Valid
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#bbf7d0' }}>
                  All items, categories, and field rules comply strictly with the T-CLIP specification.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ bgcolor: 'rgba(234,179,8,0.12)', color: '#fde047', border: '1px solid rgba(234,179,8,0.3)' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  Validation Warnings
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                  {validationResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Final Summary Card */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', mb: 2 }}>
                Import Summary
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Target Purpose</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: mode === 'checklist' ? '#60a5fa' : '#c084fc', textTransform: 'capitalize' }}>
                    {mode === 'checklist' ? 'Active Checklist (With Statuses)' : 'Reusable Template'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Project / Standard</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                    {project} (v{version})
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>Total Items Included</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                    {activeRowsCount} items
                  </Typography>
                </Grid>

                {/* Status distribution in checklist mode */}
                {mode === 'checklist' && (
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 1 }}>Status Distribution</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(statusCounts).map(([st, cnt]) => {
                        const meta = STATUS_META[st as ItemStatus]
                        return (
                          <Chip
                            key={st}
                            size="small"
                            label={`${meta?.label || st}: ${cnt}`}
                            sx={{ bgcolor: meta?.bgColor || 'rgba(255,255,255,0.06)', color: meta?.color || '#cbd5e1' }}
                          />
                        )
                      })}
                    </Box>
                  </Grid>
                )}

                {/* Custom fields configured */}
                {finalChecklistFile && finalChecklistFile.fields.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 1 }}>Evidence & Custom Fields</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {finalChecklistFile.fields.map(f => (
                        <Chip
                          key={f.id}
                          size="small"
                          label={`${f.label} (${f.type})`}
                          sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.07)', justifyContent: 'space-between' }}>
        <Button
          size="small"
          onClick={step === 0 ? handleCloseDialog : () => setStep(s => s - 1)}
          startIcon={step > 0 ? <ArrowBackIcon /> : undefined}
          sx={{ color: '#94a3b8' }}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {step === 0 && (
            <Button
              variant="contained"
              disabled={sheetRows.length === 0 || selectedSheets.length === 0}
              onClick={handleProceedToMapping}
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Continue to Mapping
            </Button>
          )}

          {step === 1 && (
            <Button
              variant="contained"
              onClick={handleProceedToReview}
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Visual Review & Edit
            </Button>
          )}

          {step === 2 && (
            <Button
              variant="contained"
              onClick={() => setStep(3)}
              endIcon={<ArrowForwardIcon />}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Proceed to Finalize
            </Button>
          )}

          {step === 3 && (
            <>
              <Button
                variant="outlined"
                onClick={handleDownloadFinalJSON}
                startIcon={<DownloadOutlinedIcon />}
                sx={{ color: '#93c5fd', borderColor: 'rgba(59,130,246,0.4)' }}
              >
                Download {mode === 'template' ? 'Template JSON' : 'checklist.json'}
              </Button>

              <Button
                variant="contained"
                onClick={handleFinishAndOpen}
                startIcon={<PlayArrowOutlinedIcon />}
                sx={{
                  bgcolor: mode === 'checklist' ? '#2563eb' : '#7c3aed',
                  '&:hover': { bgcolor: mode === 'checklist' ? '#1d4ed8' : '#6d28d9' },
                }}
              >
                {mode === 'checklist' ? 'Open Checklist in T-CLIP' : 'Use as Template'}
              </Button>
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  )
}
