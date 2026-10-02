import type { ChecklistFile } from '../types'
import { downloadJSON } from './export'

export interface BuiltInTemplate {
  id: string
  name: string
  description: string
  categories: string[]
  file: ChecklistFile
}

export const BUILT_IN_TEMPLATE_META: Omit<BuiltInTemplate, 'file'>[] = [
  {
    id: 'gxp-release',
    name: 'GxP Release',
    description: 'Pharmaceutical/biotech GxP compliance checklist covering change control, validation, training, and audit trail.',
    categories: ['GxP', 'Regulatory', 'Quality'],
  },
  {
    id: 'security-review',
    name: 'Security Review',
    description: 'Application security review covering SAST, DAST, dependency scanning, and infrastructure checks.',
    categories: ['SAST', 'DAST', 'Dependency', 'Infrastructure'],
  },
  {
    id: 'change-management',
    name: 'Standard Change Management',
    description: 'IT change management checklist covering impact assessment, approval, communication, and rollback planning.',
    categories: ['Impact', 'Approval', 'Communication', 'Rollback'],
  },
  {
    id: 'combined-release',
    name: 'Combined Release',
    description: 'Full release checklist combining GxP, Security, and Change Management requirements.',
    categories: ['GxP', 'Regulatory', 'Quality', 'SAST', 'DAST', 'Dependency', 'Infrastructure', 'Impact', 'Approval', 'Communication', 'Rollback'],
  },
]

export async function getBuiltInTemplate(id: string): Promise<BuiltInTemplate> {
  const meta = BUILT_IN_TEMPLATE_META.find(t => t.id === id)
  if (!meta) throw new Error(`Unknown template id: ${id}`)
  const mod = await import(`../templates/${id}.json`)
  const file = mod.default as ChecklistFile
  return { ...meta, file }
}

export function exportChecklistFile(file: ChecklistFile): void {
  downloadJSON(file, 'checklist.json')
}
