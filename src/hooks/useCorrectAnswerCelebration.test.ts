import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock canvas-confetti
const mockConfetti = vi.fn()
vi.mock('canvas-confetti', () => ({
  default: (...args: unknown[]) => mockConfetti(...args),
}))

// Mock matchMedia
const mockMatchMedia = vi.fn()

// Mock Web Audio API
const mockOscillatorStart = vi.fn()
const mockOscillatorStop = vi.fn()
const mockOscillatorConnect = vi.fn()
const mockGainConnect = vi.fn()
const mockSetValueAtTime = vi.fn()
const mockLinearRampToValueAtTime = vi.fn()
const mockExponentialRampToValueAtTime = vi.fn()
const mockClose = vi.fn()
const mockResume = vi.fn().mockResolvedValue(undefined)

const createMockOscillator = () => ({
  type: 'sine',
  frequency: {
    setValueAtTime: mockSetValueAtTime,
  },
  connect: mockOscillatorConnect,
  start: mockOscillatorStart,
  stop: mockOscillatorStop,
})

const createMockGain = () => ({
  gain: {
    setValueAtTime: mockSetValueAtTime,
    linearRampToValueAtTime: mockLinearRampToValueAtTime,
    exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
  },
  connect: mockGainConnect,
})

const MockAudioContext = vi.fn().mockImplementation(() => ({
  currentTime: 0,
  state: 'running',
  createOscillator: vi.fn(createMockOscillator),
  createGain: vi.fn(createMockGain),
  destination: {},
  close: mockClose,
  resume: mockResume,
}))

import { useCorrectAnswerCelebration } from './useCorrectAnswerCelebration'

describe('useCorrectAnswerCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Default to no reduced motion preference
    mockMatchMedia.mockReturnValue({ matches: false })
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })

    // Mock AudioContext
    global.AudioContext = MockAudioContext as unknown as typeof AudioContext
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('provides celebrate and cleanup functions', () => {
    const { result } = renderHook(() => useCorrectAnswerCelebration())

    expect(typeof result.current.celebrate).toBe('function')
    expect(typeof result.current.cleanup).toBe('function')
  })

  it('fires confetti when celebrate is called', () => {
    const { result } = renderHook(() => useCorrectAnswerCelebration())

    act(() => {
      result.current.celebrate()
    })

    expect(mockConfetti).toHaveBeenCalledWith({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#8b5cf6', '#fbbf24', '#22c55e'],
    })
  })

  it('fires additional confetti bursts after delay', () => {
    const { result } = renderHook(() => useCorrectAnswerCelebration())

    act(() => {
      result.current.celebrate()
    })

    expect(mockConfetti).toHaveBeenCalledTimes(1)

    // Fast-forward timer for second burst
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Two additional bursts from left and right
    expect(mockConfetti).toHaveBeenCalledTimes(3)
    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 60,
        origin: { x: 0 },
      })
    )
    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 120,
        origin: { x: 1 },
      })
    )
  })

  it('respects prefers-reduced-motion when enabled', () => {
    mockMatchMedia.mockReturnValue({ matches: true })

    const { result } = renderHook(() => useCorrectAnswerCelebration())

    act(() => {
      result.current.celebrate()
    })

    expect(mockConfetti).not.toHaveBeenCalled()
  })

  it('ignores reduced motion when respectReducedMotion is false', () => {
    mockMatchMedia.mockReturnValue({ matches: true })

    const { result } = renderHook(() =>
      useCorrectAnswerCelebration({ respectReducedMotion: false })
    )

    act(() => {
      result.current.celebrate()
    })

    expect(mockConfetti).toHaveBeenCalled()
  })

  it('cleanup cancels pending confetti timeouts', () => {
    const { result } = renderHook(() => useCorrectAnswerCelebration())

    act(() => {
      result.current.celebrate()
    })

    // Cleanup before timeout fires
    act(() => {
      result.current.cleanup()
    })

    // Fast-forward - no additional confetti should fire
    const callCountAfterCleanup = mockConfetti.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(mockConfetti.mock.calls.length).toBe(callCountAfterCleanup)
  })

  it('can be called multiple times without issues', () => {
    const { result } = renderHook(() => useCorrectAnswerCelebration())

    act(() => {
      result.current.celebrate()
      result.current.celebrate()
    })

    // First call should fire, second call should clear the first timeout
    // and start a new one
    expect(mockConfetti).toHaveBeenCalled()
  })

  // Sound effect tests
  describe('correct answer sound', () => {
    it('creates AudioContext when celebrate is called', () => {
      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      expect(MockAudioContext).toHaveBeenCalled()
    })

    it('creates oscillators for the arpeggio notes', () => {
      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      // Should create multiple oscillators (4 arpeggio notes + harmonics + chord)
      const context = MockAudioContext.mock.results[0].value
      expect(context.createOscillator).toHaveBeenCalled()
      expect(context.createGain).toHaveBeenCalled()
    })

    it('starts and stops oscillators', () => {
      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      expect(mockOscillatorStart).toHaveBeenCalled()
      expect(mockOscillatorStop).toHaveBeenCalled()
    })

    it('plays sound even when reduced motion is preferred', () => {
      mockMatchMedia.mockReturnValue({ matches: true })

      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      // Sound should play even when reduced motion is enabled
      expect(MockAudioContext).toHaveBeenCalled()
      expect(mockOscillatorStart).toHaveBeenCalled()
      // But confetti should NOT play
      expect(mockConfetti).not.toHaveBeenCalled()
    })

    it('resumes AudioContext if suspended', () => {
      const suspendedContext = {
        currentTime: 0,
        state: 'suspended',
        createOscillator: vi.fn(createMockOscillator),
        createGain: vi.fn(createMockGain),
        destination: {},
        close: mockClose,
        resume: mockResume,
      }
      MockAudioContext.mockImplementationOnce(() => suspendedContext)

      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      expect(mockResume).toHaveBeenCalled()
    })

    it('cleans up AudioContext on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useCorrectAnswerCelebration()
      )

      act(() => {
        result.current.celebrate()
      })

      unmount()

      expect(mockClose).toHaveBeenCalled()
    })

    it('reuses AudioContext for multiple celebrations', () => {
      const { result } = renderHook(() => useCorrectAnswerCelebration())

      act(() => {
        result.current.celebrate()
      })

      act(() => {
        result.current.celebrate()
      })

      // Should only create one AudioContext
      expect(MockAudioContext).toHaveBeenCalledTimes(1)
    })
  })
})
