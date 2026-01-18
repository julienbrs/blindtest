/**
 * Orientation Tests (Issue 9.6)
 *
 * Tests verify that landscape/portrait orientation classes are properly applied
 * to adapt the layout based on screen orientation.
 *
 * The portrait: and landscape: variants are custom Tailwind screen breakpoints
 * using @media (orientation: portrait) and @media (orientation: landscape)
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { Timer } from '@/components/game/Timer'
import { SongReveal } from '@/components/game/SongReveal'
import type { Song } from '@/lib/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <button className={className} {...props}>
        {children}
      </button>
    ),
    p: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
    circle: (props: object) => <circle {...props} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => false,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    alt,
    className,
    ...props
  }: {
    alt: string
    className?: string
  }) => <img alt={alt} className={className} {...props} />,
}))

afterEach(cleanup)

// Type for tailwind config screens object
interface ScreenConfig {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

describe('Orientation: Tailwind Config', () => {
  it('should have standard breakpoints configured', async () => {
    const tailwindConfig = await import('../../tailwind.config')
    const config = tailwindConfig.default
    const screens = config.theme?.screens as ScreenConfig | undefined

    expect(screens?.sm).toBe('640px')
    expect(screens?.md).toBe('768px')
    expect(screens?.lg).toBe('1024px')
    expect(screens?.xl).toBe('1280px')
    expect(screens?.['2xl']).toBe('1536px')
  })

  it('should have portrait and landscape variants defined in globals.css', async () => {
    // In Tailwind v4, orientation variants are defined using @variant in CSS
    // This test verifies the CSS file contains the expected declarations
    const fs = await import('fs')
    const path = await import('path')
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toContain('@variant portrait')
    expect(cssContent).toContain('@variant landscape')
    expect(cssContent).toContain('(orientation: portrait)')
    expect(cssContent).toContain('(orientation: landscape)')
  })
})

describe('Orientation: BuzzerButton', () => {
  it('should have landscape size classes for smaller button in landscape mode', () => {
    render(<BuzzerButton onBuzz={vi.fn()} />)

    const button = screen.getByRole('button', { name: /buzz/i })

    // Check that landscape-specific classes are present
    expect(button.className).toContain('landscape:h-24')
    expect(button.className).toContain('landscape:w-24')
    expect(button.className).toContain('landscape:md:h-32')
    expect(button.className).toContain('landscape:md:w-32')
    expect(button.className).toContain('landscape:text-lg')
  })

  it('should have default portrait size classes', () => {
    render(<BuzzerButton onBuzz={vi.fn()} />)

    const button = screen.getByRole('button', { name: /buzz/i })

    // Check base (portrait) size classes
    expect(button.className).toContain('h-32')
    expect(button.className).toContain('w-32')
    expect(button.className).toContain('sm:h-40')
    expect(button.className).toContain('sm:w-40')
    expect(button.className).toContain('md:h-48')
    expect(button.className).toContain('md:w-48')
  })
})

describe('Orientation: Timer', () => {
  it('should have landscape size classes for smaller timer in landscape mode', () => {
    render(<Timer duration={10} remaining={5} />)

    // Find the timer circle container by its classes
    const timerContainer = document
      .querySelector('.relative')
      ?.closest('.flex.flex-col')

    expect(timerContainer?.className).toContain('landscape:gap-1')

    // Find the circle container div
    const circleDiv = document.querySelector('.relative.h-24')

    expect(circleDiv?.className).toContain('landscape:h-20')
    expect(circleDiv?.className).toContain('landscape:w-20')
    expect(circleDiv?.className).toContain('landscape:md:h-24')
    expect(circleDiv?.className).toContain('landscape:md:w-24')
  })

  it('should have landscape text size classes', () => {
    const { container } = render(<Timer duration={10} remaining={5} />)

    // Find the number display div
    const numberDiv = container.querySelector('.absolute.inset-0')

    expect(numberDiv?.className).toContain('landscape:text-2xl')
    expect(numberDiv?.className).toContain('landscape:md:text-3xl')
  })

  it('should have landscape classes on label text', () => {
    render(<Timer duration={10} remaining={5} />)

    const label = screen.getByText('Temps pour répondre...')

    expect(label.className).toContain('landscape:text-xs')
  })
})

describe('Orientation: SongReveal', () => {
  const mockSong: Song = {
    id: 'test123',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    format: 'mp3' as const,
    filePath: '/path/to/test.mp3',
    hasCover: true,
  }

  it('should have landscape size classes for smaller cover in landscape mode', () => {
    const { container } = render(
      <SongReveal song={mockSong} isRevealed={false} guessMode="both" />
    )

    // Find the cover container
    const coverContainer = container.querySelector('.relative.h-48')

    expect(coverContainer?.className).toContain('landscape:h-36')
    expect(coverContainer?.className).toContain('landscape:w-36')
    expect(coverContainer?.className).toContain('landscape:md:h-48')
    expect(coverContainer?.className).toContain('landscape:md:w-48')
  })

  it('should have landscape gap class on container', () => {
    const { container } = render(
      <SongReveal song={mockSong} isRevealed={true} guessMode="both" />
    )

    // Find the main container
    const mainContainer = container.querySelector('.flex.flex-col.items-center')

    expect(mainContainer?.className).toContain('landscape:gap-2')
  })

  it('should have landscape classes on loading state', () => {
    const { container } = render(
      <SongReveal song={null} isRevealed={false} guessMode="both" />
    )

    // Find the loading placeholder
    const loadingContainer = container.querySelector('.flex.h-48')

    expect(loadingContainer?.className).toContain('landscape:h-36')
    expect(loadingContainer?.className).toContain('landscape:w-36')
  })
})

describe('Orientation: Game Page Layout', () => {
  it('should use landscape:flex-row for horizontal layout in landscape mode', async () => {
    // Import the game page content to verify the CSS classes are present
    // We can't easily test the actual page component due to hooks,
    // but we can verify the class patterns exist in the codebase
    const fs = await import('fs/promises')
    const path = await import('path')

    const gamePage = await fs.readFile(
      path.join(process.cwd(), 'src/app/game/page.tsx'),
      'utf-8'
    )

    // Verify the main content area has orientation classes
    expect(gamePage).toContain('portrait:flex-col')
    expect(gamePage).toContain('landscape:flex-row')
    expect(gamePage).toContain('landscape:w-64')
    expect(gamePage).toContain('landscape:flex-shrink-0')
    expect(gamePage).toContain('landscape:gap-2')
  })
})

describe('Orientation: Acceptance Criteria', () => {
  it('should have layout adapted for landscape mode', async () => {
    const fs = await import('fs/promises')
    const path = await import('path')

    const gamePage = await fs.readFile(
      path.join(process.cwd(), 'src/app/game/page.tsx'),
      'utf-8'
    )

    // Layout uses landscape:flex-row for horizontal arrangement
    expect(gamePage).toContain('landscape:flex-row')
  })

  it('should keep all elements accessible (not cut off) with responsive sizes', () => {
    // Verify components have both base sizes and landscape-specific sizes
    // to ensure elements adapt without getting cut off

    render(<BuzzerButton onBuzz={vi.fn()} />)
    const button = screen.getByRole('button', { name: /buzz/i })

    // Buzzer has both base and landscape sizes
    expect(button.className).toMatch(/h-32.*landscape:h-24/)

    cleanup()

    render(<Timer duration={10} remaining={5} />)
    const timerDiv = document.querySelector('.relative.h-24')

    // Timer has both base and landscape sizes
    expect(timerDiv?.className).toMatch(/h-24.*landscape:h-20/)

    cleanup()

    const testSong: Song = {
      id: 'test123',
      title: 'Test Song',
      artist: 'Test Artist',
      duration: 180,
      format: 'mp3' as const,
      filePath: '/path/to/test.mp3',
      hasCover: true,
    }

    const { container } = render(
      <SongReveal song={testSong} isRevealed={false} guessMode="both" />
    )
    const coverContainer = container.querySelector('.relative.h-48')

    // Cover has both base and landscape sizes
    expect(coverContainer?.className).toMatch(/h-48.*landscape:h-36/)
  })

  it('should keep buzzer always accessible with minimum touch target size', () => {
    render(<BuzzerButton onBuzz={vi.fn()} />)
    const button = screen.getByRole('button', { name: /buzz/i })

    // Even in landscape mode (h-24 = 96px), buzzer is larger than 44px minimum
    // landscape:h-24 = 6rem = 96px > 44px
    expect(button.className).toContain('landscape:h-24')
    expect(button.className).toContain('landscape:w-24')

    // The 24 in Tailwind is 6rem = 96px, which is > 48px touch target recommendation
    // This ensures the buzzer remains accessible in landscape mode
  })
})
