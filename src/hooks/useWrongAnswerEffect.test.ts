import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWrongAnswerEffect } from './useWrongAnswerEffect'

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
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
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

    const { result } = renderHook(() => useWrongAnswerEffect(false))

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
})
