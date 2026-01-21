'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

/**
 * Simple debounce function for performance optimization.
 * Returns a debounced version of the callback that will only execute
 * after the specified delay has passed since the last call.
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

interface AudioPlayerProps {
  songId: string | undefined
  isPlaying: boolean
  maxDuration: number
  onEnded: () => void
  onReady?: (songId: string) => void
  shouldReplay?: boolean
  onReplayComplete?: () => void
  volume?: number
  /** Start position in seconds (for skipping intros or starting at random point) */
  startPosition?: number
}

export function AudioPlayer({
  songId,
  isPlaying,
  maxDuration,
  onEnded,
  onReady,
  shouldReplay,
  onReplayComplete,
  volume = 0.7,
  startPosition = 0,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const prevSongIdRef = useRef<string | undefined>(undefined)

  // Apply volume changes in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Memoize onEnded to avoid unnecessary effect re-runs
  const handleEnded = useCallback(() => {
    onEnded()
  }, [onEnded])

  // Load the song when songId changes
  useEffect(() => {
    if (songId && audioRef.current && songId !== prevSongIdRef.current) {
      audioRef.current.src = `/api/audio/${songId}`
      audioRef.current.load()
      prevSongIdRef.current = songId
    }
  }, [songId])

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !isLoaded) return

    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, isLoaded])

  // Limit playback duration - stop when clip duration is reached
  // With start position offset, we stop at startPosition + maxDuration
  useEffect(() => {
    const clipEnd = startPosition + maxDuration
    if (currentTime >= clipEnd) {
      audioRef.current?.pause()
      handleEnded()
    }
  }, [currentTime, maxDuration, startPosition, handleEnded])

  // Handle replay - reset audio to start position and start playing
  // Uses queueMicrotask to avoid setState-in-effect linting warning
  useEffect(() => {
    if (shouldReplay && audioRef.current && isLoaded) {
      audioRef.current.currentTime = startPosition
      queueMicrotask(() => {
        setCurrentTime(startPosition)
      })
      audioRef.current.play().catch(console.error)
      onReplayComplete?.()
    }
  }, [shouldReplay, isLoaded, onReplayComplete, startPosition])

  // Debounced time update to reduce re-renders on mobile (100ms delay)
  // We still want smooth UI updates, so use a short delay
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
    // Apply start position when audio loads (for skipping intros or random start)
    if (audioRef.current && startPosition > 0) {
      audioRef.current.currentTime = startPosition
      // Update displayed time to match start position
      queueMicrotask(() => {
        setCurrentTime(startPosition)
      })
    }
    // Notify parent that audio is ready to play, passing the song ID
    if (songId) {
      onReady?.(songId)
    }
  }

  const handleLoadStart = () => {
    // Reset state when a new song starts loading
    // Set currentTime to startPosition as that's where playback will begin
    setCurrentTime(startPosition)
    setIsLoaded(false)
  }

  const handleAudioEnded = () => {
    // Called when audio naturally ends (song shorter than maxDuration)
    handleEnded()
  }

  // Calculate progress based on how much of the clip has been played
  // When using a start position offset, currentTime is the absolute audio position
  // Progress = (currentTime - startPosition) / maxDuration
  const clipElapsed = Math.max(0, currentTime - startPosition)
  const progress = (clipElapsed / maxDuration) * 100
  const remainingTime = maxDuration - clipElapsed
  const isNearEnd = remainingTime <= 5 && remainingTime > 0

  // Determine bar gradient based on remaining time
  const barGradient = isNearEnd
    ? 'bg-gradient-to-r from-orange-500 to-red-500'
    : 'bg-gradient-to-r from-pink-500 to-purple-500'

  return (
    <div className="w-full max-w-md">
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
            isPlaying ? 'animate-pulse-subtle' : ''
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Time display - shows elapsed time within the clip, not absolute audio time */}
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-purple-300">{formatTime(clipElapsed)}</span>
        <span
          className={
            isNearEnd ? 'text-red-400 font-semibold' : 'text-purple-300'
          }
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
