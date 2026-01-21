'use client'

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlaylists } from './usePlaylists'

const STORAGE_KEY = 'blindtest_playlists'

describe('usePlaylists', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with empty playlists array', () => {
      const { result } = renderHook(() => usePlaylists())
      expect(result.current.playlists).toEqual([])
    })

    it('should load playlists from localStorage on mount', () => {
      const savedPlaylists = [
        { id: 'p1', name: 'Rock', songIds: ['s1', 's2'], createdAt: 1000 },
        { id: 'p2', name: 'Pop', songIds: ['s3'], createdAt: 2000 },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlaylists))

      const { result } = renderHook(() => usePlaylists())

      // Need to wait for useEffect
      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.playlists).toEqual(savedPlaylists)
      expect(result.current.isLoaded).toBe(true)
    })

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')

      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.playlists).toEqual([])
      expect(result.current.isLoaded).toBe(true)
    })

    it('should handle non-array data in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notAnArray: true }))

      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.playlists).toEqual([])
    })

    it('should filter out invalid playlist objects from localStorage', () => {
      const mixedData = [
        { id: 'p1', name: 'Valid', songIds: ['s1'], createdAt: 1000 },
        { id: 'p2' }, // Missing name, songIds, createdAt
        { name: 'NoId', songIds: ['s1'], createdAt: 2000 }, // Missing id
        { id: 'p3', name: 'Valid2', songIds: ['s2'], createdAt: 3000 },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedData))

      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.playlists).toHaveLength(2)
      expect(result.current.playlists[0].name).toBe('Valid')
      expect(result.current.playlists[1].name).toBe('Valid2')
    })
  })

  describe('createPlaylist', () => {
    it('should create a new playlist with the given name', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      act(() => {
        result.current.createPlaylist('My Playlist')
      })

      expect(result.current.playlists).toHaveLength(1)
      expect(result.current.playlists[0].name).toBe('My Playlist')
      expect(result.current.playlists[0].songIds).toEqual([])
      expect(result.current.playlists[0].id).toBeTruthy()
      expect(result.current.playlists[0].createdAt).toBeTruthy()
    })

    it('should use default name for empty string', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('   ')
      })

      expect(result.current.playlists[0].name).toBe('Nouvelle playlist')
    })

    it('should trim whitespace from playlist name', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('  Trimmed Name  ')
      })

      expect(result.current.playlists[0].name).toBe('Trimmed Name')
    })

    it('should persist new playlist to localStorage', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Saved Playlist')
      })

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      expect(saved).toHaveLength(1)
      expect(saved[0].name).toBe('Saved Playlist')
    })
  })

  describe('updatePlaylist', () => {
    it('should update playlist name', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Original')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.updatePlaylist(playlistId, { name: 'Updated' })
      })

      expect(result.current.playlists[0].name).toBe('Updated')
    })

    it('should update playlist songIds', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.updatePlaylist(playlistId, {
          songIds: ['s1', 's2', 's3'],
        })
      })

      expect(result.current.playlists[0].songIds).toEqual(['s1', 's2', 's3'])
    })

    it('should set updatedAt timestamp on update', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id
      const originalUpdatedAt = result.current.playlists[0].updatedAt

      // Advance time
      vi.advanceTimersByTime(1000)

      act(() => {
        result.current.updatePlaylist(playlistId, { name: 'New Name' })
      })

      expect(result.current.playlists[0].updatedAt).toBeDefined()
      expect(result.current.playlists[0].updatedAt).not.toBe(originalUpdatedAt)
    })

    it('should successfully update existing playlist (verified via state)', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.updatePlaylist(playlistId, { name: 'New' })
      })

      // Verify success by checking state was updated
      expect(result.current.playlists[0].name).toBe('New')
    })

    it('should return false for non-existent playlist', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      let success = true

      act(() => {
        success = result.current.updatePlaylist('nonexistent', { name: 'New' })
      })

      expect(success).toBe(false)
    })

    it('should persist updates to localStorage', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.updatePlaylist(playlistId, { name: 'Persisted' })
      })

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      expect(saved[0].name).toBe('Persisted')
    })
  })

  describe('deletePlaylist', () => {
    it('should remove playlist from list', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('ToDelete')
        result.current.createPlaylist('ToKeep')
      })

      const deleteId = result.current.playlists[0].id

      act(() => {
        result.current.deletePlaylist(deleteId)
      })

      expect(result.current.playlists).toHaveLength(1)
      expect(result.current.playlists[0].name).toBe('ToKeep')
    })

    it('should successfully delete existing playlist (verified via state)', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      expect(result.current.playlists).toHaveLength(1)
      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.deletePlaylist(playlistId)
      })

      // Verify success by checking state was updated
      expect(result.current.playlists).toHaveLength(0)
    })

    it('should return false for non-existent playlist', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      let success = true

      act(() => {
        success = result.current.deletePlaylist('nonexistent')
      })

      expect(success).toBe(false)
    })

    it('should persist deletion to localStorage', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('ToDelete')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.deletePlaylist(playlistId)
      })

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      expect(saved).toHaveLength(0)
    })
  })

  describe('getPlaylist', () => {
    it('should return playlist by ID', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('FindMe')
      })

      const playlistId = result.current.playlists[0].id
      const found = result.current.getPlaylist(playlistId)

      expect(found?.name).toBe('FindMe')
    })

    it('should return undefined for non-existent ID', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      const found = result.current.getPlaylist('nonexistent')

      expect(found).toBeUndefined()
    })
  })

  describe('addSongToPlaylist', () => {
    it('should add song ID to playlist', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).toContain('song1')
    })

    it('should not add duplicate song ID', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
        result.current.addSongToPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).toEqual(['song1'])
    })

    it('should successfully add song (verified via state)', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id
      expect(result.current.playlists[0].songIds).toEqual([])

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
      })

      // Verify success by checking state was updated
      expect(result.current.playlists[0].songIds).toContain('song1')
    })

    it('should return false for duplicate song', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id
      let success = true

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
        success = result.current.addSongToPlaylist(playlistId, 'song1')
      })

      expect(success).toBe(false)
    })
  })

  describe('removeSongFromPlaylist', () => {
    it('should remove song ID from playlist', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
        result.current.addSongToPlaylist(playlistId, 'song2')
      })

      act(() => {
        result.current.removeSongFromPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).toEqual(['song2'])
    })

    it('should successfully remove song (verified via state)', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).toContain('song1')

      act(() => {
        result.current.removeSongFromPlaylist(playlistId, 'song1')
      })

      // Verify success by checking state was updated
      expect(result.current.playlists[0].songIds).not.toContain('song1')
    })

    it('should return false for non-existent song', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id
      let success = true

      act(() => {
        success = result.current.removeSongFromPlaylist(
          playlistId,
          'nonexistent'
        )
      })

      expect(success).toBe(false)
    })
  })

  describe('toggleSongInPlaylist', () => {
    it('should add song if not present', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.toggleSongInPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).toContain('song1')
    })

    it('should remove song if present', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
        result.current.createPlaylist('Test')
      })

      const playlistId = result.current.playlists[0].id

      act(() => {
        result.current.addSongToPlaylist(playlistId, 'song1')
      })

      act(() => {
        result.current.toggleSongInPlaylist(playlistId, 'song1')
      })

      expect(result.current.playlists[0].songIds).not.toContain('song1')
    })

    it('should return false for non-existent playlist', () => {
      const { result } = renderHook(() => usePlaylists())

      act(() => {
        vi.runAllTimers()
      })

      let success = true

      act(() => {
        success = result.current.toggleSongInPlaylist('nonexistent', 'song1')
      })

      expect(success).toBe(false)
    })
  })
})
