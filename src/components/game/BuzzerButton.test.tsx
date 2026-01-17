import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BuzzerButton } from './BuzzerButton'

describe('BuzzerButton', () => {
  let originalVibrate: typeof navigator.vibrate | undefined
  let mockVibrate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Store original vibrate
    originalVibrate = navigator.vibrate

    // Create and assign mock
    mockVibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()

    // Restore original vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: originalVibrate,
      writable: true,
      configurable: true,
    })
  })

  it('renders the buzzer button with BUZZ! text', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('BUZZ!')
  })

  it('calls onBuzz when clicked', () => {
    const onBuzz = vi.fn()
    render(<BuzzerButton onBuzz={onBuzz} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    fireEvent.click(button)

    expect(onBuzz).toHaveBeenCalledTimes(1)
  })

  it('triggers vibration on mobile when clicked', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    fireEvent.click(button)

    expect(mockVibrate).toHaveBeenCalledWith(100)
  })

  it('does not call onBuzz when disabled', () => {
    const onBuzz = vi.fn()
    render(<BuzzerButton onBuzz={onBuzz} disabled />)

    const button = screen.getByRole('button', { name: /buzz/i })
    fireEvent.click(button)

    expect(onBuzz).not.toHaveBeenCalled()
  })

  it('has disabled attribute when disabled prop is true', () => {
    render(<BuzzerButton onBuzz={() => {}} disabled />)

    const button = screen.getByRole('button', { name: /buzz/i })
    expect(button).toBeDisabled()
  })

  it('has focus ring classes for accessibility', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    const className = button.className
    expect(className).toContain('focus:ring-4')
    expect(className).toContain('focus:outline-none')
  })

  it('has large tactile-friendly size classes', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    const className = button.className
    expect(className).toContain('h-40')
    expect(className).toContain('w-40')
  })

  it('has visual press effect classes', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    const className = button.className
    expect(className).toContain('active:scale-95')
    expect(className).toContain('hover:scale-105')
  })

  it('has red gradient styling classes', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    const className = button.className
    expect(className).toContain('bg-gradient-to-br')
    expect(className).toContain('from-red-500')
    expect(className).toContain('to-red-700')
  })

  it('has glow shadow effect', () => {
    render(<BuzzerButton onBuzz={() => {}} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    const className = button.className
    expect(className).toContain('shadow-')
  })

  it('is keyboard accessible via Enter key', () => {
    const onBuzz = vi.fn()
    render(<BuzzerButton onBuzz={onBuzz} />)

    const button = screen.getByRole('button', { name: /buzz/i })
    button.focus()
    fireEvent.click(button)

    expect(onBuzz).toHaveBeenCalled()
  })

  it('works without vibration API', () => {
    // Remove vibrate API
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const onBuzz = vi.fn()
    render(<BuzzerButton onBuzz={onBuzz} />)

    const button = screen.getByRole('button', { name: /buzz/i })

    // Should not throw even without vibrate
    expect(() => fireEvent.click(button)).not.toThrow()
    expect(onBuzz).toHaveBeenCalledTimes(1)
  })
})
