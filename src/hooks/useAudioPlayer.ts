'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface UseAudioPlayerOptions {
  maxDuration: number
  onEnded?: () => void
  onReady?: (songId: string) => void
}

interface UseAudioPlayerReturn {
  isPlaying: boolean
  currentTime: number
  isLoaded: boolean
  loadSong: (songId: string) => void
  play: () => void
  pause: () => void
  toggle: () => void
  progress: number
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export function useAudioPlayer({
  maxDuration,
  onEnded,
  onReady,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const currentSongIdRef = useRef<string | null>(null)
  const maxDurationRef = useRef(maxDuration)
  const onEndedRef = useRef(onEnded)
  const onReadyRef = useRef(onReady)

  // Keep refs in sync with latest values
  useEffect(() => {
    maxDurationRef.current = maxDuration
  }, [maxDuration])

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  // Create the audio element on mount
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setCurrentTime(time)
      if (time >= maxDurationRef.current) {
        audio.pause()
        setIsPlaying(false)
        onEndedRef.current?.()
      }
    }

    const handleCanPlay = () => {
      setIsLoaded(true)
      if (currentSongIdRef.current) {
        onReadyRef.current?.(currentSongIdRef.current)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEndedRef.current?.()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const loadSong = useCallback((songId: string) => {
    if (audioRef.current) {
      setIsLoaded(false)
      setCurrentTime(0)
      setIsPlaying(false)
      currentSongIdRef.current = songId
      audioRef.current.src = `/api/audio/${songId}`
      audioRef.current.load()
    }
  }, [])

  const play = useCallback(() => {
    audioRef.current?.play().catch(console.error)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        play()
      } else {
        pause()
      }
    }
  }, [play, pause])

  return {
    isPlaying,
    currentTime,
    isLoaded,
    loadSong,
    play,
    pause,
    toggle,
    progress: maxDuration > 0 ? (currentTime / maxDuration) * 100 : 0,
    audioRef,
  }
}
