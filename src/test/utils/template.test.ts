import { describe, expect, it } from 'vitest'
import { validateChecklistFile } from '../../schema/validate'
import { BUILT_IN_TEMPLATE_META, getBuiltInTemplate } from '../../utils/template'

describe('Built-in Templates', () => {
  it('registers the 6 authoritative compliance and AI standards', () => {
    const ids = BUILT_IN_TEMPLATE_META.map(t => t.id)
    expect(ids).toEqual([
      'owasp-asvs',
      'nist-ai-rmf',
      'owasp-agentic-ai',
      'owasp-llmsvs',
      'owasp-llm-top10',
      'eu-cra',
    ])
  })

  it('loads each built-in template and passes validateChecklistFile', async () => {
    for (const meta of BUILT_IN_TEMPLATE_META) {
      const template = await getBuiltInTemplate(meta.id)
      expect(template.id).toBe(meta.id)
      expect(template.name).toBe(meta.name)
      expect(template.file).toBeDefined()

      const validation = validateChecklistFile(template.file)
      expect(validation.valid, `Template ${meta.id} failed validation: ${validation.errors.join('; ')}`).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(template.file.items.length).toBeGreaterThan(0)
      expect(template.file.fields.length).toBeGreaterThan(0)
    }
  })

  it('validates comprehensive OWASP ASVS v4.0.3 dataset', async () => {
    const asvs = await getBuiltInTemplate('owasp-asvs')
    expect(asvs.file.roles).toEqual(
      expect.arrayContaining([
        'AppSec Reviewer',
        'Lead Developer',
        'Security Architect',
        'Penetration Tester',
      ])
    )
    expect(asvs.file.fields.map(f => f.id)).toContain('level')
    expect(asvs.file.fields.map(f => f.id)).toContain('cwe')
    expect(asvs.file.fields.map(f => f.id)).toContain('verification_method')
    expect(asvs.file.fields.map(f => f.id)).toContain('evidence_url')
    expect(asvs.file.fields.map(f => f.id)).toContain('finding_notes')
    expect(asvs.file.items.length).toBe(286)

    // Verify all 286 items have level defined
    const levels = asvs.file.items.map(i => i.values?.level)
    expect(levels.every(l => ['L1', 'L2', 'L3'].includes(l as string))).toBe(true)
  })

  it('validates NIST AI RMF 1.0 functions, categories, and governance tiers', async () => {
    const nist = await getBuiltInTemplate('nist-ai-rmf')
    expect(nist.file.fields.map(f => f.id)).toContain('function')
    expect(nist.file.fields.map(f => f.id)).toContain('governance_tier')
    expect(nist.file.fields.map(f => f.id)).toContain('assessment_notes')
    expect(nist.file.items.length).toBe(72)

    const functions = new Set(nist.file.items.map(i => i.values?.function))
    expect(functions).toContain('GOVERN')
    expect(functions).toContain('MAP')
    expect(functions).toContain('MEASURE')
    expect(functions).toContain('MANAGE')

    // Verify all 19 official categories are represented
    const categories = new Set(nist.file.items.map(i => i.category))
    expect(categories.size).toBe(19)
  })

  it('validates OWASP Agentic AI Top 10 risks', async () => {
    const agentic = await getBuiltInTemplate('owasp-agentic-ai')
    expect(agentic.file.fields.map(f => f.id)).toContain('risk_id')
    expect(agentic.file.fields.map(f => f.id)).toContain('guardrail_type')
    expect(agentic.file.fields.map(f => f.id)).toContain('agent_impact')
    expect(agentic.file.items.length).toBe(40)
    
    const risks = new Set(agentic.file.items.map(i => i.values?.risk_id))
    for (let i = 1; i <= 10; i++) {
      const code = `ASI${String(i).padStart(2, '0')}`
      expect(risks).toContain(code)
    }
  })

  it('validates OWASP LLMSVS tiered verification levels', async () => {
    const llmsvs = await getBuiltInTemplate('owasp-llmsvs')
    expect(llmsvs.file.fields.map(f => f.id)).toContain('level')
    expect(llmsvs.file.fields.map(f => f.id)).toContain('verification_method')
    expect(llmsvs.file.items.length).toBe(42)
    
    const levels = new Set(llmsvs.file.items.map(i => i.values?.level))
    expect(levels).toContain('L1')
    expect(levels).toContain('L2')
    expect(levels).toContain('L3')
  })

  it('validates OWASP LLM Top 10 vulnerabilities', async () => {
    const llm = await getBuiltInTemplate('owasp-llm-top10')
    expect(llm.file.fields.map(f => f.id)).toContain('risk_id')
    expect(llm.file.fields.map(f => f.id)).toContain('attack_vector')
    expect(llm.file.fields.map(f => f.id)).toContain('mitigation_status')
    expect(llm.file.items.length).toBe(40)
    
    const risks = new Set(llm.file.items.map(i => i.values?.risk_id))
    for (let i = 1; i <= 10; i++) {
      const code = `LLM${String(i).padStart(2, '0')}`
      expect(risks).toContain(code)
    }
  })

  it('validates EU Cyber Resilience Act (CRA) Annex I and manufacturer obligations', async () => {
    const cra = await getBuiltInTemplate('eu-cra')
    expect(cra.file.roles).toEqual(
      expect.arrayContaining([
        'Product Security Officer',
        'Embedded / Firmware Engineer',
        'Software Architect',
        'DevSecOps Engineer',
        'Compliance & Regulatory Lead',
        'PSIRT Lead',
      ])
    )
    expect(cra.file.fields.map(f => f.id)).toContain('article_ref')
    expect(cra.file.fields.map(f => f.id)).toContain('product_tier')
    expect(cra.file.fields.map(f => f.id)).toContain('compliance_evidence')
    expect(cra.file.fields.map(f => f.id)).toContain('implementation_status')
    expect(cra.file.items.length).toBe(50)

    const categories = new Set(cra.file.items.map(i => i.category))
    expect(categories.size).toBe(5)
    expect(categories).toContain('Annex I Part I : Product Security Properties')
    expect(categories).toContain('Annex I Part II : Vulnerability Handling Processes')
    expect(categories).toContain('Annex II : Information and Instructions to the User')
    expect(categories).toContain('Annex VII : Technical Documentation Dossier')
    expect(categories).toContain('Chapter II : Manufacturer & Regulatory Obligations')

    // Verify all 14 Annex I Part I requirements are present
    const part1 = cra.file.items.filter(i => i.category === 'Annex I Part I : Product Security Properties')
    expect(part1.length).toBe(14)

    // Verify all 8 Annex I Part II requirements are present
    const part2 = cra.file.items.filter(i => i.category === 'Annex I Part II : Vulnerability Handling Processes')
    expect(part2.length).toBe(8)

    // Verify all 11 Annex II user instruction requirements are present
    const annex2 = cra.file.items.filter(i => i.category === 'Annex II : Information and Instructions to the User')
    expect(annex2.length).toBe(11)

    // Verify all 8 Annex VII technical documentation requirements are present
    const annex7 = cra.file.items.filter(i => i.category === 'Annex VII : Technical Documentation Dossier')
    expect(annex7.length).toBe(8)

    // Verify all 9 Chapter II manufacturer obligations are present
    const chapter2 = cra.file.items.filter(i => i.category === 'Chapter II : Manufacturer & Regulatory Obligations')
    expect(chapter2.length).toBe(9)
  })
})
