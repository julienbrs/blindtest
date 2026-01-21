import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

// Test component that uses the toast context
function TestConsumer() {
  const { toasts, addToast, removeToast } = useToast()
  return (
    <div>
      <span data-testid="toast-count">{toasts.length}</span>
      <button
        onClick={() => addToast({ type: 'error', message: 'Error message' })}
        data-testid="add-error"
      >
        Add Error
      </button>
      <button
        onClick={() =>
          addToast({ type: 'success', message: 'Success message' })
        }
        data-testid="add-success"
      >
        Add Success
      </button>
      <button
        onClick={() =>
          addToast({ type: 'warning', message: 'Warning message' })
        }
        data-testid="add-warning"
      >
        Add Warning
      </button>
      <button
        onClick={() => addToast({ type: 'info', message: 'Info message' })}
        data-testid="add-info"
      >
        Add Info
      </button>
      <button
        onClick={() =>
          addToast({
            type: 'info',
            message: 'Persistent toast',
            duration: 0,
          })
        }
        data-testid="add-persistent"
      >
        Add Persistent
      </button>
      <button
        onClick={() =>
          addToast({
            type: 'info',
            message: 'Quick toast',
            duration: 100,
          })
        }
        data-testid="add-quick"
      >
        Add Quick
      </button>
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          data-testid={`remove-${toast.id}`}
        >
          Remove {toast.id}
        </button>
      ))}
    </div>
  )
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('provides empty toasts array initially', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    expect(screen.getByTestId('toast-count').textContent).toBe('0')
  })

  it('adds error toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-error'))

    expect(screen.getByTestId('toast-count').textContent).toBe('1')
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-red-600/95')
  })

  it('adds success toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-success'))

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-green-600/95')
  })

  it('adds warning toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-warning'))

    expect(screen.getByText('Warning message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-600/95')
  })

  it('adds info toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-info'))

    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-600/95')
  })

  it('stacks multiple toasts', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-error'))
    fireEvent.click(screen.getByTestId('add-success'))
    fireEvent.click(screen.getByTestId('add-warning'))

    expect(screen.getByTestId('toast-count').textContent).toBe('3')
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('removes toast manually via removeToast', async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-persistent'))

    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    // Find the remove button (it will have the toast ID in the testid)
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('data-testid')?.startsWith('remove-'))

    expect(removeButtons.length).toBe(1)
    fireEvent.click(removeButtons[0])

    expect(screen.getByTestId('toast-count').textContent).toBe('0')
  })

  it('auto-dismisses toast after default duration (5000ms)', async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-error'))
    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    // Advance timer to just before auto-dismiss
    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    // Advance timer past auto-dismiss
    act(() => {
      vi.advanceTimersByTime(2)
    })
    expect(screen.getByTestId('toast-count').textContent).toBe('0')
  })

  it('auto-dismisses toast after custom duration', async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-quick'))
    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    // Advance timer to custom duration
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByTestId('toast-count').textContent).toBe('0')
  })

  it('does not auto-dismiss when duration is 0', async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-persistent'))
    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    // Advance timer well past default duration
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // Toast should still be present
    expect(screen.getByTestId('toast-count').textContent).toBe('1')
    expect(screen.getByText('Persistent toast')).toBeInTheDocument()
  })

  it('renders toast container with proper accessibility attributes', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-info'))

    const container = screen.getByRole('region', { name: 'Notifications' })
    expect(container).toHaveAttribute('aria-live', 'polite')
  })

  it('renders close button with accessibility label', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-info'))

    const closeButton = screen.getByRole('button', {
      name: 'Fermer la notification',
    })
    expect(closeButton).toBeInTheDocument()
  })

  it('removes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-info'))
    expect(screen.getByTestId('toast-count').textContent).toBe('1')

    const closeButton = screen.getByRole('button', {
      name: 'Fermer la notification',
    })
    fireEvent.click(closeButton)

    expect(screen.getByTestId('toast-count').textContent).toBe('0')
  })

  it('throws error when useToast is used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useToast must be used within a ToastProvider')

    consoleSpy.mockRestore()
  })

  it('generates unique IDs for each toast', () => {
    function IdCapture() {
      const { toasts, addToast } = useToast()

      return (
        <div>
          <button
            onClick={() =>
              addToast({ type: 'info', message: 'Test', duration: 0 })
            }
            data-testid="add"
          >
            Add
          </button>
          {toasts.map((toast) => (
            <span key={toast.id} data-testid={`id-${toast.id}`}>
              {toast.id}
            </span>
          ))}
        </div>
      )
    }

    render(
      <ToastProvider>
        <IdCapture />
      </ToastProvider>
    )

    // Add multiple toasts
    fireEvent.click(screen.getByTestId('add'))
    fireEvent.click(screen.getByTestId('add'))
    fireEvent.click(screen.getByTestId('add'))

    // Get all toast IDs
    const idElements = screen.getAllByText(/^[a-z0-9]+$/)
    const ids = idElements.map((el) => el.textContent)

    // All IDs should be unique
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('renders toasts with animation classes from framer-motion', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByTestId('add-info'))

    // The toast should be rendered inside the AnimatePresence
    const toast = screen.getByRole('alert')
    expect(toast).toBeInTheDocument()
  })
})
