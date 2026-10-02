import { describe, expect, it } from 'vitest'
import type { ChecklistFile, ReviewedItem } from '../../types'
import { getFilePersonasAndRoles } from '../../utils/persona'

describe('getFilePersonasAndRoles', () => {
  it('extracts users and roles from dedicated top-level sections', () => {
    const file: ChecklistFile = {
      version: '1.0',
      project: 'TestApp',
      fields: [],
      items: [],
      roles: ['Security Lead', 'QA Engineer'],
      users: [
        { name: 'Alice Chen', role: 'Security Lead' },
        { name: 'Bob Vance', role: 'QA Engineer' },
      ],
    }

    const result = getFilePersonasAndRoles(file)
    expect(result.users).toEqual([
      { name: 'Alice Chen', role: 'Security Lead' },
      { name: 'Bob Vance', role: 'QA Engineer' },
    ])
    expect(result.roles).toContain('Security Lead')
    expect(result.roles).toContain('QA Engineer')
  })

  it('deduplicates case-insensitively and falls back to item assignments if not in top-level', () => {
    const file: ChecklistFile = {
      version: '1.0',
      project: 'TestApp',
      fields: [],
      items: [
        {
          id: 'ITEM-1',
          category: 'QA',
          description: 'Test item',
          status: 'pending',
          required: true,
          assignedTo: { name: 'Charlie Day', role: 'DevOps' },
        },
      ],
      users: [{ name: 'charlie day', role: 'DevOps' }],
    }

    const result = getFilePersonasAndRoles(file)
    expect(result.users).toHaveLength(1)
    expect(result.users[0].name.toLowerCase()).toBe('charlie day')
    expect(result.roles).toContain('DevOps')
  })

  it('extracts personas from reviewedItems history if available', () => {
    const file: ChecklistFile = {
      version: '1.0',
      project: 'TestApp',
      fields: [],
      items: [],
    }

    const reviewedItems: ReviewedItem[] = [
      {
        id: 'ITEM-2',
        category: 'Legal',
        description: 'License check',
        status: 'pass',
        required: false,
        confirmedBy: null,
        history: [
          {
            timestamp: '2026-10-01T12:00:00Z',
            actorName: 'Dana Scully',
            role: 'Investigator',
            status: 'pass',
            fieldValues: {},
          },
        ],
      },
    ]

    const result = getFilePersonasAndRoles(file, reviewedItems)
    expect(result.users).toEqual([{ name: 'Dana Scully', role: 'Investigator' }])
    expect(result.roles).toContain('Investigator')
  })

  it('returns default roles if no roles are found anywhere', () => {
    const file: ChecklistFile = {
      version: '1.0',
      project: 'TestApp',
      fields: [],
      items: [],
    }

    const result = getFilePersonasAndRoles(file)
    expect(result.users).toEqual([])
    expect(result.roles).toContain('Project Owner')
    expect(result.roles).toContain('Reviewer')
    expect(result.roles).toContain('Approver')
    expect(result.roles).toContain('Contributor')
    expect(result.roles).toContain('Observer')
  })
})
