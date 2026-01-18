import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children: React.ReactNode
      className?: string
    }) => <div className={className}>{children}</div>,
  },
}))

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders the toggle button', () => {
    renderWithTheme(<ThemeToggle />)
    expect(
      screen.getByRole('button', { name: /passer au thème/i })
    ).toBeInTheDocument()
  })

  it('shows appropriate aria-label for festive theme', () => {
    renderWithTheme(<ThemeToggle />)
    expect(screen.getByLabelText('Passer au thème sombre')).toBeInTheDocument()
  })

  it('toggles theme when clicked', () => {
    renderWithTheme(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Initially festive - should show "Passer au thème sombre"
    expect(button).toHaveAttribute('aria-label', 'Passer au thème sombre')

    // Click to toggle to dark
    fireEvent.click(button)

    // Now dark - should show "Passer au thème festif"
    expect(button).toHaveAttribute('aria-label', 'Passer au thème festif')
  })

  it('applies custom className', () => {
    renderWithTheme(<ThemeToggle className="custom-class" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('custom-class')
  })

  it('has correct styling for festive mode', () => {
    renderWithTheme(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-purple-500/30')
    expect(button.className).not.toContain('bg-slate-800')
  })

  it('changes styling after toggle to dark mode', () => {
    renderWithTheme(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Toggle to dark
    fireEvent.click(button)

    expect(button.className).toContain('bg-slate-800')
    expect(button.className).not.toContain('bg-purple-500/30')
  })

  it('renders sun and moon icons', () => {
    renderWithTheme(<ThemeToggle />)
    // Both icons should be present (in background and knob)
    // The button contains SVG icons
    const button = screen.getByRole('button')
    const svgs = button.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('maintains state across multiple toggles', () => {
    renderWithTheme(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Toggle to dark
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-label', 'Passer au thème festif')

    // Toggle back to festive
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-label', 'Passer au thème sombre')

    // Toggle to dark again
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-label', 'Passer au thème festif')
  })
})
