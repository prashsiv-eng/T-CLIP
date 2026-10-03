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
    id: 'owasp-asvs',
    name: 'OWASP ASVS v4.0.3',
    description: 'Comprehensive OWASP Application Security Verification Standard with all 286 official requirements across all 14 chapters, L1–L3 levels, and CWE mappings.',
    categories: ['AppSec', 'L1', 'L2', 'L3', 'Architecture', 'Auth', 'Crypto', 'APIs'],
  },
  {
    id: 'nist-ai-rmf',
    name: 'NIST AI RMF 1.0',
    description: 'NIST Artificial Intelligence Risk Management Framework (SP 1270-1) covering all 72 official subcategories across all 19 categories and the 4 Core Functions: GOVERN, MAP, MEASURE, and MANAGE.',
    categories: ['AI Governance', 'NIST', 'Risk Management', 'Safety', 'Ethics'],
  },
  {
    id: 'owasp-agentic-ai',
    name: 'OWASP Agentic AI Top 10',
    description: 'Autonomous AI application security standard covering agent goal hijacking, tool misuse, privilege abuse, unexpected code execution, and multi-agent safety.',
    categories: ['Agentic AI', 'Autonomous Systems', 'Tool Safety', 'Sandboxing', 'Guardrails'],
  },
  {
    id: 'owasp-llmsvs',
    name: 'OWASP LLMSVS',
    description: 'Tiered technical LLM Security Verification Standard covering prompt guardrails, RAG/vector storage, model lifecycle, output sandboxing, and agent memory.',
    categories: ['LLM Security', 'Tiered Verification', 'RAG', 'Prompt Injection', 'Observability'],
  },
  {
    id: 'owasp-llm-top10',
    name: 'OWASP LLM Top 10',
    description: 'Official OWASP Top 10 for Large Language Model Applications (2025) covering prompt injection, sensitive data leakage, supply chain, and excessive agency.',
    categories: ['GenAI Security', 'OWASP Top 10', 'Prompt Injection', 'Data Privacy', 'Supply Chain'],
  },
  {
    id: 'eu-cra',
    name: 'EU Cyber Resilience Act (CRA)',
    description: 'European Union Cyber Resilience Act (Regulation (EU) 2024/2847) covering all 50 official requirements across Annex I Part I (Product Properties), Annex I Part II (Vulnerability Handling), Annex II (User Instructions), Annex VII (Technical Documentation File), and Chapter II (Manufacturer Obligations & Reporting).',
    categories: ['EU Regulation', 'Cyber Resilience', 'IoT / Hardware', 'Software Supply Chain', 'SBOM', 'CE Mark'],
  },
]

export async function getBuiltInTemplate(id: string): Promise<BuiltInTemplate> {
  const meta = BUILT_IN_TEMPLATE_META.find(t => t.id === id)
  if (!meta) throw new Error(`Unknown template id: ${id}`)
  const mod = await import(`../templates/${id}.json`)
  const file = mod.default as ChecklistFile
  return { ...meta, file }
}

export function exportChecklistFile(file: ChecklistFile, customFileName?: string): void {
  const safeProject = file.project ? file.project.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : 'checklist'
  const filename = customFileName || `${safeProject}-${file.version || '1.0'}.json`
  downloadJSON(file, filename)
}
