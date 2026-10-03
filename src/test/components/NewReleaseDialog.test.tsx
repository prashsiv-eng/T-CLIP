import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NewReleaseDialog } from '../../components/review/NewReleaseDialog'

describe('NewReleaseDialog', () => {
  it('renders prominent save warning alert before resetting', () => {
    render(
      <NewReleaseDialog
        open={true}
        currentProject="PaymentService"
        currentVersion="1.0.0"
        currentBranch="main"
        totalItems={25}
        evidenceCount={18}
        hasBeenSaved={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Warning: Save current state before resetting!/i)).toBeInTheDocument()
    expect(screen.getByText(/Resetting will clear all review decisions/i)).toBeInTheDocument()
    expect(screen.getByText(/Unsaved Session/i)).toBeInTheDocument()
  })

  it('renders export button and calls onExportCurrent when clicked', () => {
    const onExportCurrent = vi.fn()
    render(
      <NewReleaseDialog
        open={true}
        currentProject="PaymentService"
        currentVersion="1.0.0"
        totalItems={25}
        evidenceCount={18}
        hasBeenSaved={false}
        onExportCurrent={onExportCurrent}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const exportBtn = screen.getByRole('button', { name: /Save \/ Export Current State/i })
    expect(exportBtn).toBeInTheDocument()

    fireEvent.click(exportBtn)
    expect(onExportCurrent).toHaveBeenCalledTimes(1)

    // After clicking, button should update to confirmed state
    expect(screen.getByText(/Exported v1.0.0 to Disk/i)).toBeInTheDocument()
    expect(screen.getByText(/Backup exported successfully!/i)).toBeInTheDocument()
  })

  it('submits next suggested version and target branch on confirm', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <NewReleaseDialog
        open={true}
        currentProject="PaymentService"
        currentVersion="1.0.0"
        currentBranch="main"
        totalItems={25}
        evidenceCount={18}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Start New Release \/ PR/i })
    expect(submitBtn).toBeInTheDocument()

    fireEvent.click(submitBtn)
    expect(onConfirm).toHaveBeenCalledWith({
      version: '1.1.0',
      branch: 'main',
    })
    expect(onClose).toHaveBeenCalled()
  })
})
