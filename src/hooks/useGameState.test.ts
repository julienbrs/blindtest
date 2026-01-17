import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from './useGameState'
import type { GameConfig, Song } from '@/lib/types'

const mockSong: Song = {
  id: 'abc123def456',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  year: 2024,
  duration: 180,
  filePath: '/music/test.mp3',
  format: 'mp3',
  hasCover: true,
}

const mockConfig: GameConfig = {
  guessMode: 'both',
  clipDuration: 20,
  timerDuration: 5,
}

describe('useGameState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with idle status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.status).toBe('idle')
    })

    it('initializes with configured timer duration', () => {
      const config = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(config))
      expect(result.current.state.timerRemaining).toBe(10)
    })

    it('initializes with zero score and songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.score).toBe(0)
      expect(result.current.state.songsPlayed).toBe(0)
    })

    it('initializes with empty playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('initializes with isRevealed false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.isRevealed).toBe(false)
    })

    it('initializes with null currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.currentSong).toBeNull()
    })
  })

  describe('START_GAME action', () => {
    it('transitions from idle to loading', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('resets state when starting game', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      // First set some state
      act(() => {
        result.current.actions.startGame()
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      // Then start new game
      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.score).toBe(0)
      expect(result.current.state.songsPlayed).toBe(0)
      expect(result.current.state.playedSongIds).toEqual([])
    })
  })

  describe('LOAD_SONG action', () => {
    it('sets currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.currentSong).toEqual(mockSong)
    })

    it('sets status to loading', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('resets isRevealed to false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.isRevealed).toBe(true)
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.isRevealed).toBe(false)
    })
  })

  describe('PLAY action', () => {
    it('transitions to playing status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')
    })
  })

  describe('BUZZ action', () => {
    it('transitions from playing to timer', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')
    })

    it('ignores buzz if not in playing state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('idle')
    })

    it('ignores buzz in loading state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('resets timerRemaining to config timerDuration on buzz', () => {
      const configWithTimer10 = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(configWithTimer10))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.timerRemaining).toBe(10)
    })

    it('ignores buzz in reveal state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('ignores buzz in timer state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')
      // Try buzzing again
      act(() => {
        result.current.actions.buzz()
      })
      // Should still be in timer state
      expect(result.current.state.status).toBe('timer')
    })

    it('triggers immediate transition from playing to timer (no buzzed intermediate)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.buzz()
      })
      // Should go directly to timer, not through buzzed
      expect(result.current.state.status).toBe('timer')
    })
  })

  describe('Timer countdown', () => {
    it('decrements timer every second', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.timerRemaining).toBe(5)

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.state.timerRemaining).toBe(4)

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.state.timerRemaining).toBe(3)
    })

    it('transitions to reveal when timer reaches 0', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.timerRemaining).toBe(0)
    })

    it('reveals answer when timer expires', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('increments songsPlayed when timer expires', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('adds song id to playedSongIds when timer expires', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('does not increment score when timer expires (timeout)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.score).toBe(0)
    })

    it('stops timer when not in timer state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(result.current.state.timerRemaining).toBe(3)

      // Validate before timer ends
      act(() => {
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')

      // Timer should stop
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // timerRemaining should stay at 3 since we validated
      expect(result.current.state.status).toBe('reveal')
    })
  })

  describe('VALIDATE action', () => {
    it('transitions to reveal', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('increments score when correct', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.score).toBe(1)
    })

    it('does not increment score when incorrect', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.score).toBe(0)
    })

    it('increments songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('adds song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('sets isRevealed to true', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.isRevealed).toBe(true)
    })
  })

  describe('REVEAL action', () => {
    it('transitions to reveal status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('sets isRevealed to true', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('increments songsPlayed when not already in reveal', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('does not double count songsPlayed when already revealed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      act(() => {
        result.current.actions.reveal()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('does not add duplicate song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      act(() => {
        result.current.actions.reveal()
      })
      expect(
        result.current.state.playedSongIds.filter((id) => id === mockSong.id)
          .length
      ).toBe(1)
    })
  })

  describe('NEXT_SONG action', () => {
    it('transitions to loading status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.nextSong()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('clears currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.nextSong()
      })
      expect(result.current.state.currentSong).toBeNull()
    })

    it('resets isRevealed to false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.nextSong()
      })
      expect(result.current.state.isRevealed).toBe(false)
    })

    it('preserves score and songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.score).toBe(1)
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('preserves playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })
  })

  describe('END_GAME action', () => {
    it('transitions to ended status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.quit()
      })
      expect(result.current.state.status).toBe('ended')
    })

    it('preserves score and stats', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.quit()
      })
      expect(result.current.state.score).toBe(1)
      expect(result.current.state.songsPlayed).toBe(1)
      expect(result.current.state.status).toBe('ended')
    })
  })

  describe('RESET action', () => {
    it('returns to initial state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.reset()
      })
      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.score).toBe(0)
      expect(result.current.state.songsPlayed).toBe(0)
      expect(result.current.state.playedSongIds).toEqual([])
      expect(result.current.state.currentSong).toBeNull()
      expect(result.current.state.isRevealed).toBe(false)
    })
  })

  describe('clipEnded action', () => {
    it('reveals answer when clip ends during playing state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('does nothing if not in playing state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('loading')
    })
  })

  describe('immutability', () => {
    it('returns new state object on each action', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      const initialState = result.current.state

      act(() => {
        result.current.actions.startGame()
      })

      expect(result.current.state).not.toBe(initialState)
    })

    it('does not mutate playedSongIds array', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      const playedIdsBefore = result.current.state.playedSongIds

      act(() => {
        result.current.actions.validate(true)
      })

      expect(result.current.state.playedSongIds).not.toBe(playedIdsBefore)
    })
  })

  describe('typed actions', () => {
    it('exposes all expected actions', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(typeof result.current.actions.startGame).toBe('function')
      expect(typeof result.current.actions.loadSong).toBe('function')
      expect(typeof result.current.actions.play).toBe('function')
      expect(typeof result.current.actions.pause).toBe('function')
      expect(typeof result.current.actions.buzz).toBe('function')
      expect(typeof result.current.actions.validate).toBe('function')
      expect(typeof result.current.actions.reveal).toBe('function')
      expect(typeof result.current.actions.nextSong).toBe('function')
      expect(typeof result.current.actions.quit).toBe('function')
      expect(typeof result.current.actions.reset).toBe('function')
      expect(typeof result.current.actions.clipEnded).toBe('function')
    })

    it('exposes dispatch function', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(typeof result.current.dispatch).toBe('function')
    })
  })
})
