'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Triggers haptic feedback vibration for incorrect answer.
 * Uses a longer vibration (200ms) to indicate a mistake.
 * Fails silently on iOS Safari or unsupported browsers.
 */
function triggerIncorrectVibration(): void {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    // Single longer vibration for incorrect answer
    navigator.vibrate(200)
  }
}

/**
 * Plays an "incorrect answer" sound using Web Audio API.
 * Creates a short, clear negative buzzer sound that's not too punitive.
 * Style: descending "whomp" tone (~0.4 seconds)
 */
function playIncorrectSound(audioContext: AudioContext, volume = 0.5): void {
  const now = audioContext.currentTime

  // Create master gain for overall volume control
  const masterGain = audioContext.createGain()
  masterGain.connect(audioContext.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

  // Main descending tone (sawtooth for a buzzy feel)
  const osc = audioContext.createOscillator()
  const oscGain = audioContext.createGain()

  osc.type = 'sawtooth'
  // Start at ~200Hz and descend to ~80Hz for a "whomp" effect
  osc.frequency.setValueAtTime(200, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
  osc.connect(oscGain)
  oscGain.connect(masterGain)

  // Quick attack, then decay
  oscGain.gain.setValueAtTime(0, now)
  oscGain.gain.linearRampToValueAtTime(0.7, now + 0.02)
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

  osc.start(now)
  osc.stop(now + 0.4)

  // Add a low sub-bass undertone for weight
  const subOsc = audioContext.createOscillator()
  const subGain = audioContext.createGain()

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

  // Add a brief high-frequency click at the start for clarity
  const clickOsc = audioContext.createOscillator()
  const clickGain = audioContext.createGain()

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

interface UseWrongAnswerEffectOptions {
  respectReducedMotion?: boolean
  /** Optional callback to play incorrect sound (when provided, internal sound is disabled) */
  onPlaySound?: () => void
}

/**
 * Hook to trigger visual and audio feedback effects when a wrong answer is given.
 * Includes a shake effect that can be applied to a container and a "whomp" sound.
 */
export function useWrongAnswerEffect(
  options: UseWrongAnswerEffectOptions = {}
) {
  const { respectReducedMotion = true, onPlaySound } = options
  const [isShaking, setIsShaking] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  const triggerShake = useCallback(() => {
    // Trigger haptic feedback for mobile devices
    triggerIncorrectVibration()

    // Play sound - use external callback if provided, otherwise use internal sound
    if (onPlaySound) {
      onPlaySound()
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      // Resume context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      playIncorrectSound(audioContextRef.current)
    }

    // Check for reduced motion preference (affects visuals only, not sound)
    if (
      respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsShaking(true)

    // Reset shake state after animation completes
    timeoutRef.current = setTimeout(() => {
      setIsShaking(false)
    }, 400) // Duration matches the shake animation
  }, [respectReducedMotion, onPlaySound])

  // Cleanup function to cancel any pending timeout
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { isShaking, triggerShake, cleanup }
}
