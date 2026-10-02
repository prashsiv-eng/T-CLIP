import { useCallback, useEffect, useState } from 'react'
import type { CapabilityLevel, DashboardFilters, RoleCapabilityMap } from '../types'
import { DEFAULT_ROLE_CAPABILITY_MAP, resolveCapability } from '../utils/capability'

const STORAGE_KEY = 'tclip_settings'

export interface Settings {
  currentUser: string
  currentRole: string
  currentCapability: CapabilityLevel
  roleCapabilityMap: RoleCapabilityMap
  dashboardFilters: DashboardFilters
}

const DEFAULT_FILTERS: DashboardFilters = {
  status: 'all',
  categories: [],
  role: '',
  requiredOnly: false,
}

const DEFAULT_SETTINGS: Omit<Settings, 'currentCapability'> = {
  currentUser: '',
  currentRole: '',
  roleCapabilityMap: DEFAULT_ROLE_CAPABILITY_MAP,
  dashboardFilters: DEFAULT_FILTERS,
}

function loadSettings(): Omit<Settings, 'currentCapability'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Omit<Settings, 'currentCapability'>>
    return {
      currentUser: parsed.currentUser ?? '',
      currentRole: parsed.currentRole ?? '',
      roleCapabilityMap: parsed.roleCapabilityMap ?? DEFAULT_ROLE_CAPABILITY_MAP,
      dashboardFilters: parsed.dashboardFilters ?? DEFAULT_FILTERS,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(s: Omit<Settings, 'currentCapability'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Silently ignore quota errors
  }
}

export function useSettings() {
  const [stored, setStored] = useState<Omit<Settings, 'currentCapability'>>(loadSettings)

  const currentCapability = resolveCapability(stored.currentRole, stored.roleCapabilityMap)

  useEffect(() => {
    persistSettings(stored)
  }, [stored])

  const setUser = useCallback((name: string) => {
    setStored(s => ({ ...s, currentUser: name }))
  }, [])

  const setRole = useCallback((role: string) => {
    setStored(s => ({ ...s, currentRole: role }))
  }, [])

  const updateCapabilityMap = useCallback((map: RoleCapabilityMap) => {
    setStored(s => ({ ...s, roleCapabilityMap: map }))
  }, [])

  const setDashboardFilters = useCallback((filters: DashboardFilters) => {
    setStored(s => ({ ...s, dashboardFilters: filters }))
  }, [])

  return {
    ...stored,
    currentCapability,
    setUser,
    setRole,
    updateCapabilityMap,
    setDashboardFilters,
  }
}
