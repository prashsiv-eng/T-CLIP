# Design — T-CLIP Phase 1 (Frontend Checklist App)

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite 5 | Fast HMR, first-class TypeScript, wide ecosystem |
| Language | TypeScript | Type safety across schema, capability rules, attestation |
| Styling | Tailwind CSS v3 | Utility-first, no runtime overhead |
| File hashing | Web Crypto API (`SubtleCrypto`) | Native, no dependency, SHA-256 |
| JSON parsing | Native `JSON.parse` | No extra library |
| Storage | `localStorage` | Identity, settings, capability map, session state |
| Testing | Vitest + React Testing Library | Same Vite pipeline |
| Build output | Static files (`dist/`) | Works from `file://` or any static server |

No backend. No authentication. No external network calls after initial page load.

---

## Project Structure

```
T-CLIP/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx                        # Home screen + checklist view router
    ├── types/
    │   └── checklist.ts               # All shared TypeScript types
    ├── schema/
    │   └── validate.ts                # File validation: returns { valid, errors[] }
    ├── templates/
    │   ├── index.ts                   # Built-in template registry
    │   ├── gxp-release.json
    │   ├── security-review.json
    │   ├── change-management.json
    │   └── combined-release.json
    ├── hooks/
    │   ├── useChecklist.ts            # All checklist state: file, items, phase
    │   ├── useSettings.ts             # localStorage: identity, capability map, filters
    │   └── useDashboard.ts            # Derived stats + filter logic (read-only)
    ├── components/
    │   ├── home/
    │   │   ├── HomeScreen.tsx         # Identity selector + New + Open
    │   │   └── TemplateChooser.tsx    # Built-in grid + import + preview modal
    │   ├── layout/
    │   │   ├── Header.tsx             # Sticky: project/branch/version + inline identity
    │   │   ├── IdentityPopover.tsx    # Inline name+role editor in header
    │   │   └── NavTabs.tsx            # Checklist | Dashboard tab
    │   ├── checklist/
    │   │   ├── ChecklistView.tsx      # Category groups
    │   │   ├── CategoryGroup.tsx      # Collapsible group
    │   │   ├── ChecklistItem.tsx      # Status + dynamic form + editor controls
    │   │   └── FieldRenderer.tsx      # Renders one FieldSchema as correct input
    │   ├── editor/
    │   │   ├── MetadataEditor.tsx     # project / version / branch inline edit
    │   │   ├── FieldSchemaEditor.tsx  # Add/edit/delete fields schema
    │   │   ├── ItemEditor.tsx         # Slide-in panel: all item properties
    │   │   └── RulesEditor.tsx        # structureEditableBy, enforcedAssignment
    │   ├── dashboard/
    │   │   ├── DashboardView.tsx
    │   │   ├── SummaryCards.tsx
    │   │   ├── PendingResponsesList.tsx
    │   │   ├── PendingReviewList.tsx
    │   │   ├── ActionItemLeaderboard.tsx
    │   │   └── DashboardFilters.tsx
    │   ├── attestation/
    │   │   ├── AttestationSummary.tsx
    │   │   └── ExportButton.tsx
    │   └── settings/
    │       └── SettingsPanel.tsx      # Capability map editor, clear session
    └── utils/
        ├── hash.ts                    # SHA-256 via SubtleCrypto
        ├── capability.ts              # resolveCapability, meetsMinimum
        ├── fields.ts                  # resolveItemFields, getRequiredFieldIds, isItemComplete
        ├── export.ts                  # Build + download attestation JSON
        ├── session.ts                 # localStorage save/restore/clear
        ├── dashboardStats.ts          # Pure: computeSummary, leaderboard, applyFilters
        └── template.ts                # Built-in template loader + JSON blob export
```

---

## Data Types

```typescript
// src/types/checklist.ts

export type ItemStatus = 'pending' | 'pass' | 'fail' | 'na';
export type CapabilityLevel = 'observer' | 'full' | 'approver' | 'editor';
export type FieldType = 'text' | 'textarea' | 'select' | 'url' | 'boolean' | 'date';

// ── Schema types (live in checklist.json) ────────────────────────────────────

export interface FileRules {
  structureEditableBy?: CapabilityLevel; // default: 'editor'
  enforcedAssignment?: boolean;           // default: false
}

export interface FieldSchema {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];           // for 'select'
  requiredWhen?: ItemStatus[];  // absent/[] = always optional
  editableBy?: CapabilityLevel; // minimum to edit; default: 'full'
  visibleTo?: CapabilityLevel;  // minimum to see; default: 'observer'
  maxLength?: number;
}

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  status: ItemStatus;
  required: boolean;
  statusEditableBy?: CapabilityLevel;       // default: 'full'
  assignedTo?: { role?: string; name?: string };
  fields?: string[];                         // subset of top-level field ids
  values?: Record<string, string>;           // pre-filled values
}

export interface ChecklistFile {
  version: string;
  project: string;
  branch?: string;
  rules?: FileRules;
  fields: FieldSchema[];
  items: ChecklistItem[];
}

// ── Review types (app state + attestation) ───────────────────────────────────

export interface ReviewAction {
  actorName: string;
  role: string;
  status: ItemStatus;
  fieldValues: Record<string, string>;
  timestamp: string;                   // ISO 8601 UTC
}

export interface ReviewedItem extends ChecklistItem {
  history: ReviewAction[];
  confirmedBy: ReviewAction | null;
}

export interface Attestation {
  schemaVersion: '1.0';
  project: string;
  branch: string | null;
  checklistVersion: string;
  sourceFileHash: string;
  exportedAt: string;
  items: ReviewedItem[];
}

// ── Settings types ────────────────────────────────────────────────────────────

export interface CapabilityRule {
  pattern: string;            // case-insensitive substring match
  capability: CapabilityLevel;
}

export interface RoleCapabilityMap {
  rules: CapabilityRule[];
  defaultCapability: CapabilityLevel; // default: 'full'
}

export interface DashboardFilters {
  status: ItemStatus | 'all';
  categories: string[];
  role: string;               // substring match; '' = all
  requiredOnly: boolean;
}
```

---

## Capability System

### Ordering
```
observer < full < approver < editor
```

### Resolution (`utils/capability.ts`)
```typescript
// Resolve capability from a free-text role string
export function resolveCapability(
  role: string,
  map: RoleCapabilityMap
): CapabilityLevel {
  const lower = role.toLowerCase();
  for (const rule of map.rules) {
    if (lower.includes(rule.pattern.toLowerCase())) return rule.capability;
  }
  return map.defaultCapability;
}

// True if actual >= required (in observer < full < approver < editor order)
export function meetsMinimum(
  actual: CapabilityLevel,
  required: CapabilityLevel
): boolean { ... }
```

**Default capability map:**
```json
{
  "rules": [
    { "pattern": "observer",  "capability": "observer" },
    { "pattern": "approver",  "capability": "approver" },
    { "pattern": "owner",     "capability": "editor"   },
    { "pattern": "admin",     "capability": "editor"   },
    { "pattern": "editor",    "capability": "editor"   }
  ],
  "defaultCapability": "full"
}
```

### Access checks per action

| Action | Minimum required |
|---|---|
| View field | `field.visibleTo` (default `observer`) |
| Edit field value | `field.editableBy` (default `full`) |
| Change item status | `item.statusEditableBy` (default `full`) |
| Confirm/override response | `approver` (hardcoded) |
| Edit checklist structure | `file.rules.structureEditableBy` (default `editor`) |

Rules restrict only — `meetsMinimum(userCapability, requiredCapability)` must be true. A rule can never grant more than the user's resolved level.

---

## Application State

### `useChecklist`
```
ChecklistState
├── phase: 'home' | 'template-choose' | 'meta-entry' | 'view'
├── source: 'new' | 'open' | null
├── rawFileBytes: ArrayBuffer | null    (for hashing)
├── fileHash: string | null
├── checklistFile: ChecklistFile | null (mutable when editor capability)
├── reviewedItems: ReviewedItem[]
├── isDirty: boolean                    (unsaved structural edits)
├── validationErrors: string[]
└── sessionRestored: boolean
```

### Phase transitions
- `home → template-choose`: user clicks New.
- `home → view`: user clicks Open and file loads successfully.
- `template-choose → meta-entry`: user selects a template.
- `meta-entry → view`: user submits valid project metadata.
- `view → home`: user clicks Back / opens new file (confirms if unsaved changes).

### `useSettings`
```
SettingsState
├── currentUser: string
├── currentRole: string
├── currentCapability: CapabilityLevel   (re-resolved on role change)
├── roleCapabilityMap: RoleCapabilityMap
└── dashboardFilters: DashboardFilters
```

---

## Key Component Behaviours

### `HomeScreen`
- Identity form (name + role combobox with suggestions) at the top. New/Open disabled until both fields are non-empty.
- On role change: immediately re-resolves capability and updates the UI.
- New → transitions to `template-choose`.
- Open → file picker; on valid file → `view`.

### `Header`
- Sticky. Always shows project name, version, branch, and current user name + role badge.
- Clicking the identity badge opens `IdentityPopover` (inline — no full-screen takeover).
- `IdentityPopover`: name + role fields, saves on blur/enter, re-resolves capability immediately.

### `TemplateChooser`
- Card grid of built-in templates with name, description, category tags.
- "Preview" opens a read-only modal rendering the template as a checklist.
- "Import template" opens a file picker; valid `.json` is loaded as the template.
- On select: transition to `meta-entry`.

### `ChecklistItem`
Single component for all capability levels. Access checks run at render time using `meetsMinimum`.

**Status control:**
- If `meetsMinimum(userCapability, item.statusEditableBy ?? 'full')` → interactive toggle.
- Otherwise → read-only badge with tooltip "Requires [X] capability".

**Dynamic response form:**
1. `resolveItemFields(item, checklistFile.fields)` → ordered `FieldSchema[]`.
2. For each schema: check `meetsMinimum(userCapability, field.visibleTo ?? 'observer')` — skip if below.
3. Render via `FieldRenderer` with `readOnly = !meetsMinimum(userCapability, field.editableBy ?? 'full')`.
4. Fields where `requiredWhen` includes current status → shown expanded, marked required.
5. Other fields → collapsed under "Add details".
6. On save: append `ReviewAction` to `history`; trigger session auto-save.

**Approver controls:**
- If `meetsMinimum(userCapability, 'approver')` and `history.length > 0` and `confirmedBy === null` → show "Confirm" / "Override" buttons.

**Editor controls:**
- If `meetsMinimum(userCapability, file.rules?.structureEditableBy ?? 'editor')` → show edit (pencil) icon per item → opens `ItemEditor` panel.
- Category group headers show "Add item" button.

### `FieldRenderer`
Stateless. Inputs:
- `schema: FieldSchema`
- `value: string`
- `onChange: (v: string) => void`
- `readOnly: boolean`
- `required: boolean`

Type → control mapping:
| Type | Control |
|---|---|
| `text` | `<input type="text">` + optional maxLength counter |
| `textarea` | `<textarea>` + char counter |
| `select` | `<select>` with `schema.options` |
| `url` | `<input type="url">` + inline format validation |
| `boolean` | styled checkbox toggle |
| `date` | `<input type="date">` |
| unknown | falls back to `textarea` |

When `readOnly`, renders as a styled `<span>` with a locked icon and tooltip.

### `SettingsPanel`
- Capability map editor: list of `{ pattern, capability }` rules, add/remove/reorder, immediate effect.
- "Clear saved session" — removes `localStorage` entry for current file hash.
- "Export checklist.json" — available to `editor` capability; exports current `checklistFile` state.

---

## Key Algorithms

### SHA-256 (`utils/hash.ts`)
```typescript
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### Dynamic Field Resolution (`utils/fields.ts`)
```typescript
resolveItemFields(item: ChecklistItem, allFields: FieldSchema[]): FieldSchema[]
// item.fields present → filter allFields to that subset in declared order
// absent → return allFields

getRequiredFieldIds(fields: FieldSchema[], status: ItemStatus): string[]
// fields where requiredWhen includes status

isItemComplete(item: ReviewedItem, fields: FieldSchema[], userCapability: CapabilityLevel): boolean
// status !== 'pending'
// AND all fields visible to userCapability with requiredWhen matching status have non-empty values
```

### Session Persistence (`utils/session.ts`)
```typescript
const KEY = (hash: string) => `tclip_session_${hash}`;

saveSession(hash, state): void      // try/catch: silent on quota error, show one-time warning
restoreSession(hash): ReviewState | null
clearSession(hash): void
```
Auto-save triggered via `useEffect` on `reviewedItems` change in `useChecklist`.

### Dashboard Stats (`utils/dashboardStats.ts`)
```typescript
computeSummary(items, fields, userCapability): Summary
getPendingResponses(items): ReviewedItem[]   // history.length === 0
getPendingReview(items): ReviewedItem[]      // history > 0 && confirmedBy === null
getLeaderboard(items): LeaderboardEntry[]    // [{ actorName, role, outstandingCount }] desc
applyFilters(items, filters): ReviewedItem[]
```

---

## Routing

No React Router. `phase` in `useChecklist` drives the top-level render.

| Phase | Rendered |
|---|---|
| `home` | `HomeScreen` (identity + New/Open) |
| `template-choose` | `TemplateChooser` |
| `meta-entry` | `MetadataEditor` (project/version/branch form) |
| `view` | `Header` (sticky) + `NavTabs` → `ChecklistView` or `DashboardView` |

`AttestationSummary` + `ExportButton` are rendered within `ChecklistView` when all required items are complete — not a separate phase.

---

## Accessibility

- Status toggles: `<fieldset>` + `<legend>` + `<input type="radio">` — keyboard native.
- Status badges: color + icon + `aria-label`.
- Disabled controls: `aria-disabled` + `title` tooltip.
- `SettingsPanel`, `ItemEditor`, template preview: `role="dialog"` + `aria-modal` + focus trap.
- `IdentityPopover`: `role="dialog"` + focus trap; closes on Escape.
- Minimum touch/click target: 44 × 44 px.

---

## Build & Deployment

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # → dist/
npm run preview   # preview prod build locally
```

`vite.config.ts` sets `base: './'` — `dist/` works from `file://` or any static server.

---

## Phase 2 Migration Surface

| Phase 1 | Phase 2 replacement |
|---|---|
| `HomeScreen` identity free-text | SSO login redirect |
| `useSettings` role from `localStorage` | JWT/OIDC token claims |
| `CapabilityRule` pattern map | Server-side RBAC policy |
| `FileLoader` manual upload | API fetch by PR/ticket ID |
| `utils/export.ts` local download | POST to backend + local download |
| `utils/session.ts` localStorage | Server-side session |
