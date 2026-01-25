'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

/**
 * Simple debounce function for performance optimization.
 */
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T
}

interface SyncedAudioPlayerProps {
  /** The song ID to play */
  songId: string | null
  /** Timestamp when playback should start (server-provided) */
  startedAt: Date | null
  /** Whether audio should be playing */
  isPlaying: boolean
  /** Maximum duration for the clip in seconds */
  maxDuration: number
  /** Called when the clip ends */
  onEnded: () => void
  /** Called when audio is ready to play */
  onReady?: (songId: string) => void
  /** Volume level (0-1) */
  volume?: number
  /** Start position in seconds within the song */
  startPosition?: number
  /** When true, plays full song beyond clip duration (for "listen to rest" feature) */
  unlimitedPlayback?: boolean
}

/**
 * SyncedAudioPlayer - Audio player with multiplayer synchronization
 *
 * This component handles synchronized audio playback for multiplayer games.
 * All clients receive the same `startedAt` timestamp from the server and
 * calculate their local offset to sync playback.
 *
 * ## Synchronization Logic
 *
 * 1. Host sets `currentSongStartedAt` to `now + 1 second` in the database
 * 2. All clients receive this timestamp via real-time subscription
 * 3. Each client calculates: `offset = Date.now() - startedAt`
 * 4. If offset < 0: Wait `|offset|` ms, then play from beginning
 * 5. If offset > 0 and < maxDuration: Seek to `offset` seconds and play
 * 6. If offset >= maxDuration: Song already ended, trigger onEnded
 *
 * ## Tolerance
 *
 * A ~200ms sync tolerance is acceptable for blindtest games since:
 * - Network latency varies between clients
 * - Browser audio APIs have inherent delays
 * - Perfect sync isn't required for the game experience
 *
 * @example
 * ```tsx
 * <SyncedAudioPlayer
 *   songId={room.currentSongId}
 *   startedAt={room.currentSongStartedAt}
 *   isPlaying={gameState.status === 'playing'}
 *   maxDuration={settings.clipDuration}
 *   onEnded={handleClipEnded}
 *   volume={0.7}
 * />
 * ```
 */
export function SyncedAudioPlayer({
  songId,
  startedAt,
  isPlaying,
  maxDuration,
  onEnded,
  onReady,
  volume = 0.7,
  startPosition = 0,
  unlimitedPlayback = false,
}: SyncedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const prevSongIdRef = useRef<string | null>(null)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasEndedRef = useRef(false)
  // Store the audio position when pausing (for resume without re-sync)
  const pausedAtPositionRef = useRef<number | null>(null)

  // Apply volume changes in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Memoize onEnded to avoid unnecessary effect re-runs
  const handleEnded = useCallback(() => {
    if (!hasEndedRef.current) {
      hasEndedRef.current = true
      onEnded()
    }
  }, [onEnded])

  // Load the song when songId changes
  useEffect(() => {
    if (songId && audioRef.current && songId !== prevSongIdRef.current) {
      // Reset state for new song
      hasEndedRef.current = false
      pausedAtPositionRef.current = null // Clear paused position for new song
      /* eslint-disable react-hooks/set-state-in-effect -- Reset state when song changes is required */
      setIsLoaded(false)
      setIsSyncing(false)
      setCurrentTime(startPosition)
      /* eslint-enable react-hooks/set-state-in-effect */

      // Clear any pending sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }

      audioRef.current.src = `/api/audio/${songId}`
      audioRef.current.load()
      prevSongIdRef.current = songId
    }
  }, [songId, startPosition])

  // Reset when song is cleared
  useEffect(() => {
    if (!songId) {
      prevSongIdRef.current = null
      pausedAtPositionRef.current = null // Clear paused position
      /* eslint-disable react-hooks/set-state-in-effect -- Reset state when song is cleared is required */
      setIsLoaded(false)
      setIsSyncing(false)
      setCurrentTime(0)
      /* eslint-enable react-hooks/set-state-in-effect */
      hasEndedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
    }
  }, [songId])

  // Synchronized playback logic
  useEffect(() => {
    if (!audioRef.current || !isLoaded || !songId || !startedAt || !isPlaying) {
      return
    }

    // Already syncing or ended
    if (isSyncing || hasEndedRef.current) {
      return
    }

    /* eslint-disable-next-line react-hooks/set-state-in-effect -- Mark syncing state for audio synchronization */
    setIsSyncing(true)

    const startSync = () => {
      const audio = audioRef.current
      if (!audio) return

      // Check if we're resuming from a pause (have a stored position)
      if (pausedAtPositionRef.current !== null) {
        // Resume from the stored position instead of recalculating
        audio.play().catch(console.error)
        pausedAtPositionRef.current = null
        setIsSyncing(false)
        return
      }

      // Full sync: Calculate offset in milliseconds
      const now = Date.now()
      const startTime = startedAt.getTime()
      const offsetMs = now - startTime

      // Convert to seconds for audio position
      const offsetSec = offsetMs / 1000

      // Calculate where we should be in the clip (accounting for startPosition)
      const clipPositionSec = offsetSec

      if (clipPositionSec < 0) {
        // Song hasn't started yet - wait and then play
        const waitMs = Math.abs(offsetMs)

        syncTimeoutRef.current = setTimeout(() => {
          if (audio && !hasEndedRef.current) {
            audio.currentTime = startPosition
            audio.play().catch(console.error)
          }
          setIsSyncing(false)
        }, waitMs)
      } else if (clipPositionSec >= maxDuration && !unlimitedPlayback) {
        // Clip already ended (but not if unlimited playback is enabled)
        setIsSyncing(false)
        handleEnded()
      } else {
        // Song is in progress - seek to correct position and play
        const seekPosition = startPosition + clipPositionSec
        audio.currentTime = seekPosition
        audio.play().catch(console.error)
        setIsSyncing(false)
      }
    }

    startSync()

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
    }
    // Note: isSyncing is intentionally NOT in dependencies to avoid re-running
    // the effect when syncing state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    songId,
    startedAt,
    isPlaying,
    maxDuration,
    startPosition,
    handleEnded,
  ])

  // Handle pause - store current position for resume
  useEffect(() => {
    if (!audioRef.current || !isLoaded) return

    if (!isPlaying) {
      // Store the current position before pausing (for resume without re-sync)
      pausedAtPositionRef.current = audioRef.current.currentTime
      audioRef.current.pause()
      // Clear sync timeout if we're pausing
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- Reset syncing state on pause */
      setIsSyncing(false)
    }
  }, [isPlaying, isLoaded])

  // Limit playback duration - stop when clip duration is reached
  // Skip this check if unlimitedPlayback is enabled (let song play to natural end)
  useEffect(() => {
    if (unlimitedPlayback) return
    const clipEnd = startPosition + maxDuration
    if (currentTime >= clipEnd && !hasEndedRef.current) {
      audioRef.current?.pause()
      handleEnded()
    }
  }, [currentTime, maxDuration, startPosition, handleEnded, unlimitedPlayback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Debounced time update to reduce re-renders
  const debouncedSetTime = useMemo(
    () => debounce((time: number) => setCurrentTime(time), 100),
    []
  )

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      debouncedSetTime(audioRef.current.currentTime)
    }
  }, [debouncedSetTime])

  const handleCanPlay = () => {
    setIsLoaded(true)
    // Notify parent that audio is ready
    if (songId) {
      onReady?.(songId)
    }
  }

  const handleLoadStart = () => {
    setCurrentTime(startPosition)
    setIsLoaded(false)
    setIsSyncing(false)
    hasEndedRef.current = false
  }

  const handleAudioEnded = () => {
    // Called when audio naturally ends (song shorter than maxDuration)
    handleEnded()
  }

  // Calculate progress based on how much of the clip has been played
  const clipElapsed = Math.max(0, currentTime - startPosition)
  const progress = (clipElapsed / maxDuration) * 100
  const remainingTime = maxDuration - clipElapsed
  const isNearEnd = remainingTime <= 5 && remainingTime > 0

  // Determine bar gradient based on remaining time
  const barGradient = isNearEnd
    ? 'bg-gradient-to-r from-orange-500 to-red-500'
    : 'bg-gradient-to-r from-pink-500 to-purple-500'

  return (
    <div className="w-full max-w-md" data-testid="synced-audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        onEnded={handleAudioEnded}
      />

      {/* Progress bar */}
      <div className="h-3 overflow-hidden rounded-full bg-white/20 shadow-inner">
        <div
          className={`h-full transition-all duration-200 ${barGradient} ${
            isPlaying && isLoaded && !isSyncing ? 'animate-pulse-subtle' : ''
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
          data-testid="audio-progress-bar"
        />
      </div>

      {/* Time display */}
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-purple-300" data-testid="audio-elapsed-time">
          {isSyncing ? 'Sync...' : formatTime(clipElapsed)}
        </span>
        <span
          className={
            isNearEnd ? 'font-semibold text-red-400' : 'text-purple-300'
          }
          data-testid="audio-total-time"
        >
          {formatTime(maxDuration)}
        </span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
