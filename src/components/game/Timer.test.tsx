import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Timer } from './Timer'

// Mock framer-motion to make animations testable
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      animate,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
      animate?: Record<string, unknown>
      [key: string]: unknown
    }) => (
      <div
        className={className}
        data-animate={JSON.stringify(animate)}
        {...props}
      >
        {children}
      </div>
    ),
    circle: ({
      animate,
      ...props
    }: {
      animate?: Record<string, unknown>
      [key: string]: unknown
    }) => <circle data-animate={JSON.stringify(animate)} {...props} />,
    p: ({
      children,
      className,
      animate,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
      animate?: Record<string, unknown>
      [key: string]: unknown
    }) => (
      <p
        className={className}
        data-animate={JSON.stringify(animate)}
        {...props}
      >
        {children}
      </p>
    ),
  },
  useReducedMotion: () => false,
}))

describe('Timer', () => {
  // Cleanup after each test to prevent duplicate renders
  beforeEach(() => {
    cleanup()
  })

  // Helper to get the motion circle (animated progress circle)
  const getProgressCircle = (container: HTMLElement) => {
    const circles = container.querySelectorAll('circle')
    // The second circle is the progress circle (first is background)
    return circles[1]
  }

  // Helper to parse animate data attribute
  const getAnimateData = (element: Element | null) => {
    const dataAnimate = element?.getAttribute('data-animate')
    return dataAnimate ? JSON.parse(dataAnimate) : null
  }

  describe('rendering', () => {
    it('displays the remaining time', () => {
      render(<Timer duration={5} remaining={3} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays the instruction text when not critical', () => {
      render(<Timer duration={5} remaining={5} />)
      expect(screen.getByText('Temps pour répondre...')).toBeInTheDocument()
    })

    it('displays urgency text when critical', () => {
      render(<Timer duration={5} remaining={1} />)
      expect(screen.getByText('Vite !')).toBeInTheDocument()
    })

    it('renders a circular progress indicator', () => {
      const { container } = render(<Timer duration={5} remaining={5} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      const circles = svg?.querySelectorAll('circle')
      expect(circles).toHaveLength(2) // Background and progress circles
    })
  })

  describe('progress calculation', () => {
    const circumference = 2 * Math.PI * 58 // ~364.42

    it('animates to full progress when remaining equals duration', () => {
      const { container } = render(<Timer duration={5} remaining={5} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      // Progress should be 100%, so strokeDashoffset should be ~0
      expect(animateData.strokeDashoffset).toBeCloseTo(0, 0)
    })

    it('animates to half progress when remaining is half duration', () => {
      const { container } = render(<Timer duration={10} remaining={5} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      // Progress should be 50%, so offset = circumference / 2
      expect(animateData.strokeDashoffset).toBeCloseTo(circumference / 2, 0)
    })

    it('animates to no progress when remaining is 0', () => {
      const { container } = render(<Timer duration={5} remaining={0} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      // Progress should be 0%, so offset = full circumference
      expect(animateData.strokeDashoffset).toBeCloseTo(circumference, 0)
    })
  })

  describe('color transitions', () => {
    it('uses green color when progress is above 60%', () => {
      const { container } = render(<Timer duration={10} remaining={8} />) // 80%
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#22c55e') // green-500
    })

    it('uses yellow color when progress is between 30-60%', () => {
      const { container } = render(<Timer duration={10} remaining={5} />) // 50%
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#facc15') // yellow-400
    })

    it('uses orange color when progress is between 10-30%', () => {
      const { container } = render(<Timer duration={10} remaining={2} />) // 20%
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#f97316') // orange-500
    })

    it('uses red color when progress is 10% or below', () => {
      const { container } = render(<Timer duration={10} remaining={1} />) // 10%
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#ef4444') // red-500
    })

    it('uses red color when progress is 0%', () => {
      const { container } = render(<Timer duration={5} remaining={0} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#ef4444') // red-500
    })
  })

  describe('urgency animations', () => {
    it('applies scale animation when critical (remaining <= 1)', () => {
      const { container } = render(<Timer duration={5} remaining={1} />)
      // Find the outer motion.div with the scale animation
      const outerDiv = container.querySelector('[data-animate*="scale"]')
      expect(outerDiv).toBeInTheDocument()
    })

    it('displays glow effect when critical', () => {
      const { container } = render(<Timer duration={5} remaining={1} />)
      // Find the glow div with boxShadow animation
      const glowDiv = container.querySelector('[data-animate*="boxShadow"]')
      expect(glowDiv).toBeInTheDocument()
    })

    it('does not display glow effect when not critical', () => {
      const { container } = render(<Timer duration={5} remaining={3} />)
      const glowDiv = container.querySelector('[data-animate*="boxShadow"]')
      expect(glowDiv).not.toBeInTheDocument()
    })

    it('applies opacity animation when warning (remaining <= 3 but > 1)', () => {
      render(<Timer duration={5} remaining={2} />)
      const numberElement = screen.getByText('2')
      const animateData = getAnimateData(numberElement)
      expect(animateData.opacity).toEqual([1, 0.7, 1])
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
      const animateData = getAnimateData(progressCircle)
      // Progress would be 200%, stroke should still be green
      expect(animateData.stroke).toBe('#22c55e')
    })
  })
})
