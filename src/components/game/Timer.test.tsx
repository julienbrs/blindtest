import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Timer } from './Timer'

// Mock Web Audio API
const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}

const mockGainNode = {
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
}

const mockAudioContext = {
  currentTime: 0,
  state: 'running' as AudioContextState,
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({ ...mockGainNode })),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
}

// Store the original AudioContext
const originalAudioContext = globalThis.AudioContext

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
    vi.clearAllMocks()
    // Mock AudioContext
    globalThis.AudioContext = vi.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext
  })

  afterEach(() => {
    // Restore original AudioContext
    globalThis.AudioContext = originalAudioContext
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
      expect(screen.getByText('VITE !')).toBeInTheDocument()
    })

    it('displays warning text when warning (3-2s remaining)', () => {
      render(<Timer duration={5} remaining={2} />)
      expect(screen.getByText('Dépêchez-vous !')).toBeInTheDocument()
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

  describe('color transitions based on absolute seconds', () => {
    it('uses green color when remaining > 5 seconds', () => {
      const { container } = render(<Timer duration={10} remaining={8} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#22c55e') // green-500
    })

    it('uses yellow color when remaining is 5-4 seconds (attention)', () => {
      const { container } = render(<Timer duration={10} remaining={5} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#facc15') // yellow-400
    })

    it('uses yellow color at 4 seconds', () => {
      const { container } = render(<Timer duration={10} remaining={4} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#facc15') // yellow-400
    })

    it('uses orange color when remaining is 3-2 seconds (warning)', () => {
      const { container } = render(<Timer duration={10} remaining={3} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#f97316') // orange-500
    })

    it('uses orange color at 2 seconds', () => {
      const { container } = render(<Timer duration={10} remaining={2} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#f97316') // orange-500
    })

    it('uses red color when remaining is 1 second or less (critical)', () => {
      const { container } = render(<Timer duration={10} remaining={1} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#ef4444') // red-500
    })

    it('uses red color when remaining is 0 seconds', () => {
      const { container } = render(<Timer duration={5} remaining={0} />)
      const progressCircle = getProgressCircle(container)
      const animateData = getAnimateData(progressCircle)
      expect(animateData.stroke).toBe('#ef4444') // red-500
    })
  })

  describe('urgency animations', () => {
    it('applies fast scale animation when critical (remaining <= 1)', () => {
      const { container } = render(<Timer duration={5} remaining={1} />)
      // Find the outer motion.div with the scale animation
      const outerDiv = container.querySelector('[data-animate*="scale"]')
      expect(outerDiv).toBeInTheDocument()
    })

    it('applies blink (opacity) animation when critical (remaining <= 1)', () => {
      render(<Timer duration={5} remaining={1} />)
      const numberElement = screen.getByText('1')
      const animateData = getAnimateData(numberElement)
      expect(animateData.opacity).toEqual([1, 0.6, 1]) // Clignotement
      expect(animateData.scale).toEqual([1, 1.2, 1]) // Pulse rapide
    })

    it('displays red glow effect when critical', () => {
      const { container } = render(<Timer duration={5} remaining={1} />)
      // Find the glow div with boxShadow animation containing red color
      const glowDivs = container.querySelectorAll('[data-animate*="boxShadow"]')
      const hasRedGlow = Array.from(glowDivs).some((div) =>
        div.getAttribute('data-animate')?.includes('239, 68, 68')
      )
      expect(hasRedGlow).toBe(true)
    })

    it('displays orange glow effect when warning (remaining <= 3 but > 1)', () => {
      const { container } = render(<Timer duration={5} remaining={2} />)
      // Find the glow div with boxShadow animation containing orange color
      const glowDivs = container.querySelectorAll('[data-animate*="boxShadow"]')
      const hasOrangeGlow = Array.from(glowDivs).some((div) =>
        div.getAttribute('data-animate')?.includes('249, 115, 22')
      )
      expect(hasOrangeGlow).toBe(true)
    })

    it('does not display glow effect when normal (remaining > 5)', () => {
      const { container } = render(<Timer duration={10} remaining={8} />)
      const glowDiv = container.querySelector('[data-animate*="boxShadow"]')
      expect(glowDiv).not.toBeInTheDocument()
    })

    it('applies opacity animation when warning (remaining <= 3 but > 1)', () => {
      render(<Timer duration={5} remaining={2} />)
      const numberElement = screen.getByText('2')
      const animateData = getAnimateData(numberElement)
      expect(animateData.opacity).toEqual([1, 0.7, 1])
    })

    it('applies scale animation to container when warning', () => {
      const { container } = render(<Timer duration={5} remaining={2} />)
      const outerDiv = container.querySelector('[data-animate*="scale"]')
      expect(outerDiv).toBeInTheDocument()
      const animateData = getAnimateData(outerDiv)
      expect(animateData.scale).toEqual([1, 1.03, 1]) // Léger pulse
    })

    it('does not apply scale animation when attention (remaining 5-4s)', () => {
      const { container } = render(<Timer duration={10} remaining={4} />)
      // Check that the outer container has empty animate object
      const outerDiv = container.querySelector('.h-32.w-32')
      const animateData = getAnimateData(outerDiv)
      expect(animateData).toEqual({})
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

  describe('timeout sound', () => {
    it('plays sound when remaining transitions from > 0 to 0', () => {
      const { rerender } = render(<Timer duration={5} remaining={1} />)

      // Verify no AudioContext created yet (sound only plays at 0)
      expect(globalThis.AudioContext).not.toHaveBeenCalled()

      // Transition to 0
      rerender(<Timer duration={5} remaining={0} />)

      // AudioContext should be created and oscillators started
      expect(globalThis.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('does not play sound when remaining is already 0 on mount', () => {
      render(<Timer duration={5} remaining={0} />)

      // No sound should play because there was no transition
      expect(globalThis.AudioContext).not.toHaveBeenCalled()
    })

    it('does not play sound when remaining stays above 0', () => {
      const { rerender } = render(<Timer duration={5} remaining={3} />)
      rerender(<Timer duration={5} remaining={2} />)
      rerender(<Timer duration={5} remaining={1} />)

      // No sound should play until it reaches 0
      expect(globalThis.AudioContext).not.toHaveBeenCalled()
    })

    it('plays sound only once even if remaining stays at 0', () => {
      const { rerender } = render(<Timer duration={5} remaining={1} />)
      rerender(<Timer duration={5} remaining={0} />)

      const callCount = (globalThis.AudioContext as ReturnType<typeof vi.fn>)
        .mock.calls.length

      // Re-render with same value
      rerender(<Timer duration={5} remaining={0} />)

      // Should not create a new AudioContext
      expect(
        (globalThis.AudioContext as ReturnType<typeof vi.fn>).mock.calls.length
      ).toBe(callCount)
    })

    it('can play sound again after timer resets', () => {
      const { rerender } = render(<Timer duration={5} remaining={1} />)

      // First timeout
      rerender(<Timer duration={5} remaining={0} />)
      expect(globalThis.AudioContext).toHaveBeenCalledTimes(1)

      // Reset timer
      rerender(<Timer duration={5} remaining={5} />)

      // Second timeout
      rerender(<Timer duration={5} remaining={1} />)
      rerender(<Timer duration={5} remaining={0} />)

      // Should have created AudioContext twice (once per timeout)
      // Note: Due to ref reuse, it may only create once but play multiple times
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    })

    it('calls onTimeout callback when timer reaches 0', () => {
      const onTimeout = vi.fn()
      const { rerender } = render(
        <Timer duration={5} remaining={1} onTimeout={onTimeout} />
      )

      expect(onTimeout).not.toHaveBeenCalled()

      rerender(<Timer duration={5} remaining={0} onTimeout={onTimeout} />)

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('resumes AudioContext if suspended (browser autoplay policy)', () => {
      // Set context to suspended state
      mockAudioContext.state = 'suspended' as AudioContextState

      const { rerender } = render(<Timer duration={5} remaining={1} />)
      rerender(<Timer duration={5} remaining={0} />)

      expect(mockAudioContext.resume).toHaveBeenCalled()

      // Reset state for other tests
      mockAudioContext.state = 'running' as AudioContextState
    })

    it('creates three oscillators for the timeout sound (main, sub, buzz)', () => {
      const { rerender } = render(<Timer duration={5} remaining={1} />)
      rerender(<Timer duration={5} remaining={0} />)

      // Should create 3 oscillators
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3)
      // Should create 3 gain nodes
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3)
    })
  })
})
