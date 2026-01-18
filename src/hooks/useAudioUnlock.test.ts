import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioUnlock, createAudioContext } from './useAudioUnlock'

// Mock AudioContext
const mockResume = vi.fn().mockResolvedValue(undefined)
const mockClose = vi.fn().mockResolvedValue(undefined)
const mockCreateBuffer = vi.fn()
const mockCreateBufferSource = vi.fn()
const mockConnect = vi.fn()
const mockStart = vi.fn()

class MockAudioContext {
  state = 'suspended'
  destination = {}
  resume = mockResume
  close = mockClose

  createBuffer = mockCreateBuffer.mockReturnValue({})
  createBufferSource = mockCreateBufferSource.mockReturnValue({
    buffer: null,
    connect: mockConnect,
    start: mockStart,
  })
}

// Mock Audio element
const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn()

class MockAudio {
  src = ''
  volume = 1
  currentTime = 0
  play = mockPlay
  pause = mockPause
}

describe('createAudioContext', () => {
  const originalAudioContext = window.AudioContext
  const originalWebkitAudioContext = window.webkitAudioContext

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original AudioContext
    Object.defineProperty(window, 'AudioContext', {
      value: originalAudioContext,
      writable: true,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      value: originalWebkitAudioContext,
      writable: true,
    })
  })

  it('should create AudioContext using standard API', () => {
    Object.defineProperty(window, 'AudioContext', {
      value: MockAudioContext,
      writable: true,
    })

    const ctx = createAudioContext()
    expect(ctx).toBeInstanceOf(MockAudioContext)
  })

  it('should fallback to webkitAudioContext for Safari', () => {
    // Remove standard AudioContext
    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      value: MockAudioContext,
      writable: true,
    })

    const ctx = createAudioContext()
    expect(ctx).toBeInstanceOf(MockAudioContext)
  })

  it('should return null when AudioContext is not available', () => {
    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      value: undefined,
      writable: true,
    })

    const ctx = createAudioContext()
    expect(ctx).toBeNull()
  })

  it('should return null when AudioContext throws', () => {
    Object.defineProperty(window, 'AudioContext', {
      value: function () {
        throw new Error('AudioContext not supported')
      },
      writable: true,
    })

    const ctx = createAudioContext()
    expect(ctx).toBeNull()
  })
})

describe('useAudioUnlock', () => {
  const originalAudioContext = window.AudioContext
  const originalAudio = global.Audio

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock return values
    mockCreateBufferSource.mockReturnValue({
      buffer: null,
      connect: mockConnect,
      start: mockStart,
    })
    mockPlay.mockResolvedValue(undefined)
    mockResume.mockResolvedValue(undefined)

    // Setup mocks
    Object.defineProperty(window, 'AudioContext', {
      value: MockAudioContext,
      writable: true,
    })
    global.Audio = MockAudio as unknown as typeof Audio
  })

  afterEach(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: originalAudioContext,
      writable: true,
    })
    global.Audio = originalAudio
  })

  it('should start with isUnlocked as false', () => {
    const { result } = renderHook(() => useAudioUnlock())

    expect(result.current.isUnlocked).toBe(false)
  })

  it('should set isUnlocked to true after unlockAudio is called', async () => {
    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(result.current.isUnlocked).toBe(true)
  })

  it('should resume suspended AudioContext', async () => {
    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(mockResume).toHaveBeenCalled()
  })

  it('should play silent buffer to activate AudioContext', async () => {
    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(mockCreateBuffer).toHaveBeenCalledWith(1, 1, 22050)
    expect(mockCreateBufferSource).toHaveBeenCalled()
    expect(mockConnect).toHaveBeenCalled()
    expect(mockStart).toHaveBeenCalledWith(0)
  })

  it('should play silent Audio to prime HTMLAudioElement for iOS', async () => {
    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(mockPlay).toHaveBeenCalled()
  })

  it('should handle Audio.play() rejection gracefully', async () => {
    mockPlay.mockRejectedValueOnce(new Error('NotAllowedError'))

    const { result } = renderHook(() => useAudioUnlock())

    // Should not throw
    await act(async () => {
      await result.current.unlockAudio()
    })

    // Should still be marked as unlocked (AudioContext still works)
    expect(result.current.isUnlocked).toBe(true)
  })

  it('should not call unlockAudio again if already unlocked', async () => {
    const { result } = renderHook(() => useAudioUnlock())

    // First unlock
    await act(async () => {
      await result.current.unlockAudio()
    })

    vi.clearAllMocks()

    // Second call should be a no-op
    await act(async () => {
      await result.current.unlockAudio()
    })

    // Should not try to resume again
    expect(mockResume).not.toHaveBeenCalled()
  })

  it('should cleanup AudioContext on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    unmount()

    expect(mockClose).toHaveBeenCalled()
  })

  it('should handle case where AudioContext is not available', async () => {
    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      value: undefined,
      writable: true,
    })

    const { result } = renderHook(() => useAudioUnlock())

    // Should not throw
    await act(async () => {
      await result.current.unlockAudio()
    })

    // Should still mark as unlocked (best effort)
    expect(result.current.isUnlocked).toBe(true)
  })

  it('should provide stable unlockAudio callback reference', async () => {
    const { result, rerender } = renderHook(() => useAudioUnlock())

    const firstCallback = result.current.unlockAudio

    rerender()

    const secondCallback = result.current.unlockAudio

    // Callback should be stable due to useCallback
    expect(firstCallback).toBe(secondCallback)
  })

  it('should handle AudioContext.resume() rejection gracefully', async () => {
    mockResume.mockRejectedValueOnce(new Error('Resume failed'))

    const { result } = renderHook(() => useAudioUnlock())

    // Should not throw
    await act(async () => {
      await result.current.unlockAudio()
    })

    // Warning should be logged but hook continues
  })
})

describe('iOS Safari specific behaviors', () => {
  const originalAudioContext = window.AudioContext
  const originalAudio = global.Audio

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    Object.defineProperty(window, 'AudioContext', {
      value: MockAudioContext,
      writable: true,
    })
    global.Audio = MockAudio as unknown as typeof Audio
  })

  afterEach(() => {
    Object.defineProperty(window, 'AudioContext', {
      value: originalAudioContext,
      writable: true,
    })
    global.Audio = originalAudio
  })

  it('should set nearly silent volume on priming audio', async () => {
    let capturedVolume = 0
    const VolumeCapturingAudio = class {
      src = ''
      _volume = 1
      get volume() {
        return this._volume
      }
      set volume(v: number) {
        this._volume = v
        capturedVolume = v
      }
      currentTime = 0
      play = vi.fn().mockResolvedValue(undefined)
      pause = vi.fn()
    }

    global.Audio = VolumeCapturingAudio as unknown as typeof Audio

    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(capturedVolume).toBe(0.01)
  })

  it('should pause and reset audio after successful play', async () => {
    const mockAudioInstance = {
      src: '',
      volume: 1,
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    }

    global.Audio = vi.fn(() => mockAudioInstance) as unknown as typeof Audio

    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(mockAudioInstance.pause).toHaveBeenCalled()
    expect(mockAudioInstance.currentTime).toBe(0)
  })

  it('should use base64 silent MP3 for audio priming', async () => {
    let capturedSrc = ''
    const SrcCapturingAudio = class {
      _src = ''
      get src() {
        return this._src
      }
      set src(v: string) {
        this._src = v
        capturedSrc = v
      }
      volume = 1
      currentTime = 0
      play = vi.fn().mockResolvedValue(undefined)
      pause = vi.fn()
    }

    global.Audio = SrcCapturingAudio as unknown as typeof Audio

    const { result } = renderHook(() => useAudioUnlock())

    await act(async () => {
      await result.current.unlockAudio()
    })

    expect(capturedSrc).toContain('data:audio/mp3;base64')
  })
})
