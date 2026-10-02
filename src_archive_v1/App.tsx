import { Alert, Box } from '@mui/material'
import { useState } from 'react'
import { AttestationSummary } from './components/attestation/AttestationSummary'
import { ChecklistView } from './components/checklist/ChecklistView'
import { DashboardView } from './components/dashboard/DashboardView'
import { ItemEditor } from './components/editor/ItemEditor'
import { MetadataEditor } from './components/editor/MetadataEditor'
import { HomeScreen } from './components/home/HomeScreen'
import { MetaEntryForm } from './components/home/MetaEntryForm'
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const file = checklist.checklistFile
  const allRequiredComplete = file
    ? checklist.reviewedItems.filter(i => i.required).every(i => isItemComplete(i, file.fields, settings.currentCapability))
    : false
  const canEdit = file ? meetsMinimum(settings.currentCapability, file.rules?.structureEditableBy ?? 'editor') : false
  const editingItem = editingItemId ? checklist.reviewedItems.find(i => i.id === editingItemId) : undefined

  if (checklist.phase === 'home') return (
    <HomeScreen name={settings.currentUser} role={settings.currentRole} capability={settings.currentCapability}
      onNameChange={settings.setUser} onRoleChange={settings.setRole}
      onNew={checklist.startNew} onOpen={(b, t) => checklist.loadFile(b, t)}
      validationErrors={checklist.validationErrors} />
  )
  if (checklist.phase === 'template-choose') return <TemplateChooser onSelect={checklist.selectTemplate} onBack={checklist.reset} />
  if (checklist.phase === 'meta-entry') return (
    <MetaEntryForm onSubmit={(p, v, b) => checklist.setMetadata(p, v, b)} onBack={checklist.reset} />
  )

  if (checklist.phase === 'view' && file) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header
        file={file} userName={settings.currentUser} userRole={settings.currentRole}
        capability={settings.currentCapability} onNameChange={settings.setUser} onRoleChange={settings.setRole}
        onSettingsOpen={() => setSettingsOpen(true)}
        onExport={canEdit ? () => exportChecklistFile(file) : undefined}
      />

      {/* Sub-header: metadata edit + tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        {canEdit && (
          <Box sx={{ px: 2.5, pt: 0.75, pb: 0, display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box component="span" sx={{ fontSize: 11, color: 'text.disabled' }}>Edit metadata</Box>
            <MetadataEditor project={file.project} version={file.version} branch={file.branch ?? ''}
              onSave={(p, v, b) => checklist.updateMetadata({ project: p, version: v, branch: b })} />
          </Box>
        )}
        <NavTabs active={activeTab} onChange={setActiveTab} />
      </Box>

      {/* Banners */}
      {checklist.storageWarning && (
        <Alert severity="warning" sx={{ mx: 2.5, mt: 1.5 }}>Auto-save unavailable — changes will be lost on close.</Alert>
      )}
      {checklist.sessionRestored && (
        <RestoredBanner onClear={() => { if (checklist.fileHash) clearSession(checklist.fileHash); checklist.clearSessionRestored() }} />
      )}

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        {activeTab === 'checklist' ? (
          <Box>
            <ChecklistView
              file={file} reviewedItems={checklist.reviewedItems}
              userCapability={settings.currentCapability} userName={settings.currentUser} userRole={settings.currentRole}
              onSaveResponse={(id: string, action: ReviewAction) => checklist.saveItemResponse(id, action)}
              onConfirm={(id: string, action: ReviewAction) => checklist.confirmItem(id, action)}
              onEditItem={canEdit ? (id: string) => setEditingItemId(id) : undefined}
            />
            {allRequiredComplete && (
              <Box sx={{ maxWidth: 860, mx: 'auto', px: 2.5, pb: 8 }}>
                <AttestationSummary file={file} items={checklist.reviewedItems} fileHash={checklist.fileHash ?? ''} />
              </Box>
            )}
          </Box>
        ) : (
          <DashboardView
            items={checklist.reviewedItems} fields={file.fields}
            filters={settings.dashboardFilters} userCapability={settings.currentCapability}
            onFiltersChange={settings.setDashboardFilters}
          />
        )}
      </Box>

      {/* Drawers & modals */}
      {settingsOpen && (
        <SettingsPanel
          userCapability={settings.currentCapability} roleCapabilityMap={settings.roleCapabilityMap}
          fileHash={checklist.fileHash} onUpdateCapabilityMap={settings.updateCapabilityMap}
          onClearSession={() => { if (checklist.fileHash) clearSession(checklist.fileHash) }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {editingItemId && editingItem && (
        <ItemEditor
          item={editingItem} fields={file.fields}
          categories={[...new Set(file.items.map(i => i.category))]}
          onSave={(item: ChecklistItem) => { checklist.editItem(item.id, item); setEditingItemId(null) }}
          onDelete={(id: string) => { checklist.deleteItem(id); setEditingItemId(null) }}
          onClose={() => setEditingItemId(null)}
        />
      )}
    </Box>
  )

  return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>Loading…</Box>
}
