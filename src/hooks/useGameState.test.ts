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
  noTimer: false,
  revealDuration: 5,
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

    it('clears previousStatus when transitioning to playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.previousStatus).toBeNull()
    })
  })

  describe('PAUSE action', () => {
    it('transitions from playing to paused', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('paused')
    })

    it('transitions from timer to paused', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
      })
      expect(result.current.state.status).toBe('paused')
    })

    it('stores previousStatus when pausing from playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
      })
      expect(result.current.state.previousStatus).toBe('playing')
    })

    it('stores previousStatus when pausing from timer', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
      })
      expect(result.current.state.previousStatus).toBe('timer')
    })

    it('ignores pause from idle state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('idle')
    })

    it('ignores pause from loading state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.startGame()
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('ignores pause from reveal state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('preserves timer remaining when pausing from timer state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      const timerBeforePause = result.current.state.timerRemaining
      act(() => {
        result.current.actions.pause('timer')
      })
      expect(result.current.state.timerRemaining).toBe(timerBeforePause)
    })

    it('stops timer countdown when paused', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
      })
      const timerAtPause = result.current.state.timerRemaining
      act(() => {
        vi.advanceTimersByTime(2000) // Advance 2 seconds
      })
      // Timer should not have changed because we're paused
      expect(result.current.state.timerRemaining).toBe(timerAtPause)
    })
  })

  describe('RESUME action', () => {
    it('transitions from paused back to playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('transitions from paused back to timer', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('timer')
    })

    it('clears previousStatus after resume', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
        result.current.actions.resume()
      })
      expect(result.current.state.previousStatus).toBeNull()
    })

    it('ignores resume if not paused', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('resumes timer countdown after unpausing from timer state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
      })
      const timerAtPause = result.current.state.timerRemaining
      act(() => {
        vi.advanceTimersByTime(2000) // Timer should not tick while paused
      })
      expect(result.current.state.timerRemaining).toBe(timerAtPause)
      act(() => {
        result.current.actions.resume()
      })
      act(() => {
        vi.advanceTimersByTime(1000) // Now it should tick
      })
      expect(result.current.state.timerRemaining).toBe(timerAtPause - 1)
    })

    it('preserves all other state after pause/resume cycle', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      const songBefore = result.current.state.currentSong
      const scoreBefore = result.current.state.score
      const songsPlayedBefore = result.current.state.songsPlayed
      act(() => {
        result.current.actions.pause('playing')
        result.current.actions.resume()
      })
      expect(result.current.state.currentSong).toBe(songBefore)
      expect(result.current.state.score).toBe(scoreBefore)
      expect(result.current.state.songsPlayed).toBe(songsPlayedBefore)
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

      // Buzz timer should stop, but reveal countdown will auto-advance
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Discovery mode: reveal countdown auto-advances to loading
      expect(result.current.state.status).toBe('loading')
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

    it('resets timerRemaining to config timerDuration', () => {
      const configWithTimer10 = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(configWithTimer10))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      // Timer is 10, after some time it decreases
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(result.current.state.timerRemaining).toBe(7)
      // Validate and go to next song
      act(() => {
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      // Timer should be reset to config value
      expect(result.current.state.timerRemaining).toBe(10)
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

  describe('REPLAY action', () => {
    it('transitions from reveal to playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.status).toBe('reveal')

      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('does nothing if not in reveal state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.replay()
      })
      // Should still be playing, not change to loading or anything else
      expect(result.current.state.status).toBe('playing')
    })

    it('does not reset timer', () => {
      const configWithTimer10 = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(configWithTimer10))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      // Timer is at 10
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(result.current.state.timerRemaining).toBe(7)

      // Validate to go to reveal
      act(() => {
        result.current.actions.validate(false)
      })
      expect(result.current.state.status).toBe('reveal')
      // Timer should still be 7 (not reset)
      expect(result.current.state.timerRemaining).toBe(7)

      // Replay should not reset timer
      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.status).toBe('playing')
      expect(result.current.state.timerRemaining).toBe(7)
    })

    it('preserves score when replaying', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.score).toBe(1)

      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.score).toBe(1)
    })

    it('preserves songsPlayed when replaying', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.songsPlayed).toBe(1)

      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('preserves playedSongIds when replaying', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)

      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('preserves isRevealed state when replaying', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.isRevealed).toBe(true)

      act(() => {
        result.current.actions.replay()
      })
      // isRevealed stays true - the song info is still visible
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('preserves currentSong when replaying', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.replay()
      })
      expect(result.current.state.currentSong).toEqual(mockSong)
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
      expect(typeof result.current.actions.replay).toBe('function')
    })

    it('exposes dispatch function', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(typeof result.current.dispatch).toBe('function')
    })
  })

  describe('playedSongIds tracking (no repeat in session)', () => {
    const song1: Song = { ...mockSong, id: 'song1id12345' }
    const song2: Song = { ...mockSong, id: 'song2id67890' }
    const song3: Song = { ...mockSong, id: 'song3id11111' }

    it('tracks played songs across multiple rounds via validate', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      // Play first song and validate correct
      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toHaveLength(1)

      // Go to next song
      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
      expect(result.current.state.playedSongIds).toHaveLength(2)

      // Third song
      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song3)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
      expect(result.current.state.playedSongIds).toContain(song3.id)
      expect(result.current.state.playedSongIds).toHaveLength(3)
    })

    it('tracks played songs when timer expires', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      // Let timer expire
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)

      // Next song with timer expiry
      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
      expect(result.current.state.playedSongIds).toHaveLength(2)
    })

    it('tracks played songs when reveal button is used', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)

      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
    })

    it('tracks played songs when clip ends without buzz', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)

      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
    })

    it('preserves playedSongIds when game ends', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.quit()
      })

      expect(result.current.state.status).toBe('ended')
      expect(result.current.state.playedSongIds).toContain(song1.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
      expect(result.current.state.playedSongIds).toHaveLength(2)
    })

    it('clears playedSongIds on reset', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toHaveLength(2)

      act(() => {
        result.current.actions.reset()
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('clears playedSongIds on start new game', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toHaveLength(1)

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('provides playedSongIds for exclude parameter construction', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      // Simulate a game session with multiple songs
      act(() => {
        result.current.actions.loadSong(song1)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })

      // The exclude parameter would be constructed as:
      const excludeParam = result.current.state.playedSongIds.join(',')
      expect(excludeParam).toBe('song1id12345,song2id67890')
    })
  })

  describe('noTimer mode (manual validation only)', () => {
    const noTimerConfig: GameConfig = {
      guessMode: 'both',
      clipDuration: 20,
      timerDuration: 5,
      noTimer: true,
      revealDuration: 5,
    }

    it('transitions from playing to buzzed (not timer) when noTimer is true', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('buzzed')
    })

    it('does not start timer countdown in buzzed state', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('buzzed')

      // Advance time - should not change state
      act(() => {
        vi.advanceTimersByTime(10000)
      })
      // Should still be in buzzed state - no auto-reveal
      expect(result.current.state.status).toBe('buzzed')
    })

    it('allows manual validation from buzzed state (correct)', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.score).toBe(1)
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('allows manual validation from buzzed state (incorrect)', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.score).toBe(0)
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('allows reveal from buzzed state', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.reveal()
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('allows pause from buzzed state', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('buzzed')
      })
      expect(result.current.state.status).toBe('paused')
      expect(result.current.state.previousStatus).toBe('buzzed')
    })

    it('resumes to buzzed state after pause', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('buzzed')
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('buzzed')
    })

    it('player has unlimited time to answer in noTimer mode', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      // Wait a very long time
      act(() => {
        vi.advanceTimersByTime(60000) // 1 minute
      })
      // Still in buzzed state - no timeout
      expect(result.current.state.status).toBe('buzzed')
      expect(result.current.state.score).toBe(0) // No auto-failure

      // Can still validate after long wait
      act(() => {
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.score).toBe(1)
    })

    it('tracks songsPlayed and playedSongIds correctly in noTimer mode', () => {
      const song2: Song = { ...mockSong, id: 'song2test123' }
      const { result } = renderHook(() => useGameState(noTimerConfig))

      // First song
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.songsPlayed).toBe(1)
      expect(result.current.state.playedSongIds).toContain(mockSong.id)

      // Second song
      act(() => {
        result.current.actions.nextSong()
        result.current.actions.loadSong(song2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.songsPlayed).toBe(2)
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
      expect(result.current.state.playedSongIds).toContain(song2.id)
    })

    it('transitions to timer when noTimer is false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      // With noTimer: false (default), should go to timer state
      expect(result.current.state.status).toBe('timer')
    })
  })
})
