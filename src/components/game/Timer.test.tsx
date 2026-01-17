import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Timer } from './Timer'

describe('Timer', () => {
  // Cleanup after each test to prevent duplicate renders
  beforeEach(() => {
    cleanup()
  })

  // Helper to get progress circle (the second circle with strokeDasharray)
  const getProgressCircle = (container: HTMLElement) =>
    container.querySelector('circle[stroke-dasharray]')

  describe('rendering', () => {
    it('displays the remaining time', () => {
      render(<Timer duration={5} remaining={3} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays the instruction text', () => {
      render(<Timer duration={5} remaining={5} />)
      expect(screen.getByText('Temps pour répondre...')).toBeInTheDocument()
    })

    it('renders a circular progress indicator', () => {
      const { container } = render(<Timer duration={5} remaining={5} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Find all circles within the first svg (avoiding StrictMode duplicates)
      const svgElement = container.querySelector('svg')
      const circles = svgElement?.querySelectorAll('circle')
      expect(circles).toHaveLength(2) // Background and progress circles
    })
  })

  describe('progress calculation', () => {
    it('shows full progress when remaining equals duration', () => {
      const { container } = render(<Timer duration={5} remaining={5} />)
      const progressCircle = getProgressCircle(container)
      // Progress should be 100%, so strokeDashoffset should be 0
      // strokeDasharray is 364, so offset = 364 - (364 * 100 / 100) = 0
      expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0')
    })

    it('shows half progress when remaining is half duration', () => {
      const { container } = render(<Timer duration={10} remaining={5} />)
      const progressCircle = getProgressCircle(container)
      // Progress should be 50%, so offset = 364 - (364 * 50 / 100) = 182
      expect(progressCircle).toHaveAttribute('stroke-dashoffset', '182')
    })

    it('shows no progress when remaining is 0', () => {
      const { container } = render(<Timer duration={5} remaining={0} />)
      const progressCircle = getProgressCircle(container)
      // Progress should be 0%, so offset = 364 - 0 = 364
      expect(progressCircle).toHaveAttribute('stroke-dashoffset', '364')
    })
  })

  describe('urgency indicator', () => {
    it('applies yellow styling when not urgent (remaining > 2)', () => {
      const { container } = render(<Timer duration={5} remaining={3} />)
      const progressCircle = getProgressCircle(container)
      expect(progressCircle).toHaveClass('text-yellow-400')
      expect(progressCircle).not.toHaveClass('text-red-500')
    })

    it('applies red styling when urgent (remaining <= 2)', () => {
      const { container } = render(<Timer duration={5} remaining={2} />)
      const progressCircle = getProgressCircle(container)
      expect(progressCircle).toHaveClass('text-red-500')
      expect(progressCircle).not.toHaveClass('text-yellow-400')
    })

    it('applies red styling when remaining is 1', () => {
      const { container } = render(<Timer duration={5} remaining={1} />)
      const progressCircle = getProgressCircle(container)
      expect(progressCircle).toHaveClass('text-red-500')
    })

    it('applies red styling when remaining is 0', () => {
      const { container } = render(<Timer duration={5} remaining={0} />)
      const progressCircle = getProgressCircle(container)
      expect(progressCircle).toHaveClass('text-red-500')
    })

    it('displays pulsing number when urgent', () => {
      render(<Timer duration={5} remaining={2} />)
      const numberElement = screen.getByText('2')
      expect(numberElement).toHaveClass('animate-pulse', 'text-red-500')
    })

    it('does not pulse when not urgent', () => {
      render(<Timer duration={5} remaining={3} />)
      const numberElement = screen.getByText('3')
      expect(numberElement).not.toHaveClass('animate-pulse')
      expect(numberElement).toHaveClass('text-white')
    })
  })

  describe('edge cases', () => {
    it('handles duration of 1 second', () => {
      render(<Timer duration={1} remaining={1} />)
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('handles large durations', () => {
      render(<Timer duration={30} remaining={15} />)
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('handles remaining being greater than duration', () => {
      const { container } = render(<Timer duration={5} remaining={10} />)
      expect(screen.getByText('10')).toBeInTheDocument()
      const progressCircle = getProgressCircle(container)
      // Progress would be 200%, but visually it should still work
      expect(progressCircle).toHaveAttribute(
        'stroke-dashoffset',
        expect.any(String)
      )
    })
  })
})
