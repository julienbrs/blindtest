import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      initial,
      animate: _animate,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: object | boolean
      animate?: object
    }) => {
      // Apply initial styles for testing the animation effect
      const style =
        typeof initial === 'object'
          ? { color: (initial as { color?: string }).color }
          : {}
      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      )
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: vi.fn(() => false),
}))

import { ScoreDisplay } from './ScoreDisplay'
import { useReducedMotion } from 'framer-motion'

describe('ScoreDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  describe('score display', () => {
    it('renders score with label', () => {
      render(<ScoreDisplay score={5} songsPlayed={3} />)

      expect(screen.getByText('Score')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays zero score correctly', () => {
      render(<ScoreDisplay score={0} songsPlayed={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('displays high scores correctly', () => {
      render(<ScoreDisplay score={100} songsPlayed={50} />)

      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })

  describe('song number display', () => {
    it('shows current song number calculated from songsPlayed', () => {
      render(<ScoreDisplay score={0} songsPlayed={4} />)

      // Current song is songsPlayed + 1 = 5
      expect(screen.getByText('Chanson 5')).toBeInTheDocument()
    })

    it('shows Chanson 1 when no songs played yet', () => {
      render(<ScoreDisplay score={0} songsPlayed={0} />)

      expect(screen.getByText('Chanson 1')).toBeInTheDocument()
    })

    it('uses explicit currentSongNumber when provided', () => {
      render(<ScoreDisplay score={0} songsPlayed={3} currentSongNumber={10} />)

      expect(screen.getByText('Chanson 10')).toBeInTheDocument()
    })

    it('updates song number with each new song', () => {
      const { rerender } = render(<ScoreDisplay score={0} songsPlayed={0} />)
      expect(screen.getByText('Chanson 1')).toBeInTheDocument()

      rerender(<ScoreDisplay score={1} songsPlayed={1} />)
      expect(screen.getByText('Chanson 2')).toBeInTheDocument()

      rerender(<ScoreDisplay score={2} songsPlayed={2} />)
      expect(screen.getByText('Chanson 3')).toBeInTheDocument()
    })

    it('has prominent styling for song number', () => {
      render(<ScoreDisplay score={0} songsPlayed={0} />)

      const songNumber = screen.getByText('Chanson 1')
      expect(songNumber).toHaveClass('font-semibold', 'text-white')
    })
  })

  describe('songs played display', () => {
    it('uses singular form for one song', () => {
      render(<ScoreDisplay score={1} songsPlayed={1} />)

      expect(screen.getByText('1 jouée')).toBeInTheDocument()
    })

    it('uses plural form for multiple songs', () => {
      render(<ScoreDisplay score={2} songsPlayed={2} />)

      expect(screen.getByText('2 jouées')).toBeInTheDocument()
    })

    it('uses plural form for zero songs', () => {
      render(<ScoreDisplay score={0} songsPlayed={0} />)

      expect(screen.getByText('0 jouées')).toBeInTheDocument()
    })
  })

  describe('score pop animation', () => {
    it('animates score when it increases', async () => {
      const { rerender } = render(<ScoreDisplay score={0} songsPlayed={0} />)

      // Score increases
      rerender(<ScoreDisplay score={1} songsPlayed={1} />)

      // The new score should be rendered (animation starts)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('renders score with initial green color during animation', () => {
      vi.mocked(useReducedMotion).mockReturnValue(false)

      const { rerender, container } = render(
        <ScoreDisplay score={0} songsPlayed={0} />
      )

      // Score increases - animation should apply green color initially
      rerender(<ScoreDisplay score={1} songsPlayed={1} />)

      // Check that the score element exists and has the expected styling
      // Mobile-first: text-xl on mobile, sm:text-2xl on larger screens
      const scoreValue = container.querySelector('.text-xl')
      expect(scoreValue).toBeInTheDocument()
      // In the mock, initial styles are applied, so color should be green
      expect(scoreValue).toHaveStyle({ color: '#22c55e' })
    })

    it('disables animation when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true)

      const { rerender, container } = render(
        <ScoreDisplay score={0} songsPlayed={0} />
      )

      // Score increases
      rerender(<ScoreDisplay score={1} songsPlayed={1} />)

      // Score should still be displayed
      expect(screen.getByText('1')).toBeInTheDocument()

      // No special styling should be applied when reduced motion is preferred
      // Mobile-first: text-xl on mobile, sm:text-2xl on larger screens
      const scoreValue = container.querySelector('.text-xl')
      expect(scoreValue).not.toHaveStyle({ color: '#22c55e' })
    })
  })

  describe('styling', () => {
    it('has glass-effect background on score section', () => {
      const { container } = render(<ScoreDisplay score={5} songsPlayed={3} />)

      const scoreSection = container.querySelector('.bg-white\\/10')
      expect(scoreSection).toBeInTheDocument()
    })

    it('applies correct text styling', () => {
      const { container } = render(<ScoreDisplay score={5} songsPlayed={3} />)

      const scoreLabel = container.querySelector('.text-purple-300')
      expect(scoreLabel).toBeInTheDocument()

      // Mobile-first: text-xl on mobile, sm:text-2xl on larger screens
      const scoreValue = container.querySelector('.text-xl')
      expect(scoreValue).toBeInTheDocument()
    })

    it('has relative positioning for score container', () => {
      const { container } = render(<ScoreDisplay score={5} songsPlayed={3} />)

      const scoreContainer = container.querySelector('.relative')
      expect(scoreContainer).toBeInTheDocument()
    })
  })
})
