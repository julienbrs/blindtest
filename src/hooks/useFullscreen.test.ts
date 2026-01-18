import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFullscreen } from './useFullscreen'

describe('useFullscreen', () => {
  let originalFullscreenEnabled: boolean | undefined
  let originalFullscreenElement: Element | null
  let mockRequestFullscreen: ReturnType<typeof vi.fn>
  let mockExitFullscreen: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Save original values
    originalFullscreenEnabled = document.fullscreenEnabled
    originalFullscreenElement = document.fullscreenElement

    // Create mock functions
    mockRequestFullscreen = vi.fn().mockResolvedValue(undefined)
    mockExitFullscreen = vi.fn().mockResolvedValue(undefined)

    // Mock fullscreen support
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: true,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: mockRequestFullscreen,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'exitFullscreen', {
      value: mockExitFullscreen,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: originalFullscreenEnabled,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'fullscreenElement', {
      value: originalFullscreenElement,
      writable: true,
      configurable: true,
    })

    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should detect fullscreen support', async () => {
      const { result } = renderHook(() => useFullscreen())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })
    })

    it('should return isSupported false when fullscreen is not enabled', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      })
      // Also ensure webkit version is not available
      Object.defineProperty(document, 'webkitFullscreenEnabled', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false)
      })
    })

    it('should start with isFullscreen false when not in fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen())

      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(false)
      })
    })

    it('should detect initial fullscreen state when already in fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(true)
      })
    })
  })

  describe('enterFullscreen', () => {
    it('should call requestFullscreen on the document element', async () => {
      const { result } = renderHook(() => useFullscreen())

      // Wait for isSupported to be set
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })

      await act(async () => {
        await result.current.enterFullscreen()
      })

      expect(mockRequestFullscreen).toHaveBeenCalled()
    })

    it('should not call requestFullscreen when not supported', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(document, 'webkitFullscreenEnabled', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      // Wait for async state update
      await waitFor(() => {
        expect(result.current.isSupported).toBe(false)
      })

      await act(async () => {
        await result.current.enterFullscreen()
      })

      expect(mockRequestFullscreen).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockRequestFullscreen.mockRejectedValue(new Error('Fullscreen blocked'))

      const { result } = renderHook(() => useFullscreen())

      // Wait for isSupported to be set
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })

      // Should not throw
      await act(async () => {
        await result.current.enterFullscreen()
      })

      expect(mockRequestFullscreen).toHaveBeenCalled()
    })
  })

  describe('exitFullscreen', () => {
    it('should call document.exitFullscreen', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(mockExitFullscreen).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockExitFullscreen.mockRejectedValue(new Error('Exit failed'))

      const { result } = renderHook(() => useFullscreen())

      // Should not throw
      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(mockExitFullscreen).toHaveBeenCalled()
    })
  })

  describe('toggleFullscreen', () => {
    it('should enter fullscreen when not in fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      // Wait for isSupported to be set
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true)
      })

      await act(async () => {
        await result.current.toggleFullscreen()
      })

      expect(mockRequestFullscreen).toHaveBeenCalled()
      expect(mockExitFullscreen).not.toHaveBeenCalled()
    })

    it('should exit fullscreen when already in fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(true)
      })

      await act(async () => {
        await result.current.toggleFullscreen()
      })

      expect(mockExitFullscreen).toHaveBeenCalled()
      expect(mockRequestFullscreen).not.toHaveBeenCalled()
    })
  })

  describe('fullscreenchange event', () => {
    it('should update isFullscreen when entering fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen())

      // Wait for initial state (false)
      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(false)
      })

      // Simulate entering fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      })

      act(() => {
        document.dispatchEvent(new Event('fullscreenchange'))
      })

      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(true)
      })
    })

    it('should update isFullscreen when exiting fullscreen', async () => {
      // Start in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      // Wait for initial state (true since we're in fullscreen)
      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(true)
      })

      // Simulate exiting fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      })

      act(() => {
        document.dispatchEvent(new Event('fullscreenchange'))
      })

      await waitFor(() => {
        expect(result.current.isFullscreen).toBe(false)
      })
    })

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useFullscreen())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('return value stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useFullscreen())

      const firstToggle = result.current.toggleFullscreen
      const firstEnter = result.current.enterFullscreen
      const firstExit = result.current.exitFullscreen

      rerender()

      expect(result.current.toggleFullscreen).toBe(firstToggle)
      expect(result.current.enterFullscreen).toBe(firstEnter)
      expect(result.current.exitFullscreen).toBe(firstExit)
    })
  })
})
