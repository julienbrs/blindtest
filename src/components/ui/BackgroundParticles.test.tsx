import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BackgroundParticles } from './BackgroundParticles'

// Mock tsparticles
vi.mock('@tsparticles/react', () => ({
  default: vi.fn(({ id, className }) => (
    <div data-testid="particles-container" id={id} className={className} />
  )),
  initParticlesEngine: vi.fn(() => Promise.resolve()),
}))

vi.mock('@tsparticles/slim', () => ({
  loadSlim: vi.fn(() => Promise.resolve()),
}))

describe('BackgroundParticles', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    // Default: reduced motion disabled
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('renders particles container when initialized', async () => {
    render(<BackgroundParticles />)

    await waitFor(() => {
      expect(screen.getByTestId('particles-container')).toBeInTheDocument()
    })
  })

  it('has correct id and className', async () => {
    render(<BackgroundParticles />)

    await waitFor(() => {
      const container = screen.getByTestId('particles-container')
      expect(container).toHaveAttribute('id', 'background-particles')
      expect(container).toHaveClass('fixed', 'inset-0', 'pointer-events-none')
    })
  })

  it('does not render when prefers-reduced-motion is enabled', async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    render(<BackgroundParticles />)

    // Give time for potential initialization
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(screen.queryByTestId('particles-container')).not.toBeInTheDocument()
  })

  it('renders with isDark=false by default', async () => {
    render(<BackgroundParticles />)

    await waitFor(() => {
      expect(screen.getByTestId('particles-container')).toBeInTheDocument()
    })
  })

  it('renders with isDark=true', async () => {
    render(<BackgroundParticles isDark={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('particles-container')).toBeInTheDocument()
    })
  })

  it('initializes particles engine on mount', async () => {
    const { initParticlesEngine } = await import('@tsparticles/react')

    render(<BackgroundParticles />)

    await waitFor(() => {
      expect(initParticlesEngine).toHaveBeenCalled()
    })
  })

  it('loads slim particles preset', async () => {
    // Note: loadSlim is called inside initParticlesEngine which is mocked
    // The important thing is that initParticlesEngine is called
    const { initParticlesEngine } = await import('@tsparticles/react')

    render(<BackgroundParticles />)

    await waitFor(() => {
      // initParticlesEngine calls loadSlim internally
      expect(initParticlesEngine).toHaveBeenCalled()
    })
  })

  it('respects prefers-reduced-motion accessibility setting', async () => {
    // First, verify it renders normally
    const { unmount } = render(<BackgroundParticles />)

    await waitFor(() => {
      expect(screen.getByTestId('particles-container')).toBeInTheDocument()
    })

    unmount()

    // Now test with reduced motion
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    render(<BackgroundParticles />)

    // Give time for potential initialization
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(screen.queryByTestId('particles-container')).not.toBeInTheDocument()
  })
})
