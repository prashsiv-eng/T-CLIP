# Tasks — T-CLIP Phase 1

## How to read this file

- Tasks are ordered — complete them top to bottom within each group.
- Each task references the requirement(s) it satisfies.
- Sub-tasks under a parent are atomic units of work; check them off as you go.
- A task marked **[BLOCKING]** must be complete before later tasks in its group can start.

---

## Group 1 — Project Scaffold

- [x] 1.1 Initialise the Vite + React + TypeScript project **[BLOCKING]**
  - [x] Run `npm create vite@latest t-clip -- --template react-ts`
  - [x] Install dependencies: `tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer`
  - [x] Configure `tailwind.config.ts` and `postcss.config.ts`
  - [x] Set `base: './'` in `vite.config.ts` (enables `file://` serving)
  - [x] Delete boilerplate (`App.css`, default assets, default `App.tsx` content)
  - [x] Verify `npm run dev` starts without errors

- [x] 1.2 Install and configure testing
  - [x] Install `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
  - [x] Configure `vitest` in `vite.config.ts` (environment: jsdom, setupFiles)
  - [x] Add `npm run test` and `npm run test:ui` scripts
  - [x] Write a smoke test that renders `<App />` without crashing

- [x] 1.3 Define all shared TypeScript types **[BLOCKING]**
  - [x] Create `src/types/checklist.ts` with all types from design.md: `ItemStatus`, `CapabilityLevel`, `FieldType`, `FileRules`, `FieldSchema`, `ChecklistItem`, `ChecklistFile`, `ReviewAction`, `ReviewedItem`, `Attestation`, `CapabilityRule`, `RoleCapabilityMap`, `DashboardFilters`
  - [x] Export all types from an `src/types/index.ts` barrel

---

## Group 2 — Core Utilities

- [x] 2.1 SHA-256 hashing (`src/utils/hash.ts`) **[BLOCKING]**
  - [x] Implement `sha256Hex(buffer: ArrayBuffer): Promise<string>` using `crypto.subtle.digest`
  - [x] Unit test: known input → expected hex string

- [x] 2.2 Capability resolution (`src/utils/capability.ts`)
  - [x] Implement `resolveCapability(role, map): CapabilityLevel`
  - [x] Implement `meetsMinimum(actual, required): boolean` using the `observer < full < approver < editor` order
  - [x] Ship default `RoleCapabilityMap` constant (observer/approver/owner/admin/editor patterns)
  - [x] Unit tests: each default pattern resolves to the expected level; unknown role → `full`; `meetsMinimum` ordering

- [x] 2.3 Dynamic field resolution (`src/utils/fields.ts`)
  - [x] Implement `resolveItemFields(item, allFields): FieldSchema[]`
  - [x] Implement `getRequiredFieldIds(fields, status): string[]`
  - [x] Implement `isItemComplete(item, fields, userCapability): boolean`
  - [x] Unit tests: item with `fields` override returns subset; missing `requiredWhen` field → incomplete; observer below `visibleTo` threshold excluded from required check

- [x] 2.4 File validation (`src/schema/validate.ts`)
  - [x] Implement `validateChecklistFile(raw: unknown): { valid: boolean; errors: string[] }`
  - [x] Validate: top-level required keys (`version`, `project`, `fields`, `items`); `fields` is array; each field has `id`, `label`, `type`; `items` is array; each item has `id`, `category`, `description`, `status`, `required`; `status` values are valid enum members; unknown properties are ignored
  - [x] Unit tests: valid minimal file → no errors; missing `project` → error; invalid item status → error; extra unknown property → ignored

- [x] 2.5 Session persistence (`src/utils/session.ts`)
  - [x] Implement `saveSession(hash, state): void` — `JSON.stringify` → `localStorage`; catch quota/unavailable errors silently; set a module-level `storageAvailable` flag on first failure
  - [x] Implement `restoreSession(hash): ReviewState | null` — returns `null` on any parse or access error
  - [x] Implement `clearSession(hash): void`
  - [x] Unit tests: save → restore round-trip; corrupt stored JSON → returns null; unavailable storage → does not throw

- [x] 2.6 Attestation export (`src/utils/export.ts`)
  - [x] Implement `buildAttestation(file, reviewedItems, fileHash): Attestation`
  - [x] Implement `downloadJSON(data: unknown, filename: string): void` — Blob → `<a download>` → click → revoke
  - [x] Unit test: `buildAttestation` produces correct shape; all items present; `sourceFileHash` matches input

- [x] 2.7 Template utilities (`src/utils/template.ts`)
  - [x] Implement `getBuiltInTemplates(): { id, name, description, file: ChecklistFile }[]` — reads from `src/templates/index.ts`
  - [x] Implement `exportChecklistJSON(file: ChecklistFile): void` — calls `downloadJSON` with `checklist.json`

---

## Group 3 — Built-in Templates

- [x] 3.1 Write four built-in template JSON files
  - [x] `src/templates/gxp-release.json`
  - [x] `src/templates/security-review.json`
  - [x] `src/templates/change-management.json`
  - [x] `src/templates/combined-release.json`
  - [x] `src/templates/index.ts` — exports the registry array

---

## Group 4 — Settings Hook

- [x] 4.1 Implement `useSettings` hook (`src/hooks/useSettings.ts`) **[BLOCKING]**
  - [x] State: `currentUser`, `currentRole`, `currentCapability`, `roleCapabilityMap`, `dashboardFilters`
  - [x] Load from `localStorage` on mount; persist every field on change
  - [x] Re-resolve `currentCapability` via `resolveCapability` whenever `currentRole` or `roleCapabilityMap` changes
  - [x] Expose: `setUser`, `setRole`, `updateCapabilityMap`, `setDashboardFilters`
  - [x] Unit test: role change triggers capability re-resolution; persisted value reloads on re-mount

---

## Group 5 — Home Screen

- [x] 5.1 `HomeScreen` component (`src/components/home/HomeScreen.tsx`) **[BLOCKING]**
  - [x] Identity form: name input (required) + role combobox (free text + suggested options: Reviewer, Approver, Observer, Project Owner)
  - [x] Show resolved capability badge next to role (e.g., "full", "approver") — updates live as user types
  - [x] New button: disabled until name + role filled; on click → transition to `template-choose`
  - [x] Open button: disabled until name + role filled; on click → open file picker
  - [x] File picker: `accept=".json"`; on file select → read as ArrayBuffer + text → validate → hash → restore or init session → transition to `view`
  - [x] Show validation errors inline if file is invalid
  - [x] Pre-fill identity from `localStorage` on mount

- [x] 5.2 `TemplateChooser` component (`src/components/home/TemplateChooser.tsx`)
  - [x] Card grid showing each built-in template: name, description, category tag list
  - [x] "Preview" button per card → opens read-only modal rendering the template's items grouped by category (no editing, no status controls)
  - [x] "Import template" button → file picker → validate → use as template
  - [x] "Select" button per card → transition to `meta-entry` with chosen template
  - [x] "Back" link → return to home

- [x] 5.3 Project metadata entry
  - [x] Inline form (not a separate page — can be a step within `TemplateChooser` or a small panel): `project` (text, required), `version` (text, required), `branch` (text, required)
  - [x] "Create Checklist" button disabled until all three filled
  - [x] On submit: set these fields on the template file copy → transition to `view`

---

## Group 6 — Layout & Navigation

- [x] 6.1 `Header` component (`src/components/layout/Header.tsx`) **[BLOCKING]**
  - [x] Sticky (`position: sticky; top: 0; z-index: high`)
  - [x] Left: T-CLIP logo/wordmark; project name, version, branch (from loaded file)
  - [x] Right: identity badge (name + role chip); click → opens `IdentityPopover`
  - [x] Right: settings icon → opens `SettingsPanel`
  - [x] Right: "Export" button (only when file loaded and user has `editor` or above capability) → calls `exportChecklistJSON`
  - [x] Show nothing if no file loaded

- [x] 6.2 `IdentityPopover` component (`src/components/layout/IdentityPopover.tsx`)
  - [x] Popover anchored to the identity badge in the header
  - [x] Name + role fields (same combobox as home screen); capability badge updates live
  - [x] Saves on blur/enter; closes on Escape or outside click
  - [x] `role="dialog"` + `aria-modal` + focus trap

- [x] 6.3 `NavTabs` component (`src/components/layout/NavTabs.tsx`)
  - [x] Two tabs: Checklist | Dashboard
  - [x] Active tab in component local state; resets to Checklist on new file load
  - [x] Keyboard accessible (arrow keys between tabs)

---

## Group 7 — Checklist View

- [x] 7.1 `ChecklistView` component (`src/components/checklist/ChecklistView.tsx`)
  - [x] Groups items by category using `CategoryGroup`
  - [x] Passes current `userCapability` and `checklistFile.fields` down to each item
  - [x] Shows item count and resolved/total progress per category group header

- [x] 7.2 `CategoryGroup` component (`src/components/checklist/CategoryGroup.tsx`)
  - [x] Collapsible (expanded by default)
  - [x] Header: category name, item count, completion badge
  - [x] If user has `editor` capability and `meetsMinimum(userCapability, structureEditableBy)`: show "Add item" button in header → opens `ItemEditor` panel in create mode

- [x] 7.3 `FieldRenderer` component (`src/components/checklist/FieldRenderer.tsx`) **[BLOCKING]**
  - [x] Props: `schema`, `value`, `onChange`, `readOnly`, `required`
  - [x] Implements type → control mapping: text/textarea/select/url/boolean/date + unknown fallback
  - [x] `textarea`: show character counter when `maxLength` set
  - [x] `url`: inline validation indicator (valid/invalid format)
  - [x] `select`: renders `schema.options` as `<option>` elements; empty first option when not required
  - [x] `readOnly`: renders as styled `<span>` with lock icon and `title` tooltip showing reason
  - [x] Unit tests: each field type renders correct element; readOnly renders span not input; url validation fires on blur

- [x] 7.4 `ChecklistItem` component (`src/components/checklist/ChecklistItem.tsx`) **[BLOCKING]**
  - [x] Shows: item ID, description, assignment badge, last actor name + role, current status badge
  - [x] Assignment match highlight: if `item.assignedTo` matches `currentUser` name or `currentRole` (case-insensitive substring) → highlighted border/background
  - [x] **Status control**: radio group (pass / fail / na) — disabled when `!meetsMinimum(userCapability, item.statusEditableBy ?? 'full')` with tooltip
  - [x] **Dynamic form**: calls `resolveItemFields(item, allFields)`, filters by `visibleTo`, renders via `FieldRenderer` with `readOnly` based on `editableBy`
  - [x] Progressive disclosure: required-for-status fields expanded; others under "Add details" expander
  - [x] **Approver controls**: if `meetsMinimum(userCapability, 'approver')` AND `history.length > 0` AND `confirmedBy === null` → show "Confirm" + "Override" buttons; Override opens a justification field (textarea, required) before saving
  - [x] **Editor controls**: if structural edit capability met → show pencil icon → opens `ItemEditor` panel in edit mode
  - [x] "Save response" button: validates required fields for current status; on success appends `ReviewAction` to `history`, triggers session auto-save
  - [x] Shows action history (collapsed by default, expandable): each `ReviewAction` as a timestamped row with actor, role, status, field values summary
  - [x] Unit tests: observer sees no status toggle; full sees status toggle; approver sees confirm button after a history entry; required field missing → save blocked

---

## Group 8 — Editor Components (editor capability)

- [x] 8.1 `ItemEditor` panel (`src/components/editor/ItemEditor.tsx`)
  - [x] Slide-in panel (`role="dialog"` + focus trap)
  - [x] Fields: ID (text), category (combobox from existing categories + new), description (textarea), `required` toggle, `statusEditableBy` (capability select), `assignedTo.role` (text), `assignedTo.name` (text)
  - [x] Pre-fill values section: one input per field in the schema, labelled with `field.label`
  - [x] Create mode: "Add Item" button; Edit mode: "Save" + "Delete item" (with confirmation)
  - [x] On save: updates `checklistFile.items`; marks `isDirty = true`

- [x] 8.2 `FieldSchemaEditor` component (`src/components/editor/FieldSchemaEditor.tsx`)
  - [x] Listed in a sidebar or panel, accessible from a settings-style control within the view (visible only to editor capability)
  - [x] Each field row: id, label, type badge, requiredWhen summary, editableBy, visibleTo
  - [x] "Add field" → inline form: id, label, type selector, options (if select), requiredWhen checkboxes (pass/fail/na), editableBy select, visibleTo select, maxLength
  - [x] "Edit" / "Delete" per row; delete warns if any item has a pre-filled value for this field
  - [x] On change: updates `checklistFile.fields`; marks `isDirty = true`

- [x] 8.3 `MetadataEditor` component (`src/components/editor/MetadataEditor.tsx`)
  - [x] Inline edit of `project`, `version`, `branch` in the header area (visible only to editor capability)
  - [x] Click-to-edit; saves on blur/Enter

- [x] 8.4 `RulesEditor` component (`src/components/editor/RulesEditor.tsx`)
  - [x] Accessible from settings panel (editor capability only)
  - [x] Fields: `structureEditableBy` (capability select), `enforcedAssignment` (toggle)

---

## Group 9 — Dashboard

- [x] 9.1 Dashboard stats utilities (`src/utils/dashboardStats.ts`)
  - [x] `computeSummary(items, fields, userCapability): Summary` — `{ total, pass, fail, na, pending, completionPercent }`; `completionPercent` = resolved required items / total required × 100
  - [x] `getPendingResponses(items): ReviewedItem[]` — `history.length === 0`
  - [x] `getPendingReview(items): ReviewedItem[]` — `history.length > 0 && confirmedBy === null`
  - [x] `getLeaderboard(items): LeaderboardEntry[]` — per actor: count of items they last acted on that remain unconfirmed; sort descending
  - [x] `applyFilters(items, filters): ReviewedItem[]` — status, categories, role substring, requiredOnly
  - [x] Unit tests: all five functions with representative inputs

- [x] 9.2 `useDashboard` hook (`src/hooks/useDashboard.ts`)
  - [x] Derives all dashboard stats from `reviewedItems` and current `dashboardFilters`
  - [x] Memoised (useMemo) — recomputes only when items or filters change

- [x] 9.3 `DashboardFilters` component (`src/components/dashboard/DashboardFilters.tsx`)
  - [x] Status dropdown (all/pending/pass/fail/na)
  - [x] Category multi-select checkboxes (populated from loaded file's categories)
  - [x] Role text input (free-text substring filter, debounced 200 ms)
  - [x] "Required only" toggle
  - [x] "Clear filters" button
  - [x] All changes update `dashboardFilters` in `useSettings` immediately

- [x] 9.4 `SummaryCards` component (`src/components/dashboard/SummaryCards.tsx`)
  - [x] Six cards: Total, Pass (green), Fail (red), N/A (grey), Pending (amber), Completion %
  - [x] Completion % shown as a progress bar beneath the card
  - [x] Cards update reactively as filters change

- [x] 9.5 `PendingResponsesList` component (`src/components/dashboard/PendingResponsesList.tsx`)
  - [x] Items with `history.length === 0`, grouped by category then by `assignedTo.role`
  - [x] Each row: item ID, description, assignment

- [x] 9.6 `PendingReviewList` component (`src/components/dashboard/PendingReviewList.tsx`)
  - [x] Items with a response but no `confirmedBy`
  - [x] Each row: item ID, last actor name + role, status, timestamp

- [x] 9.7 `ActionItemLeaderboard` component (`src/components/dashboard/ActionItemLeaderboard.tsx`)
  - [x] Ranked list: actor name, role, outstanding item count
  - [x] Top 3 highlighted

- [x] 9.8 `DashboardView` root (`src/components/dashboard/DashboardView.tsx`)
  - [x] Composes `DashboardFilters` + `SummaryCards` + `PendingResponsesList` + `PendingReviewList` + `ActionItemLeaderboard`

---

## Group 10 — Attestation

- [x] 10.1 `AttestationSummary` component (`src/components/attestation/AttestationSummary.tsx`)
  - [x] Read-only. Rendered inline at the bottom of `ChecklistView` when `allRequiredComplete` is true
  - [x] Groups items by status (pass / fail / na); `fail` section rendered first with a warning banner
  - [x] Each item row: ID, description, final status, field values (label: value pairs), last actor, confirmation record
  - [x] Shows source file SHA-256 hash and export timestamp (computed at render time)
  - [x] "Export Attestation" button → calls `buildAttestation` then `downloadJSON`

- [x] 10.2 Attestation readiness guard in `useChecklist`
  - [x] Compute `allRequiredComplete: boolean` — all items where `required === true` satisfy `isItemComplete`
  - [x] Expose as a derived value; `AttestationSummary` conditionally rendered based on it
  - [x] Unit test: one pending required item → false; all resolved → true

---

## Group 11 — Settings Panel

- [x] 11.1 `SettingsPanel` component (`src/components/settings/SettingsPanel.tsx`)
  - [x] Slide-in panel (`role="dialog"` + focus trap); opened from settings icon in `Header`
  - [x] **Capability map editor**: list of `{ pattern, capability }` rules; add (pattern text + capability select), remove, drag-to-reorder; changes take effect immediately
  - [x] **Session management**: "Clear saved session" button (clears `localStorage` entry for current file hash); shows "No saved session" if none exists
  - [x] **Editor section** (visible only when `meetsMinimum(userCapability, 'editor')`): links/buttons to open `FieldSchemaEditor` and `RulesEditor`
  - [x] `FieldSchemaEditor` and `RulesEditor` can be opened as nested panels within the settings panel

---

## Group 12 — Session Auto-save & Restore

- [x] 12.1 Wire auto-save in `useChecklist`
  - [x] `useEffect` on `reviewedItems` → call `saveSession(fileHash, reviewedState)` (no-op if `fileHash` is null)
  - [x] On `localStorage` write failure: set `storageWarningShown` flag; show one-time toast "Auto-save unavailable — changes will be lost on close"

- [x] 12.2 Session restore on file load
  - [x] After hashing a loaded file, call `restoreSession(hash)`
  - [x] If result is non-null: restore `reviewedItems` from saved state; set `sessionRestored = true`
  - [x] `RestoredBanner` component (`src/components/review/RestoredBanner.tsx`): non-blocking `role="status"` banner "Review session restored — [Clear and start fresh]"

---

## Group 13 — Wire App Together

- [x] 13.1 `useChecklist` hook (`src/hooks/useChecklist.ts`)
  - [x] Manages: `phase`, `source`, `rawFileBytes`, `fileHash`, `checklistFile`, `reviewedItems`, `isDirty`, `validationErrors`, `sessionRestored`
  - [x] Actions: `loadFile(bytes, text)`, `selectTemplate(file)`, `setMetadata(project, version, branch)`, `saveItemResponse(itemId, action)`, `confirmItem(itemId, action)`, `editItem(itemId, patch)`, `addItem(item)`, `deleteItem(itemId)`, `updateFields(fields)`, `updateRules(rules)`, `reset()`
  - [x] `saveItemResponse` appends to `history`; `confirmItem` sets `confirmedBy`; both trigger auto-save

- [x] 13.2 `App.tsx` router
  - [x] Renders `HomeScreen` when `phase === 'home'`
  - [x] Renders `TemplateChooser` when `phase === 'template-choose'`
  - [x] Renders metadata entry step when `phase === 'meta-entry'`
  - [x] Renders `Header` + `NavTabs` + active tab content when `phase === 'view'`
  - [x] `NavTabs` switches between `ChecklistView` and `DashboardView`

---

## Group 14 — Accessibility Pass

- [x] 14.1 Keyboard navigation audit
  - [x] Tab order correct through: identity form → New/Open → checklist items → status toggles → field inputs → save button
  - [x] All modals/panels trap focus on open, restore on close
  - [x] NavTabs navigable with arrow keys
  - [x] Drag-and-drop in ItemListEditor has keyboard alternative (move up/down buttons)

- [x] 14.2 ARIA audit
  - [x] All icon-only buttons have `aria-label`
  - [x] Status badges have `aria-label` (not just color/icon)
  - [x] Disabled controls have `aria-disabled="true"` and `title` tooltip
  - [x] `role="alert"` on validation error banners; `role="status"` on restore banner

- [x] 14.3 Colour contrast
  - [x] All text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large)
  - [x] Status colours (pass=green, fail=red, na=grey, pending=amber) each paired with icon + text label

---

## Group 15 — Build Verification & Cleanup

- [x] 15.1 Full test run
  - [x] All unit tests pass (`npm run test`)
  - [x] No TypeScript errors (`npm run build` succeeds)

- [x] 15.2 Static build verification
  - [x] `npm run build` produces `dist/`
  - [x] Open `dist/index.html` directly from `file://` in a browser — app loads and functions
  - [x] Open via `npm run preview` — app loads and functions

- [x] 15.3 Smoke test the full workflow
  - [x] New → select "GxP Release" template → fill metadata → verify editor controls visible with "Project Owner" role
  - [x] Switch to "Reviewer" role → verify structural edit controls hidden; item response form visible
  - [x] Fill responses on 3 items → reload page → verify session restored
  - [x] Switch to "Approver" role → confirm one item → verify confirmation recorded
  - [x] Complete all required items → verify attestation summary appears → export `checklist-attestation.json` → verify JSON is valid and contains expected fields
  - [x] Open → load the exported `checklist.json` from the New flow → verify it loads correctly

- [x] 15.4 Remove all `console.log` debug statements and unused imports
