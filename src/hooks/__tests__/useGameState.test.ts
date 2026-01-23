/**
 * Test suite for useGameState hook and gameReducer
 *
 * This file contains comprehensive tests for the game state machine as per Epic 12.3.
 * Tests cover:
 * - Each action in the reducer
 * - All state transitions
 * - Edge cases and error scenarios
 * - 100% coverage of the reducer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../useGameState'
import type { GameConfig, Song } from '@/lib/types'

// Mock song for testing
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

// Additional mock songs for multi-song tests
const mockSong2: Song = {
  id: 'def456789abc',
  title: 'Another Song',
  artist: 'Another Artist',
  album: 'Another Album',
  year: 2023,
  duration: 240,
  filePath: '/music/another.mp3',
  format: 'mp3',
  hasCover: false,
}

const mockSong3: Song = {
  id: 'ghi789012def',
  title: 'Third Song',
  artist: 'Third Artist',
  album: 'Third Album',
  year: 2022,
  duration: 200,
  filePath: '/music/third.mp3',
  format: 'mp3',
  hasCover: true,
}

// Default game config
const mockConfig: GameConfig = {
  guessMode: 'both',
  clipDuration: 20,
  timerDuration: 5,
  noTimer: false,
  revealDuration: 5,
}

describe('gameReducer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('starts with idle status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.status).toBe('idle')
    })

    it('initializes with configured timer duration', () => {
      const config = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(config))
      expect(result.current.state.timerRemaining).toBe(10)
    })

    it('initializes with zero score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.score).toBe(0)
    })

    it('initializes with zero songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.songsPlayed).toBe(0)
    })

    it('initializes with empty playedSongIds array', () => {
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

    it('initializes with null previousStatus', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.previousStatus).toBeNull()
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

    it('resets score to 0', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      // Build up some state first
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.score).toBe(1)

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.score).toBe(0)
    })

    it('resets songsPlayed to 0', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.songsPlayed).toBe(1)

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.songsPlayed).toBe(0)
    })

    it('clears playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds.length).toBeGreaterThan(0)

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('clears currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.currentSong).not.toBeNull()

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.currentSong).toBeNull()
    })
  })

  describe('LOAD_SONG action', () => {
    it('sets currentSong to provided song', () => {
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
        result.current.actions.loadSong(mockSong2)
      })
      expect(result.current.state.isRevealed).toBe(false)
    })

    it('replaces previous song', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.currentSong?.id).toBe(mockSong.id)

      act(() => {
        result.current.actions.loadSong(mockSong2)
      })
      expect(result.current.state.currentSong?.id).toBe(mockSong2.id)
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

    it('clears previousStatus', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.previousStatus).toBeNull()
    })
  })

  describe('BUZZ action', () => {
    it('transitions from playing to timer when noTimer is false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')
    })

    it('sets timerRemaining to config timerDuration', () => {
      const config = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(config))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.timerRemaining).toBe(10)
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

    it('ignores buzz in timer state (no double buzz)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')

      act(() => {
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')
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
  })

  describe('TICK_TIMER action', () => {
    it('decrements timerRemaining by 1', () => {
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

    it('sets isRevealed to true when timer expires', () => {
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

    it('does NOT increment score when timer expires (timeout)', () => {
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

      act(() => {
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')

      // Reveal countdown auto-advances to loading after revealDuration
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      // Discovery mode: auto-advances to loading for next song
      expect(result.current.state.status).toBe('loading')
    })
  })

  describe('VALIDATE action', () => {
    it('VALIDATE(true) transitions to reveal', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('VALIDATE(true) increments score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.score).toBe(1)
    })

    it('VALIDATE(false) does NOT increment score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.score).toBe(0)
    })

    it('VALIDATE sets isRevealed to true', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('VALIDATE increments songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('VALIDATE adds song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
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

    it('increments songsPlayed when revealing for first time', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('does NOT double count songsPlayed when already revealed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.songsPlayed).toBe(1)

      act(() => {
        result.current.actions.reveal()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('adds song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('does NOT add duplicate song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })

      act(() => {
        result.current.actions.reveal()
      })

      const idCount = result.current.state.playedSongIds.filter(
        (id) => id === mockSong.id
      ).length
      expect(idCount).toBe(1)
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
      })
      expect(result.current.state.isRevealed).toBe(true)

      act(() => {
        result.current.actions.nextSong()
      })
      expect(result.current.state.isRevealed).toBe(false)
    })

    it('resets timerRemaining to config timerDuration', () => {
      const config = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(config))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(result.current.state.timerRemaining).toBe(7)

      act(() => {
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.timerRemaining).toBe(10)
    })

    it('preserves score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.score).toBe(1)
    })

    it('preserves songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
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

    it('preserves score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.quit()
      })
      expect(result.current.state.score).toBe(1)
    })

    it('preserves songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.quit()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('preserves playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.quit()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })
  })

  describe('RESET action', () => {
    it('returns to idle status', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reset()
      })
      expect(result.current.state.status).toBe('idle')
    })

    it('resets score to 0', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.reset()
      })
      expect(result.current.state.score).toBe(0)
    })

    it('resets songsPlayed to 0', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.reset()
      })
      expect(result.current.state.songsPlayed).toBe(0)
    })

    it('clears playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.reset()
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('clears currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.reset()
      })
      expect(result.current.state.currentSong).toBeNull()
    })

    it('resets isRevealed to false', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.reset()
      })
      expect(result.current.state.isRevealed).toBe(false)
    })
  })

  describe('CLIP_ENDED action', () => {
    it('transitions from playing to reveal', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('sets isRevealed to true', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.isRevealed).toBe(true)
    })

    it('increments songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('adds song id to playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('ignores clip ended if not in playing state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('ignores clip ended in timer state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('timer')
    })
  })

  describe('REPLAY action', () => {
    it('transitions from reveal to playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.replay()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('ignores replay if not in reveal state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.replay()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('does NOT reset timer', () => {
      const config = { ...mockConfig, timerDuration: 10 }
      const { result } = renderHook(() => useGameState(config))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(result.current.state.timerRemaining).toBe(7)

      act(() => {
        result.current.actions.validate(false)
        result.current.actions.replay()
      })
      expect(result.current.state.timerRemaining).toBe(7)
    })

    it('preserves score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.replay()
      })
      expect(result.current.state.score).toBe(1)
    })

    it('preserves songsPlayed', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.replay()
      })
      expect(result.current.state.songsPlayed).toBe(1)
    })

    it('preserves playedSongIds', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.replay()
      })
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
    })

    it('preserves currentSong', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.replay()
      })
      expect(result.current.state.currentSong).toEqual(mockSong)
    })

    it('preserves isRevealed state', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
        result.current.actions.replay()
      })
      expect(result.current.state.isRevealed).toBe(true)
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

    it('preserves timerRemaining when pausing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      const timerBefore = result.current.state.timerRemaining

      act(() => {
        result.current.actions.pause('timer')
      })
      expect(result.current.state.timerRemaining).toBe(timerBefore)
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
        vi.advanceTimersByTime(3000)
      })
      // Timer should not have changed while paused
      expect(result.current.state.timerRemaining).toBe(timerAtPause)
    })
  })

  describe('RESUME action', () => {
    it('transitions from paused to playing', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('transitions from paused to timer', () => {
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

    it('resumes timer countdown after unpausing from timer', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.pause('timer')
      })
      const timerAtPause = result.current.state.timerRemaining

      act(() => {
        vi.advanceTimersByTime(2000)
      })
      // Timer should not tick while paused
      expect(result.current.state.timerRemaining).toBe(timerAtPause)

      act(() => {
        result.current.actions.resume()
      })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // Timer should tick after resume
      expect(result.current.state.timerRemaining).toBe(timerAtPause - 1)
    })

    it('preserves all state after pause/resume cycle', () => {
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

  describe('State Transitions', () => {
    it('idle -> loading (START_GAME)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      expect(result.current.state.status).toBe('idle')

      act(() => {
        result.current.actions.startGame()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('loading -> playing (PLAY)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
      })
      expect(result.current.state.status).toBe('loading')

      act(() => {
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')
    })

    it('playing -> timer (BUZZ)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')
    })

    it('timer -> reveal (TICK_TIMER reaches 0)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')

      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('timer -> reveal (VALIDATE)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')

      act(() => {
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('playing -> reveal (REVEAL)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.reveal()
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('playing -> reveal (CLIP_ENDED)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.clipEnded()
      })
      expect(result.current.state.status).toBe('reveal')
    })

    it('reveal -> loading (NEXT_SONG)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.reveal()
      })
      expect(result.current.state.status).toBe('reveal')

      act(() => {
        result.current.actions.nextSong()
      })
      expect(result.current.state.status).toBe('loading')
    })

    it('reveal -> playing (REPLAY)', () => {
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

    it('any -> ended (END_GAME)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })

      act(() => {
        result.current.actions.quit()
      })
      expect(result.current.state.status).toBe('ended')
    })

    it('any -> idle (RESET)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        result.current.actions.reset()
      })
      expect(result.current.state.status).toBe('idle')
    })

    it('playing -> paused (PAUSE)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })
      expect(result.current.state.status).toBe('playing')

      act(() => {
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('paused')
    })

    it('timer -> paused (PAUSE)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('timer')

      act(() => {
        result.current.actions.pause('timer')
      })
      expect(result.current.state.status).toBe('paused')
    })

    it('paused -> previousStatus (RESUME)', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.pause('playing')
      })
      expect(result.current.state.status).toBe('paused')

      act(() => {
        result.current.actions.resume()
      })
      expect(result.current.state.status).toBe('playing')
    })
  })

  describe('Edge Cases', () => {
    it('handles null currentSong in TICK_TIMER gracefully', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      // Directly dispatch to simulate edge case
      act(() => {
        result.current.dispatch({ type: 'TICK_TIMER' })
      })
      // Should not crash
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('handles null currentSong in VALIDATE gracefully', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.dispatch({ type: 'VALIDATE', correct: true })
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('handles null currentSong in REVEAL gracefully', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.dispatch({ type: 'REVEAL' })
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('handles null currentSong in CLIP_ENDED gracefully', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      act(() => {
        result.current.dispatch({ type: 'PLAY' })
        result.current.dispatch({ type: 'CLIP_ENDED', revealDuration: 5 })
      })
      expect(result.current.state.playedSongIds).toEqual([])
    })

    it('multiple correct answers accumulate score', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.score).toBe(1)

      act(() => {
        result.current.actions.loadSong(mockSong2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })
      expect(result.current.state.score).toBe(2)

      act(() => {
        result.current.actions.loadSong(mockSong3)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.score).toBe(3)
    })

    it('full game flow with multiple songs', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      // Song 1: Correct answer
      act(() => {
        result.current.actions.startGame()
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
        result.current.actions.nextSong()
      })

      // Song 2: Wrong answer
      act(() => {
        result.current.actions.loadSong(mockSong2)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
        result.current.actions.nextSong()
      })

      // Song 3: Timer expired
      act(() => {
        result.current.actions.loadSong(mockSong3)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.state.score).toBe(1)
      expect(result.current.state.songsPlayed).toBe(3)
      expect(result.current.state.playedSongIds).toHaveLength(3)
      expect(result.current.state.playedSongIds).toContain(mockSong.id)
      expect(result.current.state.playedSongIds).toContain(mockSong2.id)
      expect(result.current.state.playedSongIds).toContain(mockSong3.id)
    })

    it('replay after incorrect answer allows another attempt', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(false)
      })
      expect(result.current.state.score).toBe(0)
      expect(result.current.state.status).toBe('reveal')

      act(() => {
        result.current.actions.replay()
      })
      expect(result.current.state.status).toBe('playing')
      // Can't re-score the same song, but can replay the clip
    })

    it('handles rapid pause/resume cycles', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
      })

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.actions.pause('playing')
        })
        expect(result.current.state.status).toBe('paused')

        act(() => {
          result.current.actions.resume()
        })
        expect(result.current.state.status).toBe('playing')
      }
    })
  })

  describe('noTimer mode', () => {
    const noTimerConfig: GameConfig = {
      guessMode: 'both',
      clipDuration: 20,
      timerDuration: 5,
      noTimer: true,
      revealDuration: 5,
    }

    it('transitions from playing to buzzed (not timer)', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })
      expect(result.current.state.status).toBe('buzzed')
    })

    it('does NOT start timer countdown in buzzed state', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })
      expect(result.current.state.status).toBe('buzzed')
    })

    it('allows manual validation from buzzed state', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.score).toBe(1)
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

    it('player has unlimited time to answer', () => {
      const { result } = renderHook(() => useGameState(noTimerConfig))
      act(() => {
        result.current.actions.loadSong(mockSong)
        result.current.actions.play()
        result.current.actions.buzz()
      })

      act(() => {
        vi.advanceTimersByTime(60000) // 1 minute
      })
      expect(result.current.state.status).toBe('buzzed')
      expect(result.current.state.score).toBe(0)

      act(() => {
        result.current.actions.validate(true)
      })
      expect(result.current.state.status).toBe('reveal')
      expect(result.current.state.score).toBe(1)
    })
  })

  describe('Immutability', () => {
    it('returns new state object on each action', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      const state1 = result.current.state

      act(() => {
        result.current.actions.startGame()
      })

      expect(result.current.state).not.toBe(state1)
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

  describe('Action Callbacks', () => {
    it('exposes all expected action functions', () => {
      const { result } = renderHook(() => useGameState(mockConfig))

      expect(typeof result.current.actions.startGame).toBe('function')
      expect(typeof result.current.actions.loadSong).toBe('function')
      expect(typeof result.current.actions.play).toBe('function')
      expect(typeof result.current.actions.pause).toBe('function')
      expect(typeof result.current.actions.resume).toBe('function')
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

    it('action callbacks are stable across renders', () => {
      const { result, rerender } = renderHook(() => useGameState(mockConfig))
      const actions1 = result.current.actions

      rerender()

      // Action object should be the same reference (memoized)
      expect(result.current.actions).toBe(actions1)
    })
  })

  describe('Default action handling', () => {
    it('returns unchanged state for unknown action type', () => {
      const { result } = renderHook(() => useGameState(mockConfig))
      const stateBefore = result.current.state

      act(() => {
        // TypeScript would normally prevent this, but we test runtime behavior
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.current.dispatch({ type: 'UNKNOWN_ACTION' } as any)
      })

      // State should be unchanged for unknown action
      expect(result.current.state.status).toBe(stateBefore.status)
      expect(result.current.state.score).toBe(stateBefore.score)
    })
  })
})
