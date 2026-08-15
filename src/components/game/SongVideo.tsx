'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'

const SYNC_INTERVAL_MS = 750
const DRIFT_TOLERANCE_SECONDS = 0.4
const END_MARGIN_SECONDS = 0.05

interface SongVideoProps {
  songId: string
  isPlaying: boolean
  audioElementRef?: RefObject<HTMLAudioElement | null>
  onError: () => void
}

/**
 * Muted video sidecar synchronized with the authoritative audio player.
 * The component is mounted only during the reveal, so video bytes are not
 * requested while players are still guessing.
 */
export function SongVideo({
  songId,
  isPlaying,
  audioElementRef,
  onError,
}: SongVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const synchronize = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 1) return

    const audio = audioElementRef?.current
    if (audio && Number.isFinite(audio.currentTime)) {
      const videoEnd = Number.isFinite(video.duration)
        ? Math.max(0, video.duration - END_MARGIN_SECONDS)
        : audio.currentTime
      const targetTime = Math.min(audio.currentTime, videoEnd)

      if (Math.abs(video.currentTime - targetTime) > DRIFT_TOLERANCE_SECONDS) {
        video.currentTime = targetTime
      }
      video.playbackRate = audio.playbackRate
    }

    const shouldPlay = isPlaying && (!audio || (!audio.paused && !audio.ended))

    if (shouldPlay && video.paused && !video.ended) {
      void video.play().catch(() => {
        // The poster remains visible if a browser blocks muted autoplay.
      })
    } else if (!shouldPlay && !video.paused) {
      video.pause()
    }
  }, [audioElementRef, isPlaying])

  useEffect(() => {
    synchronize()
    if (!isPlaying) return

    const intervalId = window.setInterval(synchronize, SYNC_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [isPlaying, synchronize])

  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video && !video.paused) video.pause()
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={`/api/video/${songId}`}
      poster={`/api/cover/${songId}`}
      muted
      playsInline
      preload="metadata"
      onLoadedMetadata={synchronize}
      onError={onError}
      aria-label="Vidéo associée à la chanson"
      data-testid="song-video"
      className="h-full w-full bg-black object-contain"
    />
  )
}
