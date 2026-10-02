import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROLE_CAPABILITY_MAP,
  canConfirm,
  canEditFields,
  canManageStructure,
  canReviewDecision,
  canSetWorkStatus,
  canSignoff,
  meetsMinimum,
  resolveCapability,
} from '../../utils/capability'

describe('resolveCapability', () => {
  it('resolves "observer" substring to read-only', () => {
    expect(resolveCapability('Auditor Observer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('read-only')
  })

  it('resolves "read" substring to read-only', () => {
    expect(resolveCapability('Read Only', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('read-only')
  })

  it('resolves "dev" substring to editor', () => {
    expect(resolveCapability('Frontend Dev', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "engineer" substring to editor', () => {
    expect(resolveCapability('Software Engineer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "author" substring to editor', () => {
    expect(resolveCapability('Change Author', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "editor" substring to editor', () => {
    expect(resolveCapability('Content Editor', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "qa" substring to reviewer', () => {
    expect(resolveCapability('QA Engineer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "tester" substring to reviewer', () => {
    expect(resolveCapability('Security Tester', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "security" substring to reviewer', () => {
    expect(resolveCapability('Security Reviewer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "reviewer" substring to reviewer', () => {
    expect(resolveCapability('Code Reviewer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "lead" substring to approver', () => {
    expect(resolveCapability('Tech Lead', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
  })

  it('resolves "approver" substring to approver', () => {
    expect(resolveCapability('Release Approver', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
  })

  it('resolves "signoff" substring to sign-off', () => {
    expect(resolveCapability('QA Signoff', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('sign-off')
  })

  it('resolves "ciso" substring to sign-off', () => {
    expect(resolveCapability('Company CISO', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('sign-off')
  })

  it('resolves "admin" substring to master', () => {
    expect(resolveCapability('System Admin', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('master')
  })

  it('resolves "owner" substring to master', () => {
    expect(resolveCapability('Product Owner', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('master')
  })

  it('falls back to default editor for unrecognised role', () => {
    expect(resolveCapability('Unknown Role', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('is case-insensitive', () => {
    expect(resolveCapability('APPROVER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
    expect(resolveCapability('OBSERVER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('read-only')
    expect(resolveCapability('ENGINEER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })
})

describe('meetsMinimum', () => {
  it('read-only meets read-only', () => expect(meetsMinimum('read-only', 'read-only')).toBe(true))
  it('editor meets read-only', () => expect(meetsMinimum('editor', 'read-only')).toBe(true))
  it('reviewer meets editor', () => expect(meetsMinimum('reviewer', 'editor')).toBe(true))
  it('approver meets reviewer', () => expect(meetsMinimum('approver', 'reviewer')).toBe(true))
  it('sign-off meets approver', () => expect(meetsMinimum('sign-off', 'approver')).toBe(true))
  it('master meets sign-off', () => expect(meetsMinimum('master', 'sign-off')).toBe(true))
  it('master meets master', () => expect(meetsMinimum('master', 'master')).toBe(true))

  it('read-only does not meet editor', () => expect(meetsMinimum('read-only', 'editor')).toBe(false))
  it('editor does not meet reviewer', () => expect(meetsMinimum('editor', 'reviewer')).toBe(false))
  it('reviewer does not meet approver', () => expect(meetsMinimum('reviewer', 'approver')).toBe(false))
  it('approver does not meet sign-off', () => expect(meetsMinimum('approver', 'sign-off')).toBe(false))
  it('sign-off does not meet master', () => expect(meetsMinimum('sign-off', 'master')).toBe(false))
})

describe('capability helpers', () => {
  it('canEditFields & canSetWorkStatus: editor and above', () => {
    expect(canEditFields('read-only')).toBe(false)
    expect(canEditFields('editor')).toBe(true)
    expect(canEditFields('reviewer')).toBe(true)
    expect(canEditFields('approver')).toBe(true)
    expect(canEditFields('sign-off')).toBe(true)
    expect(canEditFields('master')).toBe(true)

    expect(canSetWorkStatus('read-only')).toBe(false)
    expect(canSetWorkStatus('editor')).toBe(true)
  })

  it('canReviewDecision: reviewer and above', () => {
    expect(canReviewDecision('read-only')).toBe(false)
    expect(canReviewDecision('editor')).toBe(false)
    expect(canReviewDecision('reviewer')).toBe(true)
    expect(canReviewDecision('approver')).toBe(true)
    expect(canReviewDecision('sign-off')).toBe(true)
    expect(canReviewDecision('master')).toBe(true)
  })

  it('canConfirm: approver and above', () => {
    expect(canConfirm('read-only')).toBe(false)
    expect(canConfirm('editor')).toBe(false)
    expect(canConfirm('reviewer')).toBe(false)
    expect(canConfirm('approver')).toBe(true)
    expect(canConfirm('sign-off')).toBe(true)
    expect(canConfirm('master')).toBe(true)
  })

  it('canSignoff: sign-off and above', () => {
    expect(canSignoff('read-only')).toBe(false)
    expect(canSignoff('editor')).toBe(false)
    expect(canSignoff('reviewer')).toBe(false)
    expect(canSignoff('approver')).toBe(false)
    expect(canSignoff('sign-off')).toBe(true)
    expect(canSignoff('master')).toBe(true)
  })

  it('canManageStructure: master only', () => {
    expect(canManageStructure('read-only')).toBe(false)
    expect(canManageStructure('editor')).toBe(false)
    expect(canManageStructure('reviewer')).toBe(false)
    expect(canManageStructure('approver')).toBe(false)
    expect(canManageStructure('sign-off')).toBe(false)
    expect(canManageStructure('master')).toBe(true)
  })
})
