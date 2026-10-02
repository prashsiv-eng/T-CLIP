import type { ChecklistFile, ReviewedItem, UserPersona } from '../types'

export interface ExtractedPersonas {
  users: UserPersona[]
  roles: string[]
}

export function getFilePersonasAndRoles(file: ChecklistFile, reviewedItems: ReviewedItem[] = []): ExtractedPersonas {
  const usersMap = new Map<string, UserPersona>()
  const rolesSet = new Set<string>()

  // 1. Dedicated users section in the file
  if (file.users && Array.isArray(file.users)) {
    for (const u of file.users) {
      if (u.name && u.role) {
        const key = `${u.name.trim().toLowerCase()}|||${u.role.trim().toLowerCase()}`
        if (!usersMap.has(key)) {
          usersMap.set(key, { name: u.name.trim(), role: u.role.trim() })
        }
        rolesSet.add(u.role.trim())
      }
    }
  }

  // 2. Dedicated roles section in the file
  if (file.roles && Array.isArray(file.roles)) {
    for (const r of file.roles) {
      if (r && typeof r === 'string' && r.trim()) {
        rolesSet.add(r.trim())
      }
    }
  }

  // 3. Fallback: discover from items or review history if any
  const allItems = reviewedItems.length > 0 ? reviewedItems : (file.items ?? [])
  for (const item of allItems) {
    if (item.assignedTo?.role) rolesSet.add(item.assignedTo.role.trim())
    if (item.assignedTo?.name && item.assignedTo?.role) {
      const key = `${item.assignedTo.name.trim().toLowerCase()}|||${item.assignedTo.role.trim().toLowerCase()}`
      if (!usersMap.has(key)) {
        usersMap.set(key, { name: item.assignedTo.name.trim(), role: item.assignedTo.role.trim() })
      }
    }
    if ('history' in item && Array.isArray(item.history)) {
      for (const act of item.history) {
        if (act.actorName && act.role) {
          const key = `${act.actorName.trim().toLowerCase()}|||${act.role.trim().toLowerCase()}`
          if (!usersMap.has(key)) {
            usersMap.set(key, { name: act.actorName.trim(), role: act.role.trim() })
          }
          rolesSet.add(act.role.trim())
        }
      }
    }
  }

  if (rolesSet.size === 0) {
    ;['Project Owner', 'Reviewer', 'Approver', 'Contributor', 'Observer'].forEach(r => rolesSet.add(r))
  }

  return {
    users: Array.from(usersMap.values()),
    roles: Array.from(rolesSet.values()),
  }
}
