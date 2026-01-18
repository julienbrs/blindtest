import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NetworkErrorToast } from './NetworkErrorToast'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('NetworkErrorToast', () => {
  const defaultProps = {
    show: true,
    onRetry: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when show is true', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    expect(screen.getByTestId('network-error-toast')).toBeInTheDocument()
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument()
  })

  it('does not render when show is false', () => {
    render(<NetworkErrorToast {...defaultProps} show={false} />)

    expect(screen.queryByTestId('network-error-toast')).not.toBeInTheDocument()
  })

  it('displays default error message', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    expect(
      screen.getByText(
        'Impossible de contacter le serveur. Vérifiez votre connexion.'
      )
    ).toBeInTheDocument()
  })

  it('displays custom error message when provided', () => {
    const customMessage = 'La requête a expiré après 10 secondes.'
    render(<NetworkErrorToast {...defaultProps} message={customMessage} />)

    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<NetworkErrorToast {...defaultProps} onRetry={onRetry} />)

    fireEvent.click(screen.getByTestId('network-error-retry'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders retry button with correct text', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    expect(screen.getByTestId('network-error-retry')).toHaveTextContent(
      'Réessayer'
    )
  })

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn()
    render(<NetworkErrorToast {...defaultProps} onDismiss={onDismiss} />)

    const dismissButton = screen.getByLabelText('Fermer')
    expect(dismissButton).toBeInTheDocument()

    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument()
  })

  it('has accessible role and aria-live attributes', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    const toast = screen.getByTestId('network-error-toast')
    expect(toast).toHaveAttribute('role', 'alert')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  it('includes warning icon', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    // Heroicons renders SVG elements
    const icon = screen.getByTestId('network-error-toast').querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    render(<NetworkErrorToast {...defaultProps} />)

    const toastInner = screen
      .getByTestId('network-error-toast')
      .querySelector('.bg-red-900\\/90')
    expect(toastInner).toBeInTheDocument()
  })
})
