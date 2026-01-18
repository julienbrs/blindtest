import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

// Test component that uses the theme context
function TestConsumer() {
  const { theme, isDark, toggle, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
      <button onClick={toggle} data-testid="toggle">
        Toggle
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('festive')} data-testid="set-festive">
        Set Festive
      </button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('provides default festive theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('festive')
    expect(screen.getByTestId('is-dark').textContent).toBe('no')
  })

  it('toggles between festive and dark themes', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Initially festive
    expect(screen.getByTestId('theme').textContent).toBe('festive')

    // Toggle to dark
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('is-dark').textContent).toBe('yes')

    // Toggle back to festive
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('festive')
    expect(screen.getByTestId('is-dark').textContent).toBe('no')
  })

  it('sets theme directly with setTheme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Set to dark
    fireEvent.click(screen.getByTestId('set-dark'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')

    // Set to festive
    fireEvent.click(screen.getByTestId('set-festive'))
    expect(screen.getByTestId('theme').textContent).toBe('festive')
  })

  it('persists theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Wait for initial mount
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Toggle to dark
    fireEvent.click(screen.getByTestId('toggle'))

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Check localStorage
    expect(localStorage.getItem('blindtest_theme')).toBe('dark')
  })

  it('loads saved theme from localStorage', async () => {
    // Pre-set localStorage
    localStorage.setItem('blindtest_theme', 'dark')

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('is-dark').textContent).toBe('yes')
  })

  it('ignores invalid localStorage values', async () => {
    // Pre-set localStorage with invalid value
    localStorage.setItem('blindtest_theme', 'invalid')

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Wait for effect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Should stay on default festive theme
    expect(screen.getByTestId('theme').textContent).toBe('festive')
  })

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
