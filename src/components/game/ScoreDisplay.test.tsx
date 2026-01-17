import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from './ScoreDisplay'

describe('ScoreDisplay', () => {
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

      const scoreValue = container.querySelector('.text-2xl')
      expect(scoreValue).toBeInTheDocument()
    })
  })
})
