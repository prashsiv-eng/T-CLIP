import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AttestationSummary } from '../../components/attestation/AttestationSummary'
import type { ChecklistFile, ReviewedItem } from '../../types'
import * as exportUtils from '../../utils/export'

const FILE: ChecklistFile = {
  version: '2.0',
  project: 'FinTechApp',
  branch: 'release/2.0',
  fields: [],
  items: [],
  personas: [{ id: 'so', label: 'CISO', role: 'sign-off' }],
}

const ITEMS: ReviewedItem[] = [
  {
    id: 'SEC-101',
    category: 'Encryption',
    description: 'TLS 1.3 enforced',
    status: 'pass',
    required: true,
    history: [],
    confirmedBy: null,
  },
]

describe('AttestationSummary Export', () => {
  it('renders Export Attestation menu and downloads JSON, Excel, and CSV', async () => {
    const jsonSpy = vi.spyOn(exportUtils, 'downloadJSON').mockImplementation(() => {})
    const csvSpy = vi.spyOn(exportUtils, 'exportAttestationCSV').mockImplementation(() => {})
    const excelSpy = vi.spyOn(exportUtils, 'exportAttestationExcel').mockImplementation(async () => {})

    render(
      <AttestationSummary
        file={FILE}
        items={ITEMS}
        fileHash="abc123hash"
        userName="Alice"
        userRole="CISO"
      />
    )

    const exportBtn = screen.getByRole('button', { name: /Export Attestation/i })
    expect(exportBtn).toBeInTheDocument()

    // Open export menu
    fireEvent.click(exportBtn)
    expect(screen.getByText(/Export Attestation JSON/i)).toBeInTheDocument()
    expect(screen.getByText(/Export Attestation Excel \(\.xlsx\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Export Attestation CSV \(\.csv\)/i)).toBeInTheDocument()

    // Click JSON
    fireEvent.click(screen.getByText(/Export Attestation JSON/i))
    expect(jsonSpy).toHaveBeenCalledTimes(1)

    // Open again and click Excel
    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export Attestation Excel \(\.xlsx\)/i))
    expect(excelSpy).toHaveBeenCalledTimes(1)

    // Open again and click CSV
    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export Attestation CSV \(\.csv\)/i))
    expect(csvSpy).toHaveBeenCalledTimes(1)

    jsonSpy.mockRestore()
    csvSpy.mockRestore()
    excelSpy.mockRestore()
  })
})
