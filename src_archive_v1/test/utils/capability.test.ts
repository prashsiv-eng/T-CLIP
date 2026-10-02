import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROLE_CAPABILITY_MAP,
  canApprove,
  canEdit,
  canProvideData,
  canReview,
  meetsMinimum,
  resolveCapability,
} from '../../utils/capability'

describe('resolveCapability', () => {
  it('resolves "observer" substring to observer', () => {
    expect(resolveCapability('Auditor Observer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('observer')
  })

  it('resolves "read" substring to observer', () => {
    expect(resolveCapability('Read Only', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('observer')
  })

  it('resolves "dev" substring to contributor', () => {
    expect(resolveCapability('Frontend Dev', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('contributor')
  })

  it('resolves "engineer" substring to contributor', () => {
    expect(resolveCapability('Software Engineer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('contributor')
  })

  it('resolves "author" substring to contributor', () => {
    expect(resolveCapability('Change Author', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('contributor')
  })

  it('resolves "contributor" substring to contributor', () => {
    expect(resolveCapability('GxP Contributor', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('contributor')
  })

  it('resolves "reviewer" substring to reviewer', () => {
    expect(resolveCapability('GxP Reviewer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "auditor" substring to reviewer', () => {
    expect(resolveCapability('Security Auditor', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "lead" substring to reviewer', () => {
    expect(resolveCapability('Security Lead', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('resolves "approver" substring to approver', () => {
    expect(resolveCapability('Release Approver', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
  })

  it('resolves "signoff" substring to approver', () => {
    expect(resolveCapability('QA Signoff', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
  })

  it('resolves "owner" substring to editor', () => {
    expect(resolveCapability('Project Owner', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "admin" substring to editor', () => {
    expect(resolveCapability('System Admin', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "editor" substring to editor', () => {
    expect(resolveCapability('Content Editor', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('resolves "manager" substring to editor', () => {
    expect(resolveCapability('Release Manager', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('editor')
  })

  it('falls back to reviewer for unrecognised role', () => {
    expect(resolveCapability('Unknown Role', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
    expect(resolveCapability('', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('reviewer')
  })

  it('is case-insensitive', () => {
    expect(resolveCapability('APPROVER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('approver')
    expect(resolveCapability('OBSERVER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('observer')
    expect(resolveCapability('ENGINEER', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('contributor')
  })

  it('first match wins (observer before reviewer)', () => {
    expect(resolveCapability('reviewer observer', DEFAULT_ROLE_CAPABILITY_MAP)).toBe('observer')
  })
})

describe('meetsMinimum', () => {
  it('observer meets observer', () => expect(meetsMinimum('observer', 'observer')).toBe(true))
  it('contributor meets observer', () => expect(meetsMinimum('contributor', 'observer')).toBe(true))
  it('reviewer meets contributor', () => expect(meetsMinimum('reviewer', 'contributor')).toBe(true))
  it('approver meets reviewer', () => expect(meetsMinimum('approver', 'reviewer')).toBe(true))
  it('editor meets approver', () => expect(meetsMinimum('editor', 'approver')).toBe(true))
  it('editor meets editor', () => expect(meetsMinimum('editor', 'editor')).toBe(true))

  it('observer does not meet contributor', () => expect(meetsMinimum('observer', 'contributor')).toBe(false))
  it('contributor does not meet reviewer', () => expect(meetsMinimum('contributor', 'reviewer')).toBe(false))
  it('reviewer does not meet approver', () => expect(meetsMinimum('reviewer', 'approver')).toBe(false))
  it('approver does not meet editor', () => expect(meetsMinimum('approver', 'editor')).toBe(false))
})

describe('capability helpers', () => {
  it('canProvideData: contributor and above', () => {
    expect(canProvideData('observer')).toBe(false)
    expect(canProvideData('contributor')).toBe(true)
    expect(canProvideData('reviewer')).toBe(true)
    expect(canProvideData('approver')).toBe(true)
    expect(canProvideData('editor')).toBe(true)
  })

  it('canReview: reviewer and above', () => {
    expect(canReview('observer')).toBe(false)
    expect(canReview('contributor')).toBe(false)
    expect(canReview('reviewer')).toBe(true)
    expect(canReview('approver')).toBe(true)
    expect(canReview('editor')).toBe(true)
  })

  it('canApprove: approver and above', () => {
    expect(canApprove('observer')).toBe(false)
    expect(canApprove('contributor')).toBe(false)
    expect(canApprove('reviewer')).toBe(false)
    expect(canApprove('approver')).toBe(true)
    expect(canApprove('editor')).toBe(true)
  })

  it('canEdit: editor only', () => {
    expect(canEdit('observer')).toBe(false)
    expect(canEdit('contributor')).toBe(false)
    expect(canEdit('reviewer')).toBe(false)
    expect(canEdit('approver')).toBe(false)
    expect(canEdit('editor')).toBe(true)
  })
})
