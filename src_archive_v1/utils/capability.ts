import type { CapabilityLevel, RoleCapabilityMap } from '../types'

/** Ordered from least to most privileged */
const CAPABILITY_ORDER: CapabilityLevel[] = ['observer', 'contributor', 'reviewer', 'approver', 'editor']

/** Default capability map shipped with the app */
export const DEFAULT_ROLE_CAPABILITY_MAP: RoleCapabilityMap = {
  rules: [
    { pattern: 'observer',    capability: 'observer' },
    { pattern: 'read',        capability: 'observer' },
    { pattern: 'dev',         capability: 'contributor' },
    { pattern: 'engineer',    capability: 'contributor' },
    { pattern: 'author',      capability: 'contributor' },
    { pattern: 'contributor', capability: 'contributor' },
    { pattern: 'reviewer',    capability: 'reviewer' },
    { pattern: 'auditor',     capability: 'reviewer' },
    { pattern: 'lead',        capability: 'reviewer' },
    { pattern: 'approver',    capability: 'approver' },
    { pattern: 'signoff',     capability: 'approver' },
    { pattern: 'sign-off',    capability: 'approver' },
    { pattern: 'owner',       capability: 'editor' },
    { pattern: 'admin',       capability: 'editor' },
    { pattern: 'editor',      capability: 'editor' },
    { pattern: 'manager',     capability: 'editor' },
  ],
  defaultCapability: 'reviewer',
}

/**
 * Resolve a capability level from a free-form role string.
 * Rules are evaluated top-to-bottom; first match wins.
 */
export function resolveCapability(role: string, map: RoleCapabilityMap): CapabilityLevel {
  const lower = role.toLowerCase()
  for (const rule of map.rules) {
    if (lower.includes(rule.pattern.toLowerCase())) {
      return rule.capability
    }
  }
  return map.defaultCapability
}

/**
 * Returns true if `actual` is at least as privileged as `required`.
 */
export function meetsMinimum(actual: CapabilityLevel, required: CapabilityLevel): boolean {
  return CAPABILITY_ORDER.indexOf(actual) >= CAPABILITY_ORDER.indexOf(required)
}

/**
 * Returns true if the capability can fill field values on items.
 * contributor can fill fields but cannot set review status.
 */
export function canProvideData(capability: CapabilityLevel): boolean {
  return meetsMinimum(capability, 'contributor')
}

/**
 * Returns true if the capability can set item review status (pass/fail/na).
 */
export function canReview(capability: CapabilityLevel): boolean {
  return meetsMinimum(capability, 'reviewer')
}

/**
 * Returns true if the capability can confirm/override reviewer decisions.
 */
export function canApprove(capability: CapabilityLevel): boolean {
  return meetsMinimum(capability, 'approver')
}

/**
 * Returns true if the capability can edit checklist structure, items, and schema.
 */
export function canEdit(capability: CapabilityLevel): boolean {
  return meetsMinimum(capability, 'editor')
}
