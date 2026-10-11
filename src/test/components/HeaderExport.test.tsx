import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '../../components/layout/Header'
import type { ChecklistFile } from '../../types'

const FILE: ChecklistFile = {
  version: '1.0',
  project: 'TestApp',
  branch: 'main',
  fields: [],
  items: [],
}

describe('Header Export dropdown', () => {
  it('renders Export button and opens menu with JSON, Excel, and CSV options', () => {
    const onExportJSON = vi.fn()
    const onExportExcel = vi.fn()
    const onExportCSV = vi.fn()

    render(
      <Header
        file={FILE}
        userName="Alice"
        userRole="Security Reviewer"
        capability="reviewer"
        onNameChange={vi.fn()}
        onRoleChange={vi.fn()}
        onSettingsOpen={vi.fn()}
        onExportJSON={onExportJSON}
        onExportExcel={onExportExcel}
        onExportCSV={onExportCSV}
      />
    )

    const exportBtn = screen.getByRole('button', { name: /Export options/i })
    expect(exportBtn).toBeInTheDocument()

    // Click to open menu
    fireEvent.click(exportBtn)

    expect(screen.getByText(/Export JSON/i)).toBeInTheDocument()
    expect(screen.getByText(/Export Excel \(\.xlsx\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Export CSV \(\.csv\)/i)).toBeInTheDocument()

    // Click JSON
    fireEvent.click(screen.getByText(/Export JSON/i))
    expect(onExportJSON).toHaveBeenCalledTimes(1)
  })

  it('triggers onExportExcel and onExportCSV callbacks', () => {
    const onExportExcel = vi.fn()
    const onExportCSV = vi.fn()

    render(
      <Header
        file={FILE}
        userName="Alice"
        userRole="Security Reviewer"
        capability="reviewer"
        onNameChange={vi.fn()}
        onRoleChange={vi.fn()}
        onSettingsOpen={vi.fn()}
        onExportExcel={onExportExcel}
        onExportCSV={onExportCSV}
      />
    )

    const exportBtn = screen.getByRole('button', { name: /Export options/i })
    fireEvent.click(exportBtn)

    fireEvent.click(screen.getByText(/Export Excel \(\.xlsx\)/i))
    expect(onExportExcel).toHaveBeenCalledTimes(1)

    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export CSV \(\.csv\)/i))
    expect(onExportCSV).toHaveBeenCalledTimes(1)
  })
})
