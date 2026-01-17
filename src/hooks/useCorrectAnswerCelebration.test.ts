import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock canvas-confetti
const mockConfetti = vi.fn()
vi.mock('canvas-confetti', () => ({
  default: (...args: unknown[]) => mockConfetti(...args),
}))

// Mock matchMedia
const mockMatchMedia = vi.fn()

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

    const { result } = renderHook(() => useCorrectAnswerCelebration(false))

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
})
