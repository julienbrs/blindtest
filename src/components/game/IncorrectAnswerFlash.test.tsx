import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IncorrectAnswerFlash } from './IncorrectAnswerFlash'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      'data-testid': testId,
      animate,
    }: {
      children?: React.ReactNode
      className?: string
      'data-testid'?: string
      animate?: { opacity: number[] }
    }) => (
      <div
        className={className}
        data-testid={testId}
        data-animate={JSON.stringify(animate)}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: vi.fn(() => false),
}))

describe('IncorrectAnswerFlash', () => {
  it('renders when show is true', () => {
    render(<IncorrectAnswerFlash show={true} />)
    expect(screen.getByTestId('incorrect-answer-flash')).toBeInTheDocument()
  })

  it('does not render when show is false', () => {
    render(<IncorrectAnswerFlash show={false} />)
    expect(
      screen.queryByTestId('incorrect-answer-flash')
    ).not.toBeInTheDocument()
  })

  it('has red background color class', () => {
    render(<IncorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('incorrect-answer-flash')
    expect(flash).toHaveClass('bg-red-500')
  })

  it('has fixed positioning and covers full screen', () => {
    render(<IncorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('incorrect-answer-flash')
    expect(flash).toHaveClass('fixed', 'inset-0')
  })

  it('has pointer-events-none to not block interactions', () => {
    render(<IncorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('incorrect-answer-flash')
    expect(flash).toHaveClass('pointer-events-none')
  })

  it('has z-40 for proper stacking order', () => {
    render(<IncorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('incorrect-answer-flash')
    expect(flash).toHaveClass('z-40')
  })

  it('has subtle opacity animation (max 0.2, lower than correct answer)', () => {
    render(<IncorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('incorrect-answer-flash')
    const animate = JSON.parse(flash.getAttribute('data-animate') || '{}')
    // The animation should peak at 0.2 (subtle) compared to correct answer's 0.3
    expect(animate.opacity).toEqual([0, 0.2, 0])
  })

  describe('with reduced motion', () => {
    it('does not render when user prefers reduced motion', async () => {
      const { useReducedMotion } = await import('framer-motion')
      vi.mocked(useReducedMotion).mockReturnValue(true)

      render(<IncorrectAnswerFlash show={true} />)
      expect(
        screen.queryByTestId('incorrect-answer-flash')
      ).not.toBeInTheDocument()

      // Reset mock
      vi.mocked(useReducedMotion).mockReturnValue(false)
    })
  })
})
