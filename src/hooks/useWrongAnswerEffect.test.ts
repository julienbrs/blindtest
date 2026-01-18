import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWrongAnswerEffect } from './useWrongAnswerEffect'

// Mock navigator.vibrate
const mockVibrate = vi.fn()

// Mock Web Audio API
const mockOscillator = {
  type: 'sine',
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}

const mockGain = {
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
}

const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({
    ...mockGain,
    gain: { ...mockGain.gain },
  })),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
}

describe('useWrongAnswerEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Default: reduced motion is NOT preferred
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: mockVibrate,
    })

    // Mock AudioContext
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => ({ ...mockAudioContext }))
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should initialize with isShaking as false', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())
    expect(result.current.isShaking).toBe(false)
  })

  it('should set isShaking to true when triggerShake is called', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(true)
  })

  it('should reset isShaking to false after 400ms', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(true)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.isShaking).toBe(false)
  })

  it('should not trigger shake when reduced motion is preferred', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useWrongAnswerEffect())

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(false)
  })

  it('should trigger shake when respectReducedMotion is false', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() =>
      useWrongAnswerEffect({ respectReducedMotion: false })
    )

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(true)
  })

  it('should return cleanup function', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())
    expect(typeof result.current.cleanup).toBe('function')
  })

  it('should cancel pending timeout when cleanup is called', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(true)

    act(() => {
      result.current.cleanup()
    })

    // Even after 400ms, state should still be true because cleanup was called
    // and removed the timeout that would reset it
    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Note: cleanup only cancels the timeout, it doesn't change the current state
    // The state will remain true until the next triggerShake or component unmount
    expect(result.current.isShaking).toBe(true)
  })

  it('should reset previous timeout when triggerShake is called multiple times', () => {
    const { result } = renderHook(() => useWrongAnswerEffect())

    act(() => {
      result.current.triggerShake()
    })

    expect(result.current.isShaking).toBe(true)

    // Wait 200ms then trigger again
    act(() => {
      vi.advanceTimersByTime(200)
    })

    act(() => {
      result.current.triggerShake()
    })

    // Still shaking because new shake was triggered
    expect(result.current.isShaking).toBe(true)

    // 200ms more (total 400ms from first, but 200ms from second)
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Should still be shaking because timeout is measured from second trigger
    expect(result.current.isShaking).toBe(true)

    // 200ms more to complete the 400ms from second trigger
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isShaking).toBe(false)
  })

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useWrongAnswerEffect())

    const firstTriggerShake = result.current.triggerShake
    const firstCleanup = result.current.cleanup

    rerender()

    expect(result.current.triggerShake).toBe(firstTriggerShake)
    expect(result.current.cleanup).toBe(firstCleanup)
  })

  // Sound-related tests
  describe('incorrect answer sound', () => {
    it('should create AudioContext when triggerShake is called', () => {
      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      expect(AudioContext).toHaveBeenCalled()
    })

    it('should create oscillators for the sound', () => {
      const createOscillatorSpy = vi.fn(() => ({ ...mockOscillator }))
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => ({
          ...mockAudioContext,
          createOscillator: createOscillatorSpy,
        }))
      )

      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      // Should create 3 oscillators: main, sub-bass, and click
      expect(createOscillatorSpy).toHaveBeenCalledTimes(3)
    })

    it('should create gain nodes for volume control', () => {
      const createGainSpy = vi.fn(() => ({
        ...mockGain,
        gain: { ...mockGain.gain },
      }))
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => ({
          ...mockAudioContext,
          createGain: createGainSpy,
        }))
      )

      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      // Should create master gain + 3 individual gain nodes
      expect(createGainSpy).toHaveBeenCalledTimes(4)
    })

    it('should resume suspended AudioContext', () => {
      const resumeSpy = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => ({
          ...mockAudioContext,
          state: 'suspended',
          resume: resumeSpy,
        }))
      )

      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      expect(resumeSpy).toHaveBeenCalled()
    })

    it('should play sound even when reduced motion is preferred', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      // Sound should still play (AudioContext created)
      expect(AudioContext).toHaveBeenCalled()
      // But visual shake should not occur
      expect(result.current.isShaking).toBe(false)
    })

    it('should reuse existing AudioContext on subsequent calls', () => {
      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      const firstCallCount = (AudioContext as ReturnType<typeof vi.fn>).mock
        .calls.length

      act(() => {
        result.current.triggerShake()
      })

      // Should not create a new AudioContext
      expect(AudioContext).toHaveBeenCalledTimes(firstCallCount)
    })

    it('should close AudioContext on unmount', () => {
      const closeSpy = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => ({
          ...mockAudioContext,
          close: closeSpy,
        }))
      )

      const { result, unmount } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      unmount()

      expect(closeSpy).toHaveBeenCalled()
    })
  })

  // Vibration tests
  describe('haptic feedback', () => {
    it('triggers vibration on incorrect answer', () => {
      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      // Should trigger longer vibration (200ms) for incorrect answer
      expect(mockVibrate).toHaveBeenCalledWith(200)
    })

    it('fails silently when vibrate is not supported', () => {
      // Remove vibrate function to simulate iOS Safari
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: undefined,
      })

      const { result } = renderHook(() => useWrongAnswerEffect())

      // Should not throw
      expect(() => {
        act(() => {
          result.current.triggerShake()
        })
      }).not.toThrow()
    })

    it('triggers vibration even with reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { result } = renderHook(() => useWrongAnswerEffect())

      act(() => {
        result.current.triggerShake()
      })

      // Vibration should still work (it's haptic feedback, not visual)
      expect(mockVibrate).toHaveBeenCalledWith(200)
    })
  })
})
