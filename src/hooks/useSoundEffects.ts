'use client'

import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { createAudioContext } from './useAudioUnlock'

/**
 * Interface for the sound effects hook return value.
 * Provides methods for playing all game sounds and controlling volume/mute.
 */
export interface SoundEffects {
  /** Play the buzzer sound when player presses the buzz button */
  buzz: () => void
  /** Play celebratory sound for correct answers */
  correct: () => void
  /** Play "whomp" sound for incorrect answers */
  incorrect: () => void
  /** Play "time's up" sound when timer reaches 0 */
  timeout: () => void
  /** Play tick sound for timer countdown (with optional remaining seconds for intensity) */
  tick: (remainingSeconds?: number) => void
  /** Play reveal sound when answer is shown */
  reveal: () => void
  /** Set muted state for all sound effects */
  setMuted: (muted: boolean) => void
  /** Set volume level (0-1) for all sound effects */
  setVolume: (volume: number) => void
  /** Current muted state */
  isMuted: boolean
  /** Current volume level (0-1) */
  volume: number
}

/**
 * Plays a buzzer sound effect using Web Audio API.
 * Generates a game show-style buzz sound with harmonics and envelope.
 */
function playBuzzSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const duration = 0.35

  const frequencies = [200, 400, 600, 800]
  const gains = [0.4, 0.3, 0.2, 0.1]

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(0.7 * masterVolume, now)
  masterGain.gain.linearRampToValueAtTime(0.7 * masterVolume, now + 0.02)
  masterGain.gain.setValueAtTime(0.7 * masterVolume, now + 0.1)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration)

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, now)

    oscGain.gain.setValueAtTime(gains[i], now)
    oscGain.connect(masterGain)
    osc.connect(oscGain)

    osc.start(now)
    osc.stop(now + duration)
  })
}

/**
 * Plays a celebratory "correct answer" sound using Web Audio API.
 * Creates a joyful ascending arpeggio with chime-like tones.
 */
function playCorrectSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const volume = 0.6 * masterVolume

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)

  const frequencies = [523.25, 659.25, 783.99, 1046.5]
  const noteSpacing = 0.12

  frequencies.forEach((freq, index) => {
    const startTime = now + index * noteSpacing

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)
    osc.connect(gain)
    gain.connect(masterGain)

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

    osc.start(startTime)
    osc.stop(startTime + 0.8)

    const harmonic = ctx.createOscillator()
    const harmonicGain = ctx.createGain()

    harmonic.type = 'sine'
    harmonic.frequency.setValueAtTime(freq * 2, startTime)
    harmonic.connect(harmonicGain)
    harmonicGain.connect(masterGain)

    harmonicGain.gain.setValueAtTime(0, startTime)
    harmonicGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02)
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    harmonic.start(startTime)
    harmonic.stop(startTime + 0.5)
  })

  const chordTime = now + frequencies.length * noteSpacing + 0.1
  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, chordTime)
    osc.connect(gain)
    gain.connect(masterGain)

    gain.gain.setValueAtTime(0, chordTime)
    gain.gain.linearRampToValueAtTime(0.4, chordTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.01, chordTime + 0.6)

    osc.start(chordTime)
    osc.stop(chordTime + 0.6)
  })
}

/**
 * Plays an "incorrect answer" sound using Web Audio API.
 * Creates a short, clear negative buzzer sound that's not too punitive.
 */
function playIncorrectSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const volume = 0.5 * masterVolume

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
  osc.connect(oscGain)
  oscGain.connect(masterGain)

  oscGain.gain.setValueAtTime(0, now)
  oscGain.gain.linearRampToValueAtTime(0.7, now + 0.02)
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

  osc.start(now)
  osc.stop(now + 0.4)

  const subOsc = ctx.createOscillator()
  const subGain = ctx.createGain()

  subOsc.type = 'sine'
  subOsc.frequency.setValueAtTime(80, now)
  subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35)
  subOsc.connect(subGain)
  subGain.connect(masterGain)

  subGain.gain.setValueAtTime(0, now)
  subGain.gain.linearRampToValueAtTime(0.5, now + 0.02)
  subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

  subOsc.start(now)
  subOsc.stop(now + 0.4)

  const clickOsc = ctx.createOscillator()
  const clickGain = ctx.createGain()

  clickOsc.type = 'square'
  clickOsc.frequency.setValueAtTime(400, now)
  clickOsc.connect(clickGain)
  clickGain.connect(masterGain)

  clickGain.gain.setValueAtTime(0, now)
  clickGain.gain.linearRampToValueAtTime(0.3, now + 0.005)
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

  clickOsc.start(now)
  clickOsc.stop(now + 0.05)
}

/**
 * Plays a "time's up" sound using Web Audio API.
 * Creates a descending buzzer sound to indicate timer has expired.
 */
function playTimeoutSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const volume = 0.5 * masterVolume

  const mainOsc = ctx.createOscillator()
  const mainGain = ctx.createGain()
  mainOsc.type = 'sawtooth'
  mainOsc.frequency.setValueAtTime(400, now)
  mainOsc.frequency.exponentialRampToValueAtTime(150, now + 0.5)
  mainGain.gain.setValueAtTime(volume * 0.6, now)
  mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
  mainOsc.connect(mainGain)
  mainGain.connect(ctx.destination)

  const subOsc = ctx.createOscillator()
  const subGain = ctx.createGain()
  subOsc.type = 'sine'
  subOsc.frequency.setValueAtTime(100, now)
  subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.4)
  subGain.gain.setValueAtTime(volume * 0.5, now)
  subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
  subOsc.connect(subGain)
  subGain.connect(ctx.destination)

  const buzzOsc = ctx.createOscillator()
  const buzzGain = ctx.createGain()
  buzzOsc.type = 'square'
  buzzOsc.frequency.setValueAtTime(200, now)
  buzzOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
  buzzGain.gain.setValueAtTime(volume * 0.3, now)
  buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
  buzzOsc.connect(buzzGain)
  buzzGain.connect(ctx.destination)

  mainOsc.start(now)
  mainOsc.stop(now + 0.5)
  subOsc.start(now)
  subOsc.stop(now + 0.4)
  buzzOsc.start(now)
  buzzOsc.stop(now + 0.3)
}

/**
 * Plays a tick sound for timer countdown using Web Audio API.
 * Volume and pitch intensify as time runs out.
 */
function playTickSound(
  ctx: AudioContext,
  masterVolume: number,
  remainingSeconds = 5
): void {
  const now = ctx.currentTime

  const baseVolume = 0.2
  const intensification =
    remainingSeconds <= 5 ? (5 - remainingSeconds) * 0.075 : 0
  const volume = Math.min(baseVolume + intensification, 0.5) * masterVolume

  const basePitch = 800
  const pitchBoost = remainingSeconds <= 3 ? (3 - remainingSeconds) * 100 : 0
  const pitch = basePitch + pitchBoost

  const tickOsc = ctx.createOscillator()
  const tickGain = ctx.createGain()

  tickOsc.type = 'sine'
  tickOsc.frequency.setValueAtTime(pitch, now)

  tickGain.gain.setValueAtTime(0, now)
  tickGain.gain.linearRampToValueAtTime(volume, now + 0.005)
  tickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

  tickOsc.connect(tickGain)
  tickGain.connect(ctx.destination)

  tickOsc.start(now)
  tickOsc.stop(now + 0.1)

  if (remainingSeconds <= 5 && remainingSeconds > 0) {
    const tockOsc = ctx.createOscillator()
    const tockGain = ctx.createGain()

    tockOsc.type = 'sine'
    tockOsc.frequency.setValueAtTime(pitch * 0.75, now + 0.1)

    tockGain.gain.setValueAtTime(0, now + 0.1)
    tockGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.105)
    tockGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)

    tockOsc.connect(tockGain)
    tockGain.connect(ctx.destination)

    tockOsc.start(now + 0.1)
    tockOsc.stop(now + 0.2)
  }
}

/**
 * Plays a "reveal" sound using Web Audio API.
 * Creates a magical reveal/unveil sound effect.
 */
function playRevealSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const volume = 0.5 * masterVolume

  // Shimmer effect with ascending frequencies
  const shimmerFreqs = [440, 554.37, 659.25, 880]

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

  shimmerFreqs.forEach((freq, i) => {
    const delay = i * 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + delay)
    osc.connect(gain)
    gain.connect(masterGain)

    gain.gain.setValueAtTime(0, now + delay)
    gain.gain.linearRampToValueAtTime(0.5, now + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.5)

    osc.start(now + delay)
    osc.stop(now + delay + 0.5)

    // Add subtle harmonic
    const harmonic = ctx.createOscillator()
    const harmonicGain = ctx.createGain()

    harmonic.type = 'triangle'
    harmonic.frequency.setValueAtTime(freq * 2, now + delay)
    harmonic.connect(harmonicGain)
    harmonicGain.connect(masterGain)

    harmonicGain.gain.setValueAtTime(0, now + delay)
    harmonicGain.gain.linearRampToValueAtTime(0.2, now + delay + 0.02)
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.3)

    harmonic.start(now + delay)
    harmonic.stop(now + delay + 0.3)
  })
}

/**
 * Centralized hook for managing all game sound effects.
 * Provides methods to play sounds and control volume/mute settings.
 *
 * Features:
 * - All sounds generated via Web Audio API for low latency
 * - Volume control (0-1)
 * - Mute functionality
 * - Autoplay policy handling (resumes suspended AudioContext)
 * - Proper cleanup on unmount
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const sfx = useSoundEffects()
 *
 *   const handleBuzz = () => {
 *     sfx.buzz()
 *     game.actions.buzz()
 *   }
 *
 *   const handleValidate = (correct: boolean) => {
 *     if (correct) sfx.correct()
 *     else sfx.incorrect()
 *     game.actions.validate(correct)
 *   }
 *
 *   return (...)
 * }
 * ```
 */
export function useSoundEffects(): SoundEffects {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.7)

  // Use refs to avoid stale closures in callbacks
  const isMutedRef = useRef(isMuted)
  const volumeRef = useRef(volume)

  // Keep refs in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  // Create or get AudioContext with webkit prefix fallback for iOS Safari
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext()
      }

      // Resume if suspended (browser autoplay policy)
      if (
        audioContextRef.current &&
        audioContextRef.current.state === 'suspended'
      ) {
        audioContextRef.current.resume()
      }

      return audioContextRef.current
    } catch {
      // AudioContext not supported
      return null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  const buzz = useCallback(() => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (ctx) {
      playBuzzSound(ctx, volumeRef.current)
    }
  }, [getAudioContext])

  const correct = useCallback(() => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (ctx) {
      playCorrectSound(ctx, volumeRef.current)
    }
  }, [getAudioContext])

  const incorrect = useCallback(() => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (ctx) {
      playIncorrectSound(ctx, volumeRef.current)
    }
  }, [getAudioContext])

  const timeout = useCallback(() => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (ctx) {
      playTimeoutSound(ctx, volumeRef.current)
    }
  }, [getAudioContext])

  const tick = useCallback(
    (remainingSeconds = 5) => {
      if (isMutedRef.current) return
      const ctx = getAudioContext()
      if (ctx) {
        playTickSound(ctx, volumeRef.current, remainingSeconds)
      }
    },
    [getAudioContext]
  )

  const reveal = useCallback(() => {
    if (isMutedRef.current) return
    const ctx = getAudioContext()
    if (ctx) {
      playRevealSound(ctx, volumeRef.current)
    }
  }, [getAudioContext])

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }, [])

  // Memoize the return object to prevent infinite re-render loops
  // when this hook is used as a dependency in other hooks/effects
  return useMemo(
    () => ({
      buzz,
      correct,
      incorrect,
      timeout,
      tick,
      reveal,
      setMuted,
      setVolume,
      isMuted,
      volume,
    }),
    [buzz, correct, incorrect, timeout, tick, reveal, setMuted, setVolume, isMuted, volume]
  )
}
