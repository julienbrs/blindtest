import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      'data-testid': testId,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { 'data-testid'?: string }) => (
      <div className={className} data-testid={testId} {...props}>
        {children}
      </div>
    ),
  },
  useReducedMotion: vi.fn(() => false),
}))

import { CorrectAnswerFlash } from './CorrectAnswerFlash'
import { useReducedMotion } from 'framer-motion'

describe('CorrectAnswerFlash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  it('renders flash when show is true', () => {
    render(<CorrectAnswerFlash show={true} />)
    expect(screen.getByTestId('correct-answer-flash')).toBeInTheDocument()
  })

  it('does not render when show is false', () => {
    render(<CorrectAnswerFlash show={false} />)
    expect(screen.queryByTestId('correct-answer-flash')).not.toBeInTheDocument()
  })

  it('does not render when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)
    render(<CorrectAnswerFlash show={true} />)
    expect(screen.queryByTestId('correct-answer-flash')).not.toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<CorrectAnswerFlash show={true} />)
    const flash = screen.getByTestId('correct-answer-flash')
    expect(flash).toHaveClass('pointer-events-none')
    expect(flash).toHaveClass('fixed')
    expect(flash).toHaveClass('inset-0')
    expect(flash).toHaveClass('bg-green-500')
    expect(flash).toHaveClass('z-40')
  })
})
