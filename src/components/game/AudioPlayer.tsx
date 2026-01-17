'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface AudioPlayerProps {
  songId: string | undefined
  isPlaying: boolean
  maxDuration: number
  onEnded: () => void
}

export function AudioPlayer({
  songId,
  isPlaying,
  maxDuration,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const prevSongIdRef = useRef<string | undefined>(undefined)

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

  // Limit playback duration - stop at maxDuration
  useEffect(() => {
    if (currentTime >= maxDuration) {
      audioRef.current?.pause()
      handleEnded()
    }
  }, [currentTime, maxDuration, handleEnded])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleCanPlay = () => {
    setIsLoaded(true)
  }

  const handleLoadStart = () => {
    // Reset state when a new song starts loading
    setCurrentTime(0)
    setIsLoaded(false)
  }

  const handleAudioEnded = () => {
    // Called when audio naturally ends (song shorter than maxDuration)
    handleEnded()
  }

  const progress = (currentTime / maxDuration) * 100

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
      <div className="h-2 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-200"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Time display */}
      <div className="mt-2 flex justify-between text-sm text-purple-300">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(maxDuration)}</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
