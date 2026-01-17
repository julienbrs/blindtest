import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from './useAudioPlayer'

// Mock HTMLAudioElement
class MockAudio {
  src = ''
  currentTime = 0
  paused = true
  private listeners: Record<string, Set<EventListener>> = {}

  addEventListener(event: string, callback: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }
    this.listeners[event].add(callback)
  }

  removeEventListener(event: string, callback: EventListener) {
    this.listeners[event]?.delete(callback)
  }

  dispatchEvent(event: Event): boolean {
    this.listeners[event.type]?.forEach((cb) => cb(event))
    return true
  }

  load() {
    // Simulate async loading
  }

  play() {
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  // Test helper to simulate time update
  simulateTimeUpdate(time: number) {
    this.currentTime = time
    this.dispatchEvent(new Event('timeupdate'))
  }

  // Test helper to simulate canplay
  simulateCanPlay() {
    this.dispatchEvent(new Event('canplay'))
  }

  // Test helper to simulate ended
  simulateEnded() {
    this.dispatchEvent(new Event('ended'))
  }
}

describe('useAudioPlayer', () => {
  let mockAudio: MockAudio

  beforeEach(() => {
    mockAudio = new MockAudio()
    vi.stubGlobal(
      'Audio',
      vi.fn(() => mockAudio)
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
      expect(result.current.isLoaded).toBe(false)
      expect(result.current.progress).toBe(0)
    })

    it('should create an Audio element on mount', () => {
      renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      expect(Audio).toHaveBeenCalled()
    })
  })

  describe('loadSong', () => {
    it('should set audio src and load', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        result.current.loadSong('abc123def456')
      })

      expect(mockAudio.src).toBe('/api/audio/abc123def456')
    })

    it('should reset state when loading new song', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      // Simulate playing
      act(() => {
        result.current.loadSong('song1')
        mockAudio.simulateCanPlay()
        result.current.play()
        mockAudio.simulateTimeUpdate(5)
      })

      expect(result.current.currentTime).toBe(5)
      expect(result.current.isPlaying).toBe(true)

      // Load new song
      act(() => {
        result.current.loadSong('song2')
      })

      expect(result.current.currentTime).toBe(0)
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.isLoaded).toBe(false)
    })
  })

  describe('play/pause/toggle', () => {
    it('should play audio', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        result.current.play()
      })

      expect(result.current.isPlaying).toBe(true)
      expect(mockAudio.paused).toBe(false)
    })

    it('should pause audio', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        result.current.play()
      })

      act(() => {
        result.current.pause()
      })

      expect(result.current.isPlaying).toBe(false)
      expect(mockAudio.paused).toBe(true)
    })

    it('should toggle play state', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      // Initially paused, toggle should play
      act(() => {
        result.current.toggle()
      })

      expect(result.current.isPlaying).toBe(true)

      // Now playing, toggle should pause
      act(() => {
        result.current.toggle()
      })

      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('progress tracking', () => {
    it('should track current time on timeupdate', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        mockAudio.simulateTimeUpdate(10)
      })

      expect(result.current.currentTime).toBe(10)
    })

    it('should calculate progress percentage', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        mockAudio.simulateTimeUpdate(10)
      })

      expect(result.current.progress).toBe(50) // 10/20 * 100
    })

    it('should handle zero maxDuration', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 0 }))

      expect(result.current.progress).toBe(0)
    })
  })

  describe('callbacks', () => {
    it('should call onReady when audio is ready', () => {
      const onReady = vi.fn()
      const { result } = renderHook(() =>
        useAudioPlayer({ maxDuration: 20, onReady })
      )

      act(() => {
        result.current.loadSong('test123song')
        mockAudio.simulateCanPlay()
      })

      expect(onReady).toHaveBeenCalledWith('test123song')
    })

    it('should call onEnded when max duration reached', () => {
      const onEnded = vi.fn()
      renderHook(() => useAudioPlayer({ maxDuration: 20, onEnded }))

      act(() => {
        mockAudio.simulateTimeUpdate(20)
      })

      expect(onEnded).toHaveBeenCalled()
    })

    it('should call onEnded when audio naturally ends', () => {
      const onEnded = vi.fn()
      renderHook(() => useAudioPlayer({ maxDuration: 60, onEnded }))

      act(() => {
        mockAudio.simulateEnded()
      })

      expect(onEnded).toHaveBeenCalled()
    })

    it('should pause and stop playing when max duration reached', () => {
      const onEnded = vi.fn()
      const { result } = renderHook(() =>
        useAudioPlayer({ maxDuration: 20, onEnded })
      )

      act(() => {
        result.current.play()
      })

      expect(result.current.isPlaying).toBe(true)

      act(() => {
        mockAudio.simulateTimeUpdate(20)
      })

      expect(mockAudio.paused).toBe(true)
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('isLoaded state', () => {
    it('should set isLoaded to true on canplay', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      expect(result.current.isLoaded).toBe(false)

      act(() => {
        mockAudio.simulateCanPlay()
      })

      expect(result.current.isLoaded).toBe(true)
    })

    it('should reset isLoaded when loading new song', () => {
      const { result } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      act(() => {
        mockAudio.simulateCanPlay()
      })

      expect(result.current.isLoaded).toBe(true)

      act(() => {
        result.current.loadSong('newsong123')
      })

      expect(result.current.isLoaded).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should pause audio and remove listeners on unmount', () => {
      const pauseSpy = vi.spyOn(mockAudio, 'pause')
      const removeListenerSpy = vi.spyOn(mockAudio, 'removeEventListener')

      const { unmount } = renderHook(() => useAudioPlayer({ maxDuration: 20 }))

      unmount()

      expect(pauseSpy).toHaveBeenCalled()
      expect(removeListenerSpy).toHaveBeenCalledWith(
        'timeupdate',
        expect.any(Function)
      )
      expect(removeListenerSpy).toHaveBeenCalledWith(
        'canplay',
        expect.any(Function)
      )
      expect(removeListenerSpy).toHaveBeenCalledWith(
        'ended',
        expect.any(Function)
      )
    })
  })

  describe('ref stability', () => {
    it('should use latest callback refs without re-creating audio element', () => {
      const onEnded1 = vi.fn()
      const onEnded2 = vi.fn()

      const { rerender } = renderHook(
        ({ onEnded }) => useAudioPlayer({ maxDuration: 20, onEnded }),
        { initialProps: { onEnded: onEnded1 } }
      )

      // Rerender with new callback
      rerender({ onEnded: onEnded2 })

      // Trigger the event
      act(() => {
        mockAudio.simulateTimeUpdate(20)
      })

      // Should call the new callback, not the old one
      expect(onEnded1).not.toHaveBeenCalled()
      expect(onEnded2).toHaveBeenCalled()
    })
  })
})
