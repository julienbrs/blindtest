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

  describe('dark theme', () => {
    it('renders darker gradient when isDark is true', () => {
      const { container } = render(<FestiveBackground isDark />)
      const gradient = container.querySelector('.animate-gradient-shift')
      expect(gradient).toBeInTheDocument()
      // Check that the gradient style contains dark colors (browsers convert hex to RGB)
      const style = (gradient as HTMLElement)?.style.background
      // #0f0a1f = rgb(15, 10, 31)
      expect(style).toContain('rgb(15, 10, 31)')
    })

    it('uses darker orb colors when isDark is true', () => {
      const { container } = render(<FestiveBackground isDark />)
      const orbs = container.querySelectorAll('.animate-float-orb')
      const darkColorClasses = [
        'bg-purple-900/20',
        'bg-indigo-900/20',
        'bg-slate-800/20',
        'bg-violet-900/15',
        'bg-blue-900/15',
      ]

      orbs.forEach((orb) => {
        const hasDarkColorClass = darkColorClasses.some((colorClass) =>
          orb.classList.contains(colorClass)
        )
        expect(hasDarkColorClass).toBe(true)
      })
    })

    it('uses festive gradient by default (isDark=false)', () => {
      const { container } = render(<FestiveBackground isDark={false} />)
      const gradient = container.querySelector('.animate-gradient-shift')
      const style = (gradient as HTMLElement)?.style.background
      // Browsers convert hex to RGB: #581c87 = rgb(88, 28, 135), #be185d = rgb(190, 24, 93)
      expect(style).toContain('rgb(88, 28, 135)') // Festive purple
      expect(style).toContain('rgb(190, 24, 93)') // Festive pink
    })

    it('applies transition classes for smooth theme change', () => {
      const { container } = render(<FestiveBackground isDark />)
      const gradient = container.querySelector('.transition-all')
      expect(gradient).toBeInTheDocument()
    })

    it('has darker vignette in dark mode', () => {
      const { container } = render(<FestiveBackground isDark />)
      const vignette = container.querySelector('.pointer-events-none')
      const style = (vignette as HTMLElement)?.style.background
      expect(style).toContain('0.5') // Darker opacity in dark mode
    })

    it('respects reduced motion in dark mode too', () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { container } = render(<FestiveBackground isDark />)
      // Static background only
      const orbs = container.querySelectorAll('.animate-float-orb')
      expect(orbs.length).toBe(0)
      // Should still have the dark gradient (browsers convert hex to RGB)
      const background = container.querySelector('.fixed.inset-0')
      const style = (background as HTMLElement)?.style.background
      // #0f0a1f = rgb(15, 10, 31)
      expect(style).toContain('rgb(15, 10, 31)')
    })
  })
})
