'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Playlist } from '@/lib/types'

const STORAGE_KEY = 'blindtest_playlists'

/**
 * Generate a unique ID for a playlist
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Load playlists from localStorage
 */
function loadPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return []

  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []

  try {
    const data = JSON.parse(saved)
    if (!Array.isArray(data)) return []

    // Validate each playlist
    return data.filter(
      (p: unknown): p is Playlist =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as Playlist).id === 'string' &&
        typeof (p as Playlist).name === 'string' &&
        Array.isArray((p as Playlist).songIds) &&
        typeof (p as Playlist).createdAt === 'number'
    )
  } catch {
    return []
  }
}

/**
 * Save playlists to localStorage
 */
function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
}

/**
 * Hook for managing playlists with localStorage persistence
 */
export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load playlists on mount
  // This is a legitimate use case for setState in useEffect - hydrating state from localStorage
  useEffect(() => {
    const loaded = loadPlaylists()
    /* eslint-disable react-hooks/set-state-in-effect -- Hydrating from localStorage on mount is standard */
    setPlaylists(loaded)
    setIsLoaded(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Create a new playlist
  const createPlaylist = useCallback((name: string): Playlist => {
    const newPlaylist: Playlist = {
      id: generateId(),
      name: name.trim() || 'Nouvelle playlist',
      songIds: [],
      createdAt: Date.now(),
    }

    setPlaylists((prev) => {
      const updated = [...prev, newPlaylist]
      savePlaylists(updated)
      return updated
    })

    return newPlaylist
  }, [])

  // Update an existing playlist
  const updatePlaylist = useCallback(
    (
      id: string,
      updates: Partial<Pick<Playlist, 'name' | 'songIds'>>
    ): boolean => {
      let found = false

      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === id) {
            found = true
            return {
              ...p,
              ...updates,
              updatedAt: Date.now(),
            }
          }
          return p
        })

        if (found) {
          savePlaylists(updated)
        }

        return updated
      })

      return found
    },
    []
  )

  // Delete a playlist
  const deletePlaylist = useCallback((id: string): boolean => {
    let found = false

    setPlaylists((prev) => {
      const index = prev.findIndex((p) => p.id === id)
      if (index === -1) return prev

      found = true
      const updated = [...prev.slice(0, index), ...prev.slice(index + 1)]
      savePlaylists(updated)
      return updated
    })

    return found
  }, [])

  // Get a specific playlist by ID
  const getPlaylist = useCallback(
    (id: string): Playlist | undefined => {
      return playlists.find((p) => p.id === id)
    },
    [playlists]
  )

  // Add a song to a playlist
  const addSongToPlaylist = useCallback(
    (playlistId: string, songId: string): boolean => {
      let success = false

      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId && !p.songIds.includes(songId)) {
            success = true
            return {
              ...p,
              songIds: [...p.songIds, songId],
              updatedAt: Date.now(),
            }
          }
          return p
        })

        if (success) {
          savePlaylists(updated)
        }

        return updated
      })

      return success
    },
    []
  )

  // Remove a song from a playlist
  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string): boolean => {
      let success = false

      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            const songIndex = p.songIds.indexOf(songId)
            if (songIndex !== -1) {
              success = true
              return {
                ...p,
                songIds: [
                  ...p.songIds.slice(0, songIndex),
                  ...p.songIds.slice(songIndex + 1),
                ],
                updatedAt: Date.now(),
              }
            }
          }
          return p
        })

        if (success) {
          savePlaylists(updated)
        }

        return updated
      })

      return success
    },
    []
  )

  // Toggle a song in a playlist (add if not present, remove if present)
  const toggleSongInPlaylist = useCallback(
    (playlistId: string, songId: string): boolean => {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return false

      if (playlist.songIds.includes(songId)) {
        return removeSongFromPlaylist(playlistId, songId)
      } else {
        return addSongToPlaylist(playlistId, songId)
      }
    },
    [playlists, addSongToPlaylist, removeSongFromPlaylist]
  )

  return {
    playlists,
    isLoaded,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    getPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    toggleSongInPlaylist,
  }
}
