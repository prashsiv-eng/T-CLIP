import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BulkActionBar } from '../../components/checklist/BulkActionBar'
import type { ChecklistFile, ReviewedItem } from '../../types'
import * as exportUtils from '../../utils/export'

const FILE: ChecklistFile = {
  version: '1.0',
  project: 'SecApp',
  branch: 'main',
  fields: [{ id: 'notes', label: 'Notes', type: 'text' }],
  items: [],
}

const ITEMS: ReviewedItem[] = [
  {
    id: 'ITEM-1',
    category: 'Network',
    description: 'Ensure firewall is active',
    status: 'pass',
    required: true,
    history: [],
    confirmedBy: null,
  },
  {
    id: 'ITEM-2',
    category: 'Network',
    description: 'Close unused ports',
    status: 'in-progress',
    required: false,
    history: [],
    confirmedBy: null,
  },
]

describe('BulkActionBar Export Selected', () => {
  it('renders Export Selected button and triggers Excel & CSV export', async () => {
    const csvSpy = vi.spyOn(exportUtils, 'exportChecklistCSV').mockImplementation(() => {})
    const excelSpy = vi.spyOn(exportUtils, 'exportChecklistExcel').mockImplementation(async () => {})

    render(
      <BulkActionBar
        selectedIds={['ITEM-1']}
        file={FILE}
        items={ITEMS}
        userCapability="editor"
        userName="Bob"
        userRole="Developer"
        onClearSelection={vi.fn()}
        onBatchUpdateStatus={vi.fn()}
        onBatchConfirm={vi.fn()}
      />
    )

    const exportBtn = screen.getByRole('button', { name: /Export Selected/i })
    expect(exportBtn).toBeInTheDocument()

    // Open export menu
    fireEvent.click(exportBtn)
    expect(screen.getByText(/Export Excel \(\.xlsx\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Export CSV \(\.csv\)/i)).toBeInTheDocument()

    // Export CSV
    fireEvent.click(screen.getByText(/Export CSV \(\.csv\)/i))
    expect(csvSpy).toHaveBeenCalledTimes(1)
    expect(csvSpy).toHaveBeenCalledWith(
      [ITEMS[0]],
      FILE.fields,
      'secapp-selected-1-items.csv'
    )

    // Open again and export Excel
    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export Excel \(\.xlsx\)/i))
    expect(excelSpy).toHaveBeenCalledTimes(1)
    expect(excelSpy).toHaveBeenCalledWith(
      [ITEMS[0]],
      FILE.fields,
      'secapp-selected-1-items.xlsx'
    )

    csvSpy.mockRestore()
    excelSpy.mockRestore()
  })
})
