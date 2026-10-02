import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { Alert, Box, Button } from '@mui/material'
import { useState } from 'react'
import { AttestationSummary } from './components/attestation/AttestationSummary'
import { ChecklistView } from './components/checklist/ChecklistView'
import { DashboardView } from './components/dashboard/DashboardView'
import { ItemEditor } from './components/editor/ItemEditor'
import { MetadataEditor } from './components/editor/MetadataEditor'
import { AboutDialog } from './components/home/AboutDialog'
import { HomeScreen } from './components/home/HomeScreen'
import { MetaEntryForm } from './components/home/MetaEntryForm'
import { OpenFileScreen } from './components/home/OpenFileScreen'
import { PersonaSelectScreen } from './components/home/PersonaSelectScreen'
import { TemplateChooser } from './components/home/TemplateChooser'
import { Header } from './components/layout/Header'
import { NavTabs, type Tab } from './components/layout/NavTabs'
import { RestoredBanner } from './components/review/RestoredBanner'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useChecklist } from './hooks/useChecklist'
import { useSettings } from './hooks/useSettings'
import type { ChecklistItem, ReviewAction } from './types'
import { meetsMinimum } from './utils/capability'
import { isItemComplete } from './utils/fields'
import { clearSession } from './utils/session'
import { exportChecklistFile } from './utils/template'

export default function App() {
  const settings = useSettings()
  const checklist = useChecklist()
  const [activeTab, setActiveTab] = useState<Tab>('checklist')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const file = checklist.checklistFile
  const allRequiredComplete = file
    ? checklist.reviewedItems.filter(i => i.required).every(i => isItemComplete(i, file.fields, settings.currentCapability))
    : false
  const canEdit = file ? meetsMinimum(settings.currentCapability, file.rules?.structureEditableBy ?? 'editor') : false
  const editingItem = editingItemId ? checklist.reviewedItems.find(i => i.id === editingItemId) : undefined

  const handleExport = () => {
    if (!file) return
    checklist.markSaved()
    checklist.clearSessionRestored()
    exportChecklistFile({ ...file, items: checklist.reviewedItems }, checklist.fileName ?? undefined)
  }

  // ── Phases ───────────────────────────────────────────────────────────────
  if (checklist.phase === 'start' || checklist.phase === 'home') {
    return (
      <HomeScreen
        onNew={checklist.startNew}
        onOpen={checklist.startOpen}
      />
    )
  }

  if (checklist.phase === 'template-choose') {
    return (
      <TemplateChooser
        onSelect={checklist.selectTemplate}
        onBack={checklist.goBack}
      />
    )
  }

  if (checklist.phase === 'meta-entry') {
    return (
      <MetaEntryForm
        initialPersonas={checklist.checklistFile?.personas}
        onSubmit={(p, v, b, personas) => checklist.setMetadata(p, v, b, personas)}
        onBack={checklist.goBack}
      />
    )
  }

  if (checklist.phase === 'open-file') {
    return (
      <OpenFileScreen
        onFileLoaded={(b, t, name) => checklist.loadFile(b, t, name)}
        onBack={checklist.goBack}
        validationErrors={checklist.validationErrors}
      />
    )
  }

  if (checklist.phase === 'persona-select' && file) {
    return (
      <PersonaSelectScreen
        file={file}
        fileName={checklist.fileName}
        reviewedItems={checklist.reviewedItems}
        capabilityMap={settings.roleCapabilityMap}
        onSelectPersona={(name, role) => {
          settings.setUser(name)
          settings.setRole(role)
          checklist.proceedToView()
        }}
        onAddPersonaToFile={checklist.addUserPersona}
        onBack={checklist.goBack}
      />
    )
  }

  if (checklist.phase === 'view' && file) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', width: '100%', overflowX: 'clip' }}>
      <Header
        file={file}
        fileName={checklist.fileName}
        hasBeenSaved={checklist.hasBeenSaved}
        userName={settings.currentUser}
        userRole={settings.currentRole}
        capability={settings.currentCapability}
        onNameChange={settings.setUser}
        onRoleChange={settings.setRole}
        onSettingsOpen={() => setSettingsOpen(true)}
        onExport={handleExport}
        onRestart={checklist.reset}
        onAboutOpen={() => setAboutOpen(true)}
      />

      {/* Sub-header: metadata edit + nav */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', width: '100%', maxWidth: '100vw' }}>
        {canEdit && (
          <Box sx={{ px: 2.5, pt: 0.5, pb: 0, display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box component="span" sx={{ fontSize: 11, color: 'text.disabled' }}>Edit metadata</Box>
            <MetadataEditor
              project={file.project} version={file.version} branch={file.branch ?? ''}
              onSave={(p, v, b) => checklist.updateMetadata({ project: p, version: v, branch: b })} />
          </Box>
        )}
        <NavTabs active={activeTab} onChange={setActiveTab} />
      </Box>

      {/* Banners */}
      {!checklist.hasBeenSaved && (
        <Alert
          severity="info"
          icon={<SaveOutlinedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />}
          sx={{
            mx: 2.5,
            mt: 1.5,
            borderRadius: 2,
            bgcolor: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            alignItems: 'center',
            fontSize: 12.5,
            boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
            '& .MuiAlert-message': { flex: 1, py: 0.25 },
          }}
          action={
            <Button
              size="small"
              variant="contained"
              onClick={handleExport}
              sx={{
                bgcolor: '#2563eb',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11.5,
                textTransform: 'none',
                px: 2,
                py: 0.5,
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              Export to Disk
            </Button>
          }
        >
          <strong>Unsaved Checklist:</strong> This session currently exists in your browser memory. Export your file to save a permanent local copy.
        </Alert>
      )}
      {checklist.storageWarning && (
        <Alert severity="warning" sx={{ mx: 2.5, mt: 1.5 }}>
          Auto-save unavailable — changes will be lost on close.
        </Alert>
      )}
      {checklist.sessionRestored && (
        <RestoredBanner
          onClear={() => {
            if (checklist.fileHash) clearSession(checklist.fileHash)
            checklist.clearSessionRestored()
          }}
          onDismiss={checklist.clearSessionRestored}
        />
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, width: '100%', maxWidth: '100vw', minWidth: 0 }}>
        {activeTab === 'checklist' ? (
          <Box sx={{ width: '100%', minWidth: 0 }}>
            <ChecklistView
              file={file}
              reviewedItems={checklist.reviewedItems}
              userCapability={settings.currentCapability}
              userName={settings.currentUser}
              userRole={settings.currentRole}
              onSaveResponse={(id: string, action: ReviewAction) => checklist.saveItemResponse(id, action)}
              onConfirm={(id: string, action: ReviewAction) => checklist.confirmItem(id, action)}
              onBatchUpdateStatus={checklist.batchUpdateStatus}
              onBatchConfirm={checklist.batchConfirm}
              onAssignItem={checklist.assignItem}
              onBatchAssign={checklist.batchAssign}
              onNavigateToAttestation={() => {
                const el = document.getElementById('attestation-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              onEditItem={canEdit ? (id: string) => setEditingItemId(id) : undefined}
            />
            {allRequiredComplete && (
              <Box sx={{ maxWidth: 860, mx: 'auto', px: 2.5, pb: 8 }}>
                <AttestationSummary
                  file={file}
                  items={checklist.reviewedItems}
                  fileHash={checklist.fileHash ?? ''}
                  userName={settings.currentUser}
                  userRole={settings.currentRole}
                />
              </Box>
            )}
          </Box>
        ) : (
          <DashboardView
            items={checklist.reviewedItems} fields={file.fields}
            filters={settings.dashboardFilters} userCapability={settings.currentCapability}
            onFiltersChange={settings.setDashboardFilters} />
        )}
      </Box>

      {/* Drawers */}
      {settingsOpen && (
        <SettingsPanel
          userCapability={settings.currentCapability}
          roleCapabilityMap={settings.roleCapabilityMap}
          fileHash={checklist.fileHash}
          onUpdateCapabilityMap={settings.updateCapabilityMap}
          onClearSession={() => { if (checklist.fileHash) clearSession(checklist.fileHash) }}
          onRestart={checklist.reset}
          onClose={() => setSettingsOpen(false)} />
      )}
      {editingItemId && editingItem && (
        <ItemEditor
          item={editingItem} fields={file.fields}
          categories={[...new Set(file.items.map(i => i.category))]}
          onSave={(item: ChecklistItem) => { checklist.editItem(item.id, item); setEditingItemId(null) }}
          onDelete={(id: string) => { checklist.deleteItem(id); setEditingItemId(null) }}
          onClose={() => setEditingItemId(null)} />
      )}
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
      Loading…
    </Box>
  )
}
