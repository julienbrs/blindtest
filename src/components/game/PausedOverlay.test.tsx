import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PausedOverlay } from './PausedOverlay'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode
      [key: string]: unknown
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => false,
}))

describe('PausedOverlay', () => {
  it('should not render when show is false', () => {
    render(<PausedOverlay show={false} onResume={() => {}} />)

    expect(screen.queryByTestId('paused-overlay')).not.toBeInTheDocument()
  })

  it('should render when show is true', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    expect(screen.getByTestId('paused-overlay')).toBeInTheDocument()
  })

  it('should display "Partie en pause" message', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    expect(screen.getByText('Partie en pause')).toBeInTheDocument()
  })

  it('should display explanation message when onResume is provided', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    expect(
      screen.getByText('La partie a été mise en pause.')
    ).toBeInTheDocument()
  })

  it('should display host paused message when onResume is not provided', () => {
    render(<PausedOverlay show={true} />)

    expect(
      screen.getByText("L'hôte a mis la partie en pause.")
    ).toBeInTheDocument()
  })

  it('should not show resume button when onResume is not provided', () => {
    render(<PausedOverlay show={true} />)

    expect(screen.queryByTestId('resume-button')).not.toBeInTheDocument()
  })

  it('should render resume button', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    expect(screen.getByTestId('resume-button')).toBeInTheDocument()
    expect(screen.getByText('Reprendre')).toBeInTheDocument()
  })

  it('should call onResume when resume button is clicked', () => {
    const handleResume = vi.fn()
    render(<PausedOverlay show={true} onResume={handleResume} />)

    fireEvent.click(screen.getByTestId('resume-button'))

    expect(handleResume).toHaveBeenCalledTimes(1)
  })

  it('should have overlay styling (fixed, full screen, centered)', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    const overlay = screen.getByTestId('paused-overlay')
    expect(overlay).toHaveClass('fixed')
    expect(overlay).toHaveClass('inset-0')
    expect(overlay).toHaveClass('flex')
    expect(overlay).toHaveClass('items-center')
    expect(overlay).toHaveClass('justify-center')
  })

  it('should have backdrop blur effect', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    const overlay = screen.getByTestId('paused-overlay')
    expect(overlay).toHaveClass('backdrop-blur-sm')
  })

  it('should display pause icon', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    // The PauseIcon component from Heroicons should be rendered
    // It has an SVG element
    const overlay = screen.getByTestId('paused-overlay')
    const svgElement = overlay.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
  })

  it('should be accessible with proper z-index', () => {
    render(<PausedOverlay show={true} onResume={() => {}} />)

    const overlay = screen.getByTestId('paused-overlay')
    expect(overlay).toHaveClass('z-50')
  })
})
