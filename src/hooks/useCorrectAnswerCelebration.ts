'use client'

import { useCallback, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'

/**
 * Plays a celebratory "correct answer" sound using Web Audio API.
 * Creates a joyful ascending arpeggio with chime-like tones.
 */
function playCorrectSound(audioContext: AudioContext, volume = 0.6): void {
  const now = audioContext.currentTime

  // Create a master gain for overall volume
  const masterGain = audioContext.createGain()
  masterGain.connect(audioContext.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)

  // Ascending notes for a celebratory arpeggio (C5, E5, G5, C6)
  const frequencies = [523.25, 659.25, 783.99, 1046.5]
  const noteSpacing = 0.12 // Time between each note

  frequencies.forEach((freq, index) => {
    const startTime = now + index * noteSpacing

    // Main tone (sine wave for clean, bell-like sound)
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)
    osc.connect(gain)
    gain.connect(masterGain)

    // Quick attack, sustain, then decay
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.8, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

    osc.start(startTime)
    osc.stop(startTime + 0.8)

    // Add a subtle harmonic overtone for richness
    const harmonic = audioContext.createOscillator()
    const harmonicGain = audioContext.createGain()

    harmonic.type = 'sine'
    harmonic.frequency.setValueAtTime(freq * 2, startTime) // Octave higher
    harmonic.connect(harmonicGain)
    harmonicGain.connect(masterGain)

    harmonicGain.gain.setValueAtTime(0, startTime)
    harmonicGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02)
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    harmonic.start(startTime)
    harmonic.stop(startTime + 0.5)
  })

  // Final chord for emphasis (all notes together)
  const chordTime = now + frequencies.length * noteSpacing + 0.1
  frequencies.forEach((freq) => {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

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
 * Hook to trigger celebration effects when a correct answer is given.
 * Includes confetti animation, green flash overlay, and celebratory sound.
 */
export function useCorrectAnswerCelebration(respectReducedMotion = true) {
  const confettiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  const celebrate = useCallback(() => {
    // Check for reduced motion preference (affects visuals only, not sound)
    const prefersReducedMotion =
      respectReducedMotion &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Play celebration sound (always, regardless of reduced motion)
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    playCorrectSound(audioContextRef.current)

    // Skip visual effects if reduced motion is preferred
    if (prefersReducedMotion) {
      return
    }

    // Clear any existing confetti timeout
    if (confettiRef.current) {
      clearTimeout(confettiRef.current)
    }

    // Fire confetti with festive colors
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#8b5cf6', '#fbbf24', '#22c55e'],
    })

    // Fire a second burst from a different angle for more impact
    confettiRef.current = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ec4899', '#8b5cf6', '#fbbf24'],
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ec4899', '#8b5cf6', '#fbbf24'],
      })
    }, 150)
  }, [respectReducedMotion])

  // Cleanup function to cancel any pending confetti
  const cleanup = useCallback(() => {
    if (confettiRef.current) {
      clearTimeout(confettiRef.current)
      confettiRef.current = null
    }
  }, [])

  return { celebrate, cleanup }
}
