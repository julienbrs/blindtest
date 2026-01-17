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

  describe('songs played display', () => {
    it('uses singular form for one song', () => {
      const { container } = render(<ScoreDisplay score={1} songsPlayed={1} />)

      // textContent combines all text nodes, allowing us to check the full text
      const songsPlayedDiv = container.querySelectorAll('.text-purple-300')[1]
      expect(songsPlayedDiv?.textContent).toContain('1 chanson jouée')
    })

    it('uses plural form for multiple songs', () => {
      const { container } = render(<ScoreDisplay score={2} songsPlayed={2} />)

      const songsPlayedDiv = container.querySelectorAll('.text-purple-300')[1]
      expect(songsPlayedDiv?.textContent).toContain('2 chanson')
      expect(songsPlayedDiv?.textContent).toContain('jouée')
    })

    it('uses plural form for zero songs', () => {
      const { container } = render(<ScoreDisplay score={0} songsPlayed={0} />)

      const songsPlayedDiv = container.querySelectorAll('.text-purple-300')[1]
      expect(songsPlayedDiv?.textContent).toContain('0 chanson')
      expect(songsPlayedDiv?.textContent).toContain('jouée')
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
