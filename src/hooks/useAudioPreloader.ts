'use client'

import { useRef, useCallback, useEffect, useMemo } from 'react'
import type { Song } from '@/lib/types'

/**
 * Preloaded audio data - contains the song metadata and the preloaded audio element
 */
export interface PreloadedAudio {
  song: Song
  audio: HTMLAudioElement
}

/**
 * Options for the useAudioPreloader hook
 */
export interface UseAudioPreloaderOptions {
  /** Additional query parameters for the API call (e.g., filter params) */
  filterQueryString?: string
  /** Whether preloading is enabled */
  enabled?: boolean
}

/**
 * Return type for the useAudioPreloader hook
 */
export interface UseAudioPreloaderReturn {
  /**
   * Preload the next song, excluding the given song IDs
   * @param excludeIds - Array of song IDs to exclude from selection
   * @returns Promise that resolves when preloading is complete or fails
   */
  preloadNext: (excludeIds: string[]) => Promise<void>

  /**
   * Get the currently preloaded song and audio element
   * @returns The preloaded audio data or null if nothing is preloaded
   */
  getPreloaded: () => PreloadedAudio | null

  /**
   * Consume the preloaded song (returns and clears it)
   * Use this when transitioning to the preloaded song
   * @returns The preloaded audio data or null if nothing is preloaded
   */
  consumePreloaded: () => PreloadedAudio | null

  /**
   * Clear the preloaded audio and release memory
   */
  clearPreloaded: () => void

  /**
   * Whether a preload operation is currently in progress
   */
  isPrefetching: boolean
}

/**
 * useAudioPreloader - Hook for intelligently preloading the next song
 *
 * This hook provides intelligent audio preloading to eliminate loading times
 * between songs. It fetches a random song from the API and preloads its audio
 * while the current song is playing.
 *
 * Features:
 * - In-memory cache for preloaded audio (not Service Worker)
 * - Memory management (releases old preloaded audio)
 * - Prevents duplicate preload operations
 * - Supports filter parameters for playlists and library filters
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { preloadNext, consumePreloaded, clearPreloaded } = useAudioPreloader();
 *
 *   // Preload during reveal state
 *   useEffect(() => {
 *     if (gameState.status === 'reveal') {
 *       preloadNext(playedSongIds);
 *     }
 *   }, [gameState.status]);
 *
 *   // Use preloaded song when loading next
 *   const handleNextSong = () => {
 *     const preloaded = consumePreloaded();
 *     if (preloaded) {
 *       loadSong(preloaded.song);
 *       // preloaded.audio is already loaded and ready to play
 *     } else {
 *       // Fallback to normal loading
 *       fetchRandomSong();
 *     }
 *   };
 * }
 * ```
 */
export function useAudioPreloader(
  options: UseAudioPreloaderOptions = {}
): UseAudioPreloaderReturn {
  const { filterQueryString = '', enabled = true } = options

  // Store the preloaded audio data
  const preloadedRef = useRef<PreloadedAudio | null>(null)

  // Track if we're currently prefetching to prevent duplicate operations
  const isPrefetchingRef = useRef(false)

  /**
   * Clear the preloaded audio and release memory
   */
  const clearPreloaded = useCallback(() => {
    if (preloadedRef.current) {
      // Stop and release the audio element
      const { audio } = preloadedRef.current
      audio.pause()
      audio.src = ''
      audio.load() // Reset the audio element
      preloadedRef.current = null
    }
  }, [])

  /**
   * Preload the next song, excluding the given song IDs
   */
  const preloadNext = useCallback(
    async (excludeIds: string[]): Promise<void> => {
      // Don't preload if disabled or already prefetching
      if (!enabled || isPrefetchingRef.current) {
        return
      }

      isPrefetchingRef.current = true

      try {
        // Build URL with exclude and filter params
        const params = new URLSearchParams()
        if (excludeIds.length > 0) {
          params.set('exclude', excludeIds.join(','))
        }
        if (filterQueryString) {
          // Append filter params
          const filterParams = new URLSearchParams(filterQueryString)
          filterParams.forEach((value, key) => params.set(key, value))
        }
        const url = `/api/songs/random?${params.toString()}`

        // Fetch a random song
        const response = await fetch(url)

        if (!response.ok) {
          // No more songs available or error
          return
        }

        const data = (await response.json()) as { song: Song }
        if (!data.song) {
          return
        }

        // Clear any existing preloaded audio before loading new one
        clearPreloaded()

        // Create and preload the audio element
        const audio = new Audio(`/api/audio/${data.song.id}`)
        audio.preload = 'auto'

        // Store the preloaded data
        preloadedRef.current = {
          song: data.song,
          audio,
        }

        // Start loading the audio by triggering load
        audio.load()
      } catch {
        // Silently fail - normal loading will occur when needed
      } finally {
        isPrefetchingRef.current = false
      }
    },
    [enabled, filterQueryString, clearPreloaded]
  )

  /**
   * Get the currently preloaded song and audio element
   */
  const getPreloaded = useCallback((): PreloadedAudio | null => {
    return preloadedRef.current
  }, [])

  /**
   * Consume the preloaded song (returns and clears it)
   */
  const consumePreloaded = useCallback((): PreloadedAudio | null => {
    const preloaded = preloadedRef.current
    if (preloaded) {
      // Clear the ref but don't release the audio (consumer will use it)
      preloadedRef.current = null
    }
    return preloaded
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreloaded()
    }
  }, [clearPreloaded])

  // Memoize the return object to prevent infinite re-render loops
  // when this hook is used as a dependency in other hooks/effects
  return useMemo(
    () => ({
      preloadNext,
      getPreloaded,
      consumePreloaded,
      clearPreloaded,
      isPrefetching: isPrefetchingRef.current,
    }),
    [preloadNext, getPreloaded, consumePreloaded, clearPreloaded]
  )
}
