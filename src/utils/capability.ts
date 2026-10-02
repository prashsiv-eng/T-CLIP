import type { PersonaDefinition, RoleCapabilityMap, RoleType } from '../types'

/** Ordered from least to most privileged */
export const ROLE_ORDER: RoleType[] = [
  'read-only',
  'editor',
  'reviewer',
  'approver',
  'sign-off',
  'master',
]

/** Standard canonical personas for product teams */
export const STANDARD_PERSONAS: PersonaDefinition[] = [
  { id: 'developer', label: 'Developer', role: 'editor', description: 'Implements requirements, gathers evidence & PR links' },
  { id: 'devops', label: 'DevOps Engineer', role: 'editor', description: 'Maintains infrastructure, CI/CD, and deployment evidence' },
  { id: 'security-reviewer', label: 'Security Reviewer', role: 'reviewer', description: 'Verifies technical security controls and sets Pass/Failed/N/A' },
  { id: 'qa-engineer', label: 'QA Engineer', role: 'reviewer', description: 'Tests requirements, validates quality, sets review status' },
  { id: 'tech-lead', label: 'Tech Lead', role: 'approver', description: 'Architectural oversight, approves overrides, confirms items' },
  { id: 'release-manager', label: 'Release Manager', role: 'sign-off', description: 'Authorizes overall signoff, generates SHA-256 attestation' },
  { id: 'project-admin', label: 'Project Admin', role: 'master', description: 'Full structural authority over checklist schema & personas' },
  { id: 'auditor', label: 'Auditor', role: 'read-only', description: 'Read-only visibility into items, evidence, and audit logs' },
]

/** Default capability/role map for string pattern matching */
export const DEFAULT_ROLE_CAPABILITY_MAP: RoleCapabilityMap = {
  rules: [
    { pattern: 'observer',    capability: 'read-only' },
    { pattern: 'read',        capability: 'read-only' },
    { pattern: 'auditor',     capability: 'read-only' },
    { pattern: 'sign-off',    capability: 'sign-off' },
    { pattern: 'signoff',     capability: 'sign-off' },
    { pattern: 'ciso',        capability: 'sign-off' },
    { pattern: 'admin',       capability: 'master' },
    { pattern: 'owner',       capability: 'master' },
    { pattern: 'master',      capability: 'master' },
    { pattern: 'approver',    capability: 'approver' },
    { pattern: 'lead',        capability: 'approver' },
    { pattern: 'architect',   capability: 'approver' },
    { pattern: 'security',    capability: 'reviewer' },
    { pattern: 'tester',      capability: 'reviewer' },
    { pattern: 'qa',          capability: 'reviewer' },
    { pattern: 'reviewer',    capability: 'reviewer' },
    { pattern: 'dev',         capability: 'editor' },
    { pattern: 'engineer',    capability: 'editor' },
    { pattern: 'sre',         capability: 'editor' },
    { pattern: 'ops',         capability: 'editor' },
    { pattern: 'author',      capability: 'editor' },
    { pattern: 'editor',      capability: 'editor' },
    { pattern: 'contributor', capability: 'editor' },
    { pattern: 'pm',          capability: 'sign-off' },
  ],
  defaultCapability: 'editor',
}

/**
 * Normalizes free-form role strings or aliases to a canonical RoleType.
 */
export function normalizeRole(role: string | undefined | null): RoleType {
  if (!role) return 'read-only'
  const lower = role.toLowerCase().trim()
  if (lower === 'read-only' || lower === 'read' || lower === 'observer' || lower === 'auditor') return 'read-only'
  if (lower === 'editor' || lower === 'contributor' || lower === 'write' || lower === 'dev') return 'editor'
  if (lower === 'reviewer' || lower === 'review' || lower === 'qa') return 'reviewer'
  if (lower === 'approver' || lower === 'approve' || lower === 'lead') return 'approver'
  if (lower === 'sign-off' || lower === 'signoff' || lower === 'ciso' || lower === 'pm') return 'sign-off'
  if (lower === 'master' || lower === 'admin' || lower === 'owner' || lower === 'full') return 'master'
  return 'editor'
}

export function isValidRole(role: string | undefined | null): boolean {
  if (!role) return false
  const lower = role.toLowerCase().trim()
  return (
    lower === 'read-only' || lower === 'read' || lower === 'observer' || lower === 'auditor' ||
    lower === 'editor' || lower === 'contributor' || lower === 'write' || lower === 'dev' ||
    lower === 'reviewer' || lower === 'review' || lower === 'qa' ||
    lower === 'approver' || lower === 'approve' || lower === 'lead' ||
    lower === 'sign-off' || lower === 'signoff' || lower === 'ciso' || lower === 'pm' ||
    lower === 'master' || lower === 'admin' || lower === 'owner' || lower === 'full'
  )
}

export const isValidCapability = isValidRole

/** Alias for normalizeRole */
export const normalizeCapability = normalizeRole

/**
 * Resolves the RoleType for a given persona or role string.
 */
export function getRoleForPersona(persona: string, customPersonas?: PersonaDefinition[]): RoleType {
  if (!persona) return 'read-only'
  const lower = persona.toLowerCase().trim()

  // 1. Check custom personas
  if (customPersonas && customPersonas.length > 0) {
    const found = customPersonas.find(p => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower)
    if (found) return found.role
  }

  // 2. Check standard personas
  const std = STANDARD_PERSONAS.find(p => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower)
  if (std) return std.role

  // 3. Pattern match using DEFAULT_ROLE_CAPABILITY_MAP
  for (const rule of DEFAULT_ROLE_CAPABILITY_MAP.rules) {
    if (lower.includes(rule.pattern.toLowerCase())) {
      return rule.capability
    }
  }

  return DEFAULT_ROLE_CAPABILITY_MAP.defaultCapability
}

/** Resolves role using the settings capability map */
export function resolveCapability(role: string, map: RoleCapabilityMap = DEFAULT_ROLE_CAPABILITY_MAP): RoleType {
  const lower = role.toLowerCase()
  for (const rule of map.rules) {
    if (lower.includes(rule.pattern.toLowerCase())) {
      return rule.capability
    }
  }
  return map.defaultCapability
}

/**
 * Returns true if `actual` has at least the privilege of `required`.
 */
export function meetsMinimum(actual: string, required: RoleType): boolean {
  const actualRole = normalizeRole(actual)
  return ROLE_ORDER.indexOf(actualRole) >= ROLE_ORDER.indexOf(required)
}

/**
 * Permission checks based on role or persona
 */
export function canEditFields(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'editor')
}

export function canSetWorkStatus(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'editor')
}

export function canReviewDecision(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'reviewer')
}

export function canConfirm(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'approver')
}

export function canSignoff(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'sign-off')
}

export function canManageStructure(personaOrRole: string, customPersonas?: PersonaDefinition[]): boolean {
  const role = getRoleForPersona(personaOrRole, customPersonas)
  return meetsMinimum(role, 'master')
}

// Backward-compatible capability wrappers
export const canProvideData = canEditFields
export const canReview = canReviewDecision
export const canApprove = canConfirm
export const canEdit = canManageStructure
