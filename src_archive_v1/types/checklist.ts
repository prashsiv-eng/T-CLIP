// ── Status & Capability enums ─────────────────────────────────────────────────

export type ItemStatus = 'pending' | 'pass' | 'fail' | 'na'

export type CapabilityLevel = 'observer' | 'contributor' | 'reviewer' | 'approver' | 'editor'

export type FieldType = 'text' | 'textarea' | 'select' | 'url' | 'boolean' | 'date'

// ── Schema types (live in checklist.json) ────────────────────────────────────

export interface FileRules {
  /** Minimum capability to edit checklist structure. Default: 'editor' */
  structureEditableBy?: CapabilityLevel
  /** If true, only the assigned role/name can respond to an item. Default: false */
  enforcedAssignment?: boolean
}

export interface FieldSchema {
  id: string
  label: string
  type: FieldType
  /** For type 'select' */
  options?: string[]
  /** Statuses that make this field mandatory. Absent or [] = always optional */
  requiredWhen?: ItemStatus[]
  /** Minimum capability to fill/edit this field. Default: 'reviewer' */
  editableBy?: CapabilityLevel
  /** Minimum capability to see this field. Default: 'observer' */
  visibleTo?: CapabilityLevel
  /** Character limit for text/textarea */
  maxLength?: number
}

export interface ChecklistItem {
  id: string
  category: string
  description: string
  status: ItemStatus
  required: boolean
  /** Minimum capability to change this item's status. Default: 'reviewer' */
  statusEditableBy?: CapabilityLevel
  assignedTo?: { role?: string; name?: string }
  /** Subset of top-level field ids to show for this item. Absent = all */
  fields?: string[]
  /** Pre-filled field values keyed by field id */
  values?: Record<string, string>
}

export interface ChecklistFile {
  version: string
  project: string
  branch?: string
  rules?: FileRules
  fields: FieldSchema[]
  items: ChecklistItem[]
}

// ── Review types (app state + attestation) ───────────────────────────────────

export interface ReviewAction {
  actorName: string
  role: string
  status: ItemStatus
  /** All field values filled during this action, keyed by FieldSchema.id */
  fieldValues: Record<string, string>
  /** ISO 8601 UTC */
  timestamp: string
}

export interface ReviewedItem extends ChecklistItem {
  /** All actions on this item, newest last */
  history: ReviewAction[]
  /** Set by an actor with approver capability */
  confirmedBy: ReviewAction | null
}

export interface Attestation {
  schemaVersion: '1.0'
  project: string
  branch: string | null
  checklistVersion: string
  /** SHA-256 hex of the raw source file bytes */
  sourceFileHash: string
  /** ISO 8601 UTC */
  exportedAt: string
  items: ReviewedItem[]
}

// ── Settings types ────────────────────────────────────────────────────────────

export interface CapabilityRule {
  /** Case-insensitive substring matched against the user's role string */
  pattern: string
  capability: CapabilityLevel
}

export interface RoleCapabilityMap {
  rules: CapabilityRule[]
  /** Fallback when no rule matches. Default: 'reviewer' */
  defaultCapability: CapabilityLevel
}

export interface DashboardFilters {
  status: ItemStatus | 'all'
  /** Empty array = all categories */
  categories: string[]
  /** Substring match against role; '' = all */
  role: string
  requiredOnly: boolean
}
