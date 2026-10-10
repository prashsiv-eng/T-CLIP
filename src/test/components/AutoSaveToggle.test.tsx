import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AutoSaveToggle } from '../../components/layout/AutoSaveToggle'

describe('AutoSaveToggle', () => {
  it('renders with Auto-save label and OFF state when disabled', () => {
    const onToggle = vi.fn()
    render(
      <AutoSaveToggle
        enabled={false}
        status="off"
        target="none"
        onToggle={onToggle}
      />
    )

    expect(screen.getByText('Auto-save')).toBeInTheDocument()
    expect(screen.getByText('OFF')).toBeInTheDocument()

    const toggleSwitch = screen.getByRole('switch', { name: /toggle auto-save/i })
    expect(toggleSwitch).not.toBeChecked()

    fireEvent.click(toggleSwitch)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders active state with Saved to Disk when target is disk', () => {
    render(
      <AutoSaveToggle
        enabled={true}
        status="saved"
        target="disk"
        fileName="my-checklist.json"
        lastSavedAt="2026-10-10T12:00:00.000Z"
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText('Auto-save')).toBeInTheDocument()
    expect(screen.getByText('Saved to Disk')).toBeInTheDocument()

    const toggleSwitch = screen.getByRole('switch', { name: /toggle auto-save/i })
    expect(toggleSwitch).toBeChecked()
  })

  it('renders browser session label when target is browser', () => {
    render(
      <AutoSaveToggle
        enabled={true}
        status="saved"
        target="browser"
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText('Auto-save')).toBeInTheDocument()
    expect(screen.getByText('Browser session')).toBeInTheDocument()
  })

  it('renders Saving… status indicator when status is saving', () => {
    render(
      <AutoSaveToggle
        enabled={true}
        status="saving"
        target="disk"
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('renders Connect File button when browser target and FS is supported', () => {
    ;(window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi.fn()
    const onConnectDisk = vi.fn()

    render(
      <AutoSaveToggle
        enabled={true}
        status="saved"
        target="browser"
        onToggle={vi.fn()}
        onConnectDisk={onConnectDisk}
      />
    )

    const connectBtn = screen.getByRole('button', { name: /connect file/i })
    expect(connectBtn).toBeInTheDocument()

    fireEvent.click(connectBtn)
    expect(onConnectDisk).toHaveBeenCalledTimes(1)

    delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker
  })
})
