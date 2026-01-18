import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSoundEffects } from './useSoundEffects'

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
  state: 'running' as AudioContextState,
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({
    ...mockGain,
    gain: { ...mockGain.gain },
  })),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
}

// Store the original AudioContext
const originalAudioContext = globalThis.AudioContext

describe('useSoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock AudioContext globally
    globalThis.AudioContext = vi.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext
    mockAudioContext.state = 'running'
  })

  afterEach(() => {
    // Restore original AudioContext
    globalThis.AudioContext = originalAudioContext
  })

  describe('initialization', () => {
    it('should return all sound effect methods', () => {
      const { result } = renderHook(() => useSoundEffects())

      expect(result.current.buzz).toBeInstanceOf(Function)
      expect(result.current.correct).toBeInstanceOf(Function)
      expect(result.current.incorrect).toBeInstanceOf(Function)
      expect(result.current.timeout).toBeInstanceOf(Function)
      expect(result.current.tick).toBeInstanceOf(Function)
      expect(result.current.reveal).toBeInstanceOf(Function)
      expect(result.current.setMuted).toBeInstanceOf(Function)
      expect(result.current.setVolume).toBeInstanceOf(Function)
    })

    it('should initialize with default volume of 0.7', () => {
      const { result } = renderHook(() => useSoundEffects())
      expect(result.current.volume).toBe(0.7)
    })

    it('should initialize with muted as false', () => {
      const { result } = renderHook(() => useSoundEffects())
      expect(result.current.isMuted).toBe(false)
    })
  })

  describe('buzz sound', () => {
    it('should create AudioContext and play buzz sound', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.buzz()
      })

      expect(globalThis.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play buzz sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.buzz()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('correct sound', () => {
    it('should play correct sound', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.correct()
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play correct sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.correct()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('incorrect sound', () => {
    it('should play incorrect sound', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.incorrect()
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play incorrect sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.incorrect()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('timeout sound', () => {
    it('should play timeout sound', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.timeout()
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play timeout sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.timeout()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('tick sound', () => {
    it('should play tick sound with default remaining seconds', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.tick()
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should play tick sound with custom remaining seconds', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.tick(3)
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    })

    it('should not play tick sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.tick()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('reveal sound', () => {
    it('should play reveal sound', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.reveal()
      })

      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not play reveal sound when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.reveal()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('mute functionality', () => {
    it('should update isMuted state when setMuted is called', () => {
      const { result } = renderHook(() => useSoundEffects())

      expect(result.current.isMuted).toBe(false)

      act(() => {
        result.current.setMuted(true)
      })

      expect(result.current.isMuted).toBe(true)

      act(() => {
        result.current.setMuted(false)
      })

      expect(result.current.isMuted).toBe(false)
    })

    it('should block all sounds when muted', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setMuted(true)
      })

      vi.clearAllMocks()

      act(() => {
        result.current.buzz()
        result.current.correct()
        result.current.incorrect()
        result.current.timeout()
        result.current.tick()
        result.current.reveal()
      })

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('volume control', () => {
    it('should update volume state when setVolume is called', () => {
      const { result } = renderHook(() => useSoundEffects())

      expect(result.current.volume).toBe(0.7)

      act(() => {
        result.current.setVolume(0.5)
      })

      expect(result.current.volume).toBe(0.5)
    })

    it('should clamp volume to 0 minimum', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setVolume(-0.5)
      })

      expect(result.current.volume).toBe(0)
    })

    it('should clamp volume to 1 maximum', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setVolume(1.5)
      })

      expect(result.current.volume).toBe(1)
    })

    it('should allow volume of 0', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setVolume(0)
      })

      expect(result.current.volume).toBe(0)
    })

    it('should allow volume of 1', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.setVolume(1)
      })

      expect(result.current.volume).toBe(1)
    })
  })

  describe('AudioContext handling', () => {
    it('should resume suspended AudioContext', () => {
      mockAudioContext.state = 'suspended'
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.buzz()
      })

      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('should reuse existing AudioContext', () => {
      const { result } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.buzz()
      })

      const callCount = (
        globalThis.AudioContext as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.length

      act(() => {
        result.current.correct()
      })

      expect(
        (globalThis.AudioContext as unknown as ReturnType<typeof vi.fn>).mock
          .calls.length
      ).toBe(callCount)
    })

    it('should close AudioContext on unmount', () => {
      const { unmount } = renderHook(() => useSoundEffects())

      unmount()

      // AudioContext is only created when a sound is played
      // So we need to play a sound first
    })

    it('should close AudioContext on unmount after playing sound', () => {
      const { result, unmount } = renderHook(() => useSoundEffects())

      act(() => {
        result.current.buzz()
      })

      unmount()

      expect(mockAudioContext.close).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle AudioContext creation error gracefully', () => {
      globalThis.AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported')
      }) as unknown as typeof AudioContext

      const { result } = renderHook(() => useSoundEffects())

      // Should not throw
      expect(() => {
        act(() => {
          result.current.buzz()
        })
      }).not.toThrow()
    })
  })

  describe('callback stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useSoundEffects())

      const initialBuzz = result.current.buzz
      const initialCorrect = result.current.correct
      const initialIncorrect = result.current.incorrect
      const initialTimeout = result.current.timeout
      const initialTick = result.current.tick
      const initialReveal = result.current.reveal
      const initialSetMuted = result.current.setMuted
      const initialSetVolume = result.current.setVolume

      rerender()

      expect(result.current.buzz).toBe(initialBuzz)
      expect(result.current.correct).toBe(initialCorrect)
      expect(result.current.incorrect).toBe(initialIncorrect)
      expect(result.current.timeout).toBe(initialTimeout)
      expect(result.current.tick).toBe(initialTick)
      expect(result.current.reveal).toBe(initialReveal)
      expect(result.current.setMuted).toBe(initialSetMuted)
      expect(result.current.setVolume).toBe(initialSetVolume)
    })
  })
})
