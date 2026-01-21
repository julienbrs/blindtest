import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageVisibility } from './usePageVisibility'

describe('usePageVisibility', () => {
  let originalHidden: boolean
  let visibilityChangeHandler: EventListener | null = null

  // Helper to trigger the visibility change handler with a mock event
  const triggerVisibilityChange = () => {
    if (visibilityChangeHandler) {
      visibilityChangeHandler(new Event('visibilitychange'))
    }
  }

  beforeEach(() => {
    // Store original document.hidden value
    originalHidden = document.hidden

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    })

    // Capture the event listener
    visibilityChangeHandler = null
    vi.spyOn(document, 'addEventListener').mockImplementation(
      (event, handler) => {
        if (event === 'visibilitychange' && typeof handler === 'function') {
          visibilityChangeHandler = handler
        }
      }
    )
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original document.hidden value
    Object.defineProperty(document, 'hidden', {
      value: originalHidden,
      writable: true,
      configurable: true,
    })

    vi.restoreAllMocks()
  })

  it('should return isHidden false initially when page is visible', () => {
    const { result } = renderHook(() => usePageVisibility())

    expect(result.current.isHidden).toBe(false)
  })

  it('should return isHidden true initially when page is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePageVisibility())

    expect(result.current.isHidden).toBe(true)
  })

  it('should add visibilitychange event listener on mount', () => {
    renderHook(() => usePageVisibility())

    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
  })

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => usePageVisibility())

    unmount()

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
  })

  it('should update isHidden when visibility changes to hidden', () => {
    const { result } = renderHook(() => usePageVisibility())

    expect(result.current.isHidden).toBe(false)

    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(result.current.isHidden).toBe(true)
  })

  it('should update isHidden when visibility changes to visible', () => {
    // Start with hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePageVisibility())

    expect(result.current.isHidden).toBe(true)

    // Simulate tab becoming visible
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(result.current.isHidden).toBe(false)
  })

  it('should call registered callbacks when visibility changes', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => usePageVisibility())

    // Register callback
    result.current.onVisibilityChange(callback)

    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(callback).toHaveBeenCalledWith(true)

    // Simulate tab becoming visible
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(callback).toHaveBeenCalledWith(false)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should allow unregistering callbacks', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => usePageVisibility())

    // Register and then unregister callback
    const unregister = result.current.onVisibilityChange(callback)
    unregister()

    // Simulate visibility change
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should support multiple registered callbacks', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => usePageVisibility())

    // Register multiple callbacks
    result.current.onVisibilityChange(callback1)
    result.current.onVisibilityChange(callback2)

    // Simulate visibility change
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      })
      triggerVisibilityChange()
    })

    expect(callback1).toHaveBeenCalledWith(true)
    expect(callback2).toHaveBeenCalledWith(true)
  })

  it('should provide stable onVisibilityChange callback reference', () => {
    const { result, rerender } = renderHook(() => usePageVisibility())

    const firstCallback = result.current.onVisibilityChange

    rerender()

    expect(result.current.onVisibilityChange).toBe(firstCallback)
  })
})
