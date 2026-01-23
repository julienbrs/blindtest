'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { createAudioContext } from '@/hooks/useAudioUnlock'

interface StreakCelebrationProps {
  /** Whether to show the celebration */
  show: boolean
  /** Whether sound effects are muted */
  isMuted?: boolean
  /** Volume level (0-1) */
  volume?: number
}

/**
 * Plays a special streak celebration sound using Web Audio API.
 * Creates a triumphant fanfare with ascending notes and harmonics.
 * This sound is different from the normal correct answer sound.
 */
function playStreakSound(ctx: AudioContext, masterVolume: number): void {
  const now = ctx.currentTime
  const volume = 0.7 * masterVolume

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(volume, now)
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0)

  // Fanfare ascending notes (D4, F#4, A4, D5, F#5)
  const frequencies = [293.66, 369.99, 440.0, 587.33, 739.99]
  const noteSpacing = 0.1

  // First: rapid ascending arpeggio
  frequencies.forEach((freq, index) => {
    const startTime = now + index * noteSpacing

    // Main tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, startTime)
    osc.connect(gain)
    gain.connect(masterGain)

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.9, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.5, startTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

    osc.start(startTime)
    osc.stop(startTime + 0.8)

    // Octave harmonic for richness
    const harmonic = ctx.createOscillator()
    const harmonicGain = ctx.createGain()

    harmonic.type = 'sine'
    harmonic.frequency.setValueAtTime(freq * 2, startTime)
    harmonic.connect(harmonicGain)
    harmonicGain.connect(masterGain)

    harmonicGain.gain.setValueAtTime(0, startTime)
    harmonicGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

    harmonic.start(startTime)
    harmonic.stop(startTime + 0.4)
  })

  // Then: triumphant chord (D major with octave)
  const chordTime = now + frequencies.length * noteSpacing + 0.15
  const chordFreqs = [293.66, 369.99, 440.0, 587.33] // D, F#, A, D5

  chordFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, chordTime)
    osc.connect(gain)
    gain.connect(masterGain)

    // Stagger the attack slightly for "bloom" effect
    const attackDelay = i * 0.02
    gain.gain.setValueAtTime(0, chordTime + attackDelay)
    gain.gain.linearRampToValueAtTime(0.6, chordTime + attackDelay + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.01, chordTime + 1.2)

    osc.start(chordTime)
    osc.stop(chordTime + 1.2)
  })

  // Add a "sparkle" effect - high frequency tinkle
  const sparkleTime = now + 0.3
  const sparkleFreqs = [1318.51, 1567.98, 2093.0] // E6, G6, C7

  sparkleFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, sparkleTime + i * 0.05)
    osc.connect(gain)
    gain.connect(masterGain)

    gain.gain.setValueAtTime(0, sparkleTime + i * 0.05)
    gain.gain.linearRampToValueAtTime(0.15, sparkleTime + i * 0.05 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, sparkleTime + i * 0.05 + 0.3)

    osc.start(sparkleTime + i * 0.05)
    osc.stop(sparkleTime + i * 0.05 + 0.3)
  })
}

/**
 * Streak celebration component that shows a special animation
 * when the player achieves a streak of consecutive correct answers.
 *
 * Features:
 * - "STREAK!" text with gradient animation
 * - Golden/rainbow confetti particles (different from normal correct)
 * - Special triumphant sound (different from normal correct)
 * - Respects prefers-reduced-motion (just plays sound, no visuals)
 */
export function StreakCelebration({
  show,
  isMuted = false,
  volume = 0.7,
}: StreakCelebrationProps) {
  const shouldReduceMotion = useReducedMotion()
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasPlayedSoundRef = useRef(false)
  const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Generate deterministic "random" values for particles using a simple hash function
  // This avoids calling Math.random() during render (which is impure)
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => {
        // Simple deterministic pseudo-random based on index
        const hash1 = ((i * 2654435761) % 100) / 100
        const hash2 = ((i * 1597334677) % 30) / 100
        return {
          id: i,
          x: hash1 * 100,
          delay: hash2,
          color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
          rotateDirection: i % 2 === 0 ? 360 : -360,
        }
      }),
    []
  )

  // Play sound when show becomes true
  const playSound = useCallback(() => {
    if (isMuted) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext()
      }

      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume()
        }
        playStreakSound(audioContextRef.current, volume)
      }
    } catch {
      // Audio failed - ignore
    }
  }, [isMuted, volume])

  // Fire confetti with golden/rainbow colors
  const fireConfetti = useCallback(() => {
    if (shouldReduceMotion) return

    // Main burst from center
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      startVelocity: 45,
      gravity: 0.8,
      ticks: 200,
    })

    // Delayed side bursts
    confettiTimeoutRef.current = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
      })
    }, 200)
  }, [shouldReduceMotion])

  // Effect to play sound and confetti when show becomes true
  useEffect(() => {
    if (show && !hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true
      playSound()
      fireConfetti()
    }

    // Reset when hidden
    if (!show) {
      hasPlayedSoundRef.current = false
    }
  }, [show, playSound, fireConfetti])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current)
      }
    }
  }, [])

  // Don't render anything if reduced motion is preferred (sound still plays via effect)
  if (shouldReduceMotion) {
    return null
  }

  return (
    <AnimatePresence>
      {show && (
        <div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          data-testid="streak-celebration"
        >
          {/* Central "STREAK!" text */}
          <motion.div
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              className="text-5xl font-extrabold drop-shadow-2xl sm:text-6xl md:text-7xl"
              style={{
                background:
                  'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6B6B 50%, #FF8C00 75%, #FFD700 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              🔥 STREAK! 🔥
            </motion.span>
          </motion.div>

          {/* Falling confetti particles (as backup to canvas-confetti) */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{
                y: '110vh',
                opacity: [1, 1, 0],
                rotate: p.rotateDirection,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5,
                delay: p.delay,
                ease: 'easeIn',
              }}
              style={{ backgroundColor: p.color }}
              className="absolute h-3 w-3 rounded-full"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
