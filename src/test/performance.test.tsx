/**
 * Performance optimization tests for mobile devices
 * Tests for issue 9.5: Optimiser les performances mobile
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SongReveal } from '@/components/game/SongReveal'
import type { Song } from '@/lib/types'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    sizes,
    quality,
    placeholder,
    blurDataURL,
    priority,
    className,
  }: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    quality?: number
    placeholder?: string
    blurDataURL?: string
    priority?: boolean
    className?: string
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      data-sizes={sizes}
      data-quality={quality}
      data-placeholder={placeholder}
      data-blur-data-url={blurDataURL}
      data-priority={priority}
      className={className}
    />
  ),
}))

describe('Performance Optimizations', () => {
  const mockSong: Song = {
    id: 'abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    format: 'mp3',
    filePath: '/test/path.mp3',
    hasCover: true,
  }

  describe('Image Optimization', () => {
    it('uses optimized quality setting (75)', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)
      const img = screen.getByAltText('Pochette album')
      expect(img.getAttribute('data-quality')).toBe('75')
    })

    it('uses blur placeholder for instant loading', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)
      const img = screen.getByAltText('Pochette album')
      expect(img.getAttribute('data-placeholder')).toBe('blur')
      expect(img.getAttribute('data-blur-data-url')).toContain('data:image/png')
    })

    it('uses responsive sizes attribute', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)
      const img = screen.getByAltText('Pochette album')
      const sizes = img.getAttribute('data-sizes')
      expect(sizes).toContain('max-width: 640px')
      expect(sizes).toContain('192px')
      expect(sizes).toContain('224px')
      expect(sizes).toContain('256px')
    })

    it('marks album cover as priority for faster loading', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)
      const img = screen.getByAltText('Pochette album')
      expect(img.getAttribute('data-priority')).toBe('true')
    })
  })
})

describe('CSS Performance Optimizations', () => {
  it('globals.css has prefers-reduced-motion media query', async () => {
    // This is more of an integration test - we verify the CSS file has the rule
    // by checking the globals.css content
    const fs = await import('fs')
    const path = await import('path')
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)')
    expect(cssContent).toContain('animation-duration: 0.01ms !important')
    expect(cssContent).toContain('transition-duration: 0.01ms !important')
  })

  it('globals.css has will-change optimization for animated elements', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toContain('will-change: transform, opacity')
    expect(cssContent).toContain('transform: translateZ(0)')
  })
})

describe('AudioPlayer Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('AudioPlayer has debounce function defined', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const audioPlayerPath = path.resolve(
      process.cwd(),
      'src/components/game/AudioPlayer.tsx'
    )
    const content = fs.readFileSync(audioPlayerPath, 'utf-8')

    // Verify debounce function is defined
    expect(content).toContain('function debounce')
    // Verify it's used for time updates
    expect(content).toContain('debouncedSetTime')
    expect(content).toContain('debounce((time: number)')
  })
})

describe('Mobile Optimizations', () => {
  it('BackgroundParticles has mobile detection', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const particlesPath = path.resolve(
      process.cwd(),
      'src/components/ui/BackgroundParticles.tsx'
    )
    const content = fs.readFileSync(particlesPath, 'utf-8')

    // Check mobile detection hook
    expect(content).toContain('useIsMobile')
    expect(content).toContain('isMobile')
    // Check reduced particle count on mobile
    expect(content).toContain('isMobile ? 15 : 30')
    // Check reduced FPS on mobile
    expect(content).toContain('isMobile ? 30 : 60')
  })

  it('FestiveBackground has mobile optimization', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const backgroundPath = path.resolve(
      process.cwd(),
      'src/components/ui/FestiveBackground.tsx'
    )
    const content = fs.readFileSync(backgroundPath, 'utf-8')

    // Check mobile detection
    expect(content).toContain('useIsMobile')
    // Check reduced orbs on mobile
    expect(content).toContain('PRE_GENERATED_ORBS.slice(0, 3)')
    // Check reduced blur on mobile
    expect(content).toContain("isMobile ? 'blur(40px)' : 'blur(60px)'")
  })
})
