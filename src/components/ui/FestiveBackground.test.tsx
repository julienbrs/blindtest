import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FestiveBackground } from './FestiveBackground'

describe('FestiveBackground', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the background container', () => {
    const { container } = render(<FestiveBackground />)
    const background = container.querySelector('.fixed.inset-0')
    expect(background).toBeInTheDocument()
  })

  it('renders the animated gradient layer', () => {
    const { container } = render(<FestiveBackground />)
    const gradient = container.querySelector('.animate-gradient-shift')
    expect(gradient).toBeInTheDocument()
  })

  it('renders floating orbs when motion is allowed', () => {
    const { container } = render(<FestiveBackground />)
    const orbs = container.querySelectorAll('.animate-float-orb')
    expect(orbs.length).toBe(6)
  })

  it('renders vignette overlay for depth', () => {
    const { container } = render(<FestiveBackground />)
    const vignette = container.querySelector('.pointer-events-none')
    expect(vignette).toBeInTheDocument()
  })

  it('orbs have blur filter applied', () => {
    const { container } = render(<FestiveBackground />)
    const orbs = container.querySelectorAll('.animate-float-orb')
    orbs.forEach((orb) => {
      expect((orb as HTMLElement).style.filter).toBe('blur(60px)')
    })
  })

  it('orbs have varied sizes', () => {
    const { container } = render(<FestiveBackground />)
    const orbs = container.querySelectorAll('.animate-float-orb')
    const sizes = Array.from(orbs).map(
      (orb) => (orb as HTMLElement).style.width
    )
    // Sizes should be varied (pre-defined values)
    const uniqueSizes = new Set(sizes)
    expect(uniqueSizes.size).toBeGreaterThan(1)
  })

  it('respects prefers-reduced-motion preference', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { container } = render(<FestiveBackground />)
    // When reduced motion is preferred, only static gradient is rendered
    const orbs = container.querySelectorAll('.animate-float-orb')
    expect(orbs.length).toBe(0)
    // Static background should still be present
    const background = container.querySelector('.fixed.inset-0')
    expect(background).toBeInTheDocument()
  })

  it('background has negative z-index to stay behind content', () => {
    const { container } = render(<FestiveBackground />)
    const background = container.querySelector('.-z-10')
    expect(background).toBeInTheDocument()
  })

  it('has overflow hidden to contain orbs', () => {
    const { container } = render(<FestiveBackground />)
    const background = container.querySelector('.overflow-hidden')
    expect(background).toBeInTheDocument()
  })

  it('orbs have color classes applied', () => {
    const { container } = render(<FestiveBackground />)
    const orbs = container.querySelectorAll('.animate-float-orb')
    const colorClasses = [
      'bg-pink-500/30',
      'bg-purple-500/30',
      'bg-indigo-500/30',
      'bg-fuchsia-500/25',
      'bg-violet-500/25',
    ]

    orbs.forEach((orb) => {
      const hasColorClass = colorClasses.some((colorClass) =>
        orb.classList.contains(colorClass)
      )
      expect(hasColorClass).toBe(true)
    })
  })
})
