import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SpreadsheetImportDialog } from '../../components/importer/SpreadsheetImportDialog'

describe('SpreadsheetImportDialog', () => {
  it('renders with both checklist and template modes available', () => {
    render(
      <SpreadsheetImportDialog
        open={true}
        initialMode="checklist"
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Spreadsheet Import Wizard/i)).toBeInTheDocument()
    expect(screen.getByText(/Import as Active Checklist/i)).toBeInTheDocument()
    expect(screen.getByText(/Import as Reusable Template/i)).toBeInTheDocument()
    expect(screen.getByText(/Choose or Drag & Drop Spreadsheet/i)).toBeInTheDocument()
  })

  it('allows switching between checklist and template modes', () => {
    render(
      <SpreadsheetImportDialog
        open={true}
        initialMode="checklist"
        onClose={vi.fn()}
      />
    )

    const templateCard = screen.getByText(/Import as Reusable Template/i)
    fireEvent.click(templateCard)

    expect(screen.getByText(/Import baseline framework requirements or security standards/i)).toBeInTheDocument()
  })

  it('displays multi-sheet controls, allows selecting sheets, and switches previews', async () => {
    const parseSpy = vi.spyOn(await import('../../utils/importer'), 'parseSpreadsheetFile').mockResolvedValue({
      sheets: {
        'Access Control': [
          ['Control ID', 'Requirement'],
          ['AC-01', 'MFA on login'],
        ],
        Cryptography: [
          ['Control ID', 'Requirement'],
          ['CR-01', 'TLS 1.3 enforced'],
        ],
      },
      sheetNames: ['Access Control', 'Cryptography'],
      getSheetRows: (name: string) =>
        name === 'Cryptography'
          ? [
              ['Control ID', 'Requirement'],
              ['CR-01', 'TLS 1.3 enforced'],
            ]
          : [
              ['Control ID', 'Requirement'],
              ['AC-01', 'MFA on login'],
            ],
    })

    render(
      <SpreadsheetImportDialog
        open={true}
        initialMode="checklist"
        onClose={vi.fn()}
      />
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    const mockFile = new File(['mock content'], 'nist_sp800.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Wait for async parsing to complete and sheet cards to appear
    expect(await screen.findByText(/Workbook Sheets/i)).toBeInTheDocument()
    expect(screen.getByText('Access Control')).toBeInTheDocument()
    expect(screen.getByText('Cryptography')).toBeInTheDocument()

    // Initially 1 sheet selected (first sheet)
    expect(screen.getByText(/1 of 2 selected/i)).toBeInTheDocument()

    // Click "Select All"
    const selectAllBtn = screen.getByRole('button', { name: /Select All/i })
    fireEvent.click(selectAllBtn)

    // Now 2 sheets selected and combining banner is rendered
    expect(screen.getByText(/2 of 2 selected/i)).toBeInTheDocument()
    expect(screen.getByText(/Combining 2 sheets/i)).toBeInTheDocument()
    expect(screen.getByText(/Use sheet name as Category if unmapped/i)).toBeInTheDocument()

    // Switch preview to Cryptography
    const cryptoCard = screen.getByText('Cryptography').closest('.MuiCard-root')
    if (cryptoCard) {
      fireEvent.click(cryptoCard)
    }

    expect(screen.getByText(/Header Row & Column Preview \(Cryptography\)/i)).toBeInTheDocument()

    parseSpy.mockRestore()
  })
})

