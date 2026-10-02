// ── Status & Role enums ───────────────────────────────────────────────────

export type ItemStatus =
  | 'not-started'
  | 'in-progress'
  | 'blocked'
  | 'in-review'
  | 'pass'
  | 'failed'
  | 'na'

export type RoleType =
  | 'read-only'
  | 'editor'
  | 'reviewer'
  | 'approver'
  | 'sign-off'
  | 'master'

/** Synonym for RoleType for capability checks */
export type CapabilityLevel = RoleType

export type FieldType = 'text' | 'textarea' | 'select' | 'url' | 'boolean' | 'date'

// ── Schema types (live in checklist.json) ────────────────────────────────────

export interface PersonaDefinition {
  id: string
  label: string
  role: RoleType
  description?: string
}

export interface FileRules {
  /** Minimum role to edit checklist structure. Default: 'master' */
  structureEditableBy?: RoleType
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
  /** Minimum role to fill/edit this field. Default: 'editor' */
  editableBy?: RoleType
  /** Minimum role to see this field. Default: 'read-only' */
  visibleTo?: RoleType
  /** Character limit for text/textarea */
  maxLength?: number
}

export interface ChecklistItem {
  id: string
  category: string
  description: string
  status: ItemStatus
  required: boolean
  /** Minimum role to change this item's review status. Default: 'reviewer' */
  statusEditableBy?: RoleType
  assignedTo?: { role?: string; name?: string }
  /** Subset of top-level field ids to show for this item. Absent = all */
  fields?: string[]
  /** Pre-filled field values keyed by field id */
  values?: Record<string, string>
}

export interface UserPersona {
  name: string
  role: string
}

export interface ChecklistFile {
  version: string
  project: string
  branch?: string
  rules?: FileRules
  roles?: string[]
  personas?: PersonaDefinition[]
  users?: UserPersona[]
  fields: FieldSchema[]
  items: ChecklistItem[]
  attestation?: Attestation
}

// ── Review types (app state + attestation) ───────────────────────────────────

export interface ReviewAction {
  actorName: string
  role: string
  status: ItemStatus
  /** All field values filled during this action, keyed by FieldSchema.id */
  fieldValues?: Record<string, string>
  /** Optional review note or reasoning */
  notes?: string
  /** ISO 8601 UTC */
  timestamp: string
}

export interface ReviewedItem extends ChecklistItem {
  /** All actions on this item, newest last */
  history: ReviewAction[]
  /** Set by an actor with approver capability */
  confirmedBy: ReviewAction | null
}

export interface SignoffRecord {
  signerName: string
  role: string
  statement: string
  timestamp: string
  hash: string
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
  signoff?: SignoffRecord
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

export type ChecklistPhase = 'start' | 'home' | 'template-choose' | 'meta-entry' | 'open-file' | 'persona-select' | 'view'
