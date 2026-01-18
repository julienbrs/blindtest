'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

/**
 * Type declaration for webkit-prefixed AudioContext used in older Safari versions.
 */
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

/**
 * Creates an AudioContext with webkit prefix fallback for Safari compatibility.
 * @returns AudioContext or null if not supported
 */
export function createAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      return new AudioContextClass()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Interface for the audio unlock hook return value.
 */
export interface AudioUnlockState {
  /** Whether audio has been unlocked for this session */
  isUnlocked: boolean
  /** Function to unlock audio - should be called on first user interaction */
  unlockAudio: () => Promise<void>
  /** Get the AudioContext - must only be called outside of render (in event handlers or effects) */
  getAudioContext: () => AudioContext | null
}

/**
 * Base64-encoded silent MP3 audio (minimal valid MP3 frame).
 * Used to prime HTMLAudioElement for iOS Safari.
 */
const SILENT_MP3 =
  'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAHAAGf9AAAIwAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQbg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

/**
 * Hook to manage audio unlock state for iOS Safari compatibility.
 *
 * iOS Safari has strict autoplay restrictions that block audio playback
 * until a user interaction occurs. This hook:
 *
 * 1. Creates and resumes an AudioContext (with webkit prefix fallback)
 * 2. Plays a silent audio to prime HTMLAudioElement
 * 3. Tracks unlock state to avoid redundant unlock attempts
 *
 * Usage:
 * - Call unlockAudio() on the first user tap/click
 * - Once unlocked, audio playback will work for the session
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const { isUnlocked, unlockAudio } = useAudioUnlock()
 *
 *   const handleStart = async () => {
 *     await unlockAudio()
 *     // Audio is now ready to play
 *     game.start()
 *   }
 *
 *   return <button onClick={handleStart}>Start Game</button>
 * }
 * ```
 */
export function useAudioUnlock(): AudioUnlockState {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)
  const unlockAttemptedRef = useRef(false)

  // Create AudioContext lazily
  const getOrCreateContext = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext()
    }
    return audioContextRef.current
  }, [])

  /**
   * Unlock audio for iOS Safari and other browsers with autoplay restrictions.
   * This should be called in response to a user gesture (click/tap).
   */
  const unlockAudio = useCallback(async (): Promise<void> => {
    // Avoid redundant unlock attempts
    if (unlockAttemptedRef.current && isUnlocked) {
      return
    }

    unlockAttemptedRef.current = true

    try {
      // 1. Resume/create AudioContext
      const ctx = getOrCreateContext()
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        // Play a tiny silent buffer to fully activate AudioContext
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      }

      // 2. Prime HTMLAudioElement by playing silent audio
      // This is critical for iOS Safari to allow subsequent audio.play() calls
      if (!silentAudioRef.current) {
        silentAudioRef.current = new Audio()
      }

      const audio = silentAudioRef.current
      audio.src = SILENT_MP3
      audio.volume = 0.01 // Nearly silent

      // Try to play the silent audio
      try {
        await audio.play()
        // Immediately pause after successful play
        audio.pause()
        audio.currentTime = 0
      } catch {
        // Some browsers may still block - that's okay, we tried
        // The AudioContext should still work
      }

      // 3. Mark as unlocked
      setIsUnlocked(true)
    } catch {
      // Audio unlock failed - log but don't throw
      console.warn('Audio unlock failed')
    }
  }, [isUnlocked, getOrCreateContext])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      if (silentAudioRef.current) {
        silentAudioRef.current.src = ''
        silentAudioRef.current = null
      }
    }
  }, [])

  return {
    isUnlocked,
    unlockAudio,
    getAudioContext: getOrCreateContext,
  }
}
