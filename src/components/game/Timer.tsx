'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface TimerProps {
  duration: number
  remaining: number
  onTimeout?: () => void
}

export function Timer({ duration, remaining, onTimeout }: TimerProps) {
  const progress = (remaining / duration) * 100
  const prefersReducedMotion = useReducedMotion()
  const audioContextRef = useRef<AudioContext | null>(null)
  const prevRemainingRef = useRef<number>(remaining)
  const hasPlayedTimeoutSoundRef = useRef(false)
  const hasPlayedTickForSecondRef = useRef<number | null>(null)

  // Generate tick sound using Web Audio API - a short, subtle click
  const playTickSound = useCallback((remainingSeconds: number) => {
    try {
      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime

      // Volume intensifies as time runs out (0.2 at 5s -> 0.5 at 1s)
      // Base volume 0.2, increases by ~0.075 per second under 5
      const baseVolume = 0.2
      const intensification =
        remainingSeconds <= 5 ? (5 - remainingSeconds) * 0.075 : 0
      const volume = Math.min(baseVolume + intensification, 0.5)

      // Pitch also increases slightly as time runs out for urgency
      const basePitch = 800
      const pitchBoost =
        remainingSeconds <= 3 ? (3 - remainingSeconds) * 100 : 0
      const pitch = basePitch + pitchBoost

      // Create a short "tick" sound - a brief high-pitched click
      const tickOsc = ctx.createOscillator()
      const tickGain = ctx.createGain()

      tickOsc.type = 'sine'
      tickOsc.frequency.setValueAtTime(pitch, now)

      // Very short envelope for a click sound (~80ms)
      tickGain.gain.setValueAtTime(0, now)
      tickGain.gain.linearRampToValueAtTime(volume, now + 0.005) // Quick attack
      tickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08) // Quick decay

      tickOsc.connect(tickGain)
      tickGain.connect(ctx.destination)

      tickOsc.start(now)
      tickOsc.stop(now + 0.1)

      // Add a subtle "tock" for the second part of tick-tock effect
      // Only when remaining <= 5 for added urgency
      if (remainingSeconds <= 5 && remainingSeconds > 0) {
        const tockOsc = ctx.createOscillator()
        const tockGain = ctx.createGain()

        tockOsc.type = 'sine'
        tockOsc.frequency.setValueAtTime(pitch * 0.75, now + 0.1) // Lower pitch for "tock"

        tockGain.gain.setValueAtTime(0, now + 0.1)
        tockGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.105)
        tockGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)

        tockOsc.connect(tockGain)
        tockGain.connect(ctx.destination)

        tockOsc.start(now + 0.1)
        tockOsc.stop(now + 0.2)
      }
    } catch {
      // Ignore audio errors (e.g., if AudioContext is not supported)
    }
  }, [])

  // Generate timeout sound using Web Audio API - a distinctive "time's up" buzzer/gong
  const playTimeoutSound = useCallback(() => {
    try {
      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime
      const volume = 0.5

      // Create a descending "time's up" buzzer sound
      // Similar to game show timeout buzzer

      // Main tone - descending frequency
      const mainOsc = ctx.createOscillator()
      const mainGain = ctx.createGain()
      mainOsc.type = 'sawtooth'
      mainOsc.frequency.setValueAtTime(400, now)
      mainOsc.frequency.exponentialRampToValueAtTime(150, now + 0.5)
      mainGain.gain.setValueAtTime(volume * 0.6, now)
      mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      mainOsc.connect(mainGain)
      mainGain.connect(ctx.destination)

      // Sub bass for impact
      const subOsc = ctx.createOscillator()
      const subGain = ctx.createGain()
      subOsc.type = 'sine'
      subOsc.frequency.setValueAtTime(100, now)
      subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.4)
      subGain.gain.setValueAtTime(volume * 0.5, now)
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      subOsc.connect(subGain)
      subGain.connect(ctx.destination)

      // Add a brief "buzz" overtone for harshness
      const buzzOsc = ctx.createOscillator()
      const buzzGain = ctx.createGain()
      buzzOsc.type = 'square'
      buzzOsc.frequency.setValueAtTime(200, now)
      buzzOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
      buzzGain.gain.setValueAtTime(volume * 0.3, now)
      buzzGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      buzzOsc.connect(buzzGain)
      buzzGain.connect(ctx.destination)

      // Start and stop oscillators
      mainOsc.start(now)
      mainOsc.stop(now + 0.5)
      subOsc.start(now)
      subOsc.stop(now + 0.4)
      buzzOsc.start(now)
      buzzOsc.stop(now + 0.3)
    } catch {
      // Ignore audio errors (e.g., if AudioContext is not supported)
    }
  }, [])

  // Play tick sound at each second of the countdown
  useEffect(() => {
    // Only play tick when remaining changes to a new value > 0
    // and we haven't already played for this second
    if (
      remaining > 0 &&
      remaining !== hasPlayedTickForSecondRef.current &&
      prevRemainingRef.current !== remaining
    ) {
      hasPlayedTickForSecondRef.current = remaining
      playTickSound(remaining)
    }

    // Reset tick tracking when timer resets
    if (remaining > prevRemainingRef.current) {
      hasPlayedTickForSecondRef.current = null
    }
  }, [remaining, playTickSound])

  // Play timeout sound when timer reaches 0
  useEffect(() => {
    // Reset the flag when timer is reset (remaining goes back up)
    if (remaining > 0 && hasPlayedTimeoutSoundRef.current) {
      hasPlayedTimeoutSoundRef.current = false
    }

    // Play sound only when transitioning from > 0 to 0
    if (
      remaining === 0 &&
      prevRemainingRef.current > 0 &&
      !hasPlayedTimeoutSoundRef.current
    ) {
      hasPlayedTimeoutSoundRef.current = true
      playTimeoutSound()
      onTimeout?.()
    }

    prevRemainingRef.current = remaining
  }, [remaining, onTimeout, playTimeoutSound])

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  // Color transitions based on absolute seconds (per epic 7.7):
  // 5-4s = Yellow (Normal)
  // 3-2s = Orange (Léger pulse)
  // 1s = Red (Pulse rapide + clignotement)
  // Also uses percentage-based fallback for long timers
  const getProgressColor = (remainingSeconds: number): string => {
    if (remainingSeconds <= 1) return '#ef4444' // red-500 - urgent
    if (remainingSeconds <= 3) return '#f97316' // orange-500 - warning
    if (remainingSeconds <= 5) return '#facc15' // yellow-400 - attention
    return '#22c55e' // green-500 - normal
  }

  // Urgency states based on absolute seconds
  // isNormal (remaining > 5): green, no special animation
  const isAttention = remaining <= 5 && remaining > 3 // 5-4s: yellow, normal
  const isWarning = remaining <= 3 && remaining > 1 // 3-2s: orange, léger pulse
  const isCritical = remaining <= 1 // 1s: red, pulse rapide + clignotement

  const progressColor = getProgressColor(remaining)
  const circumference = 2 * Math.PI * 58 // ~364

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cercle de progression */}
      <motion.div
        className="relative h-32 w-32"
        animate={
          prefersReducedMotion
            ? {}
            : isCritical
              ? {
                  scale: [1, 1.1, 1],
                }
              : isWarning
                ? {
                    scale: [1, 1.03, 1],
                  }
                : {}
        }
        transition={
          isCritical
            ? {
                duration: 0.3, // Fast pulse
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : isWarning
              ? {
                  duration: 0.6, // Léger pulse
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
        }
      >
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 128 128"
        >
          {/* Fond */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/20"
          />
          {/* Progression avec animation fluide */}
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset:
                circumference - (circumference * progress) / 100,
              stroke: progressColor,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    strokeDashoffset: {
                      duration: 0.3,
                      ease: 'linear',
                    },
                    stroke: {
                      duration: 0.3,
                      ease: 'easeOut',
                    },
                  }
            }
          />
        </svg>

        {/* Nombre avec animation - urgency effects */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
          animate={
            prefersReducedMotion
              ? { color: progressColor }
              : isCritical
                ? {
                    color: progressColor,
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1], // Clignotement
                  }
                : isWarning
                  ? {
                      color: progressColor,
                      opacity: [1, 0.7, 1],
                    }
                  : isAttention
                    ? {
                        color: progressColor,
                      }
                    : {
                        color: progressColor,
                      }
          }
          transition={
            isCritical
              ? {
                  scale: {
                    duration: 0.25, // Pulse rapide
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  opacity: {
                    duration: 0.25, // Clignotement rapide
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  color: { duration: 0.3 },
                }
              : isWarning
                ? {
                    opacity: {
                      duration: 0.6, // Léger pulse
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    color: { duration: 0.3 },
                  }
                : { duration: 0.3 }
          }
        >
          {remaining}
        </motion.div>

        {/* Glow effect - now also shows during warning with orange glow */}
        {isWarning && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 15px rgba(249, 115, 22, 0.2)',
                '0 0 25px rgba(249, 115, 22, 0.4)',
                '0 0 15px rgba(249, 115, 22, 0.2)',
              ],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        {isCritical && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 25px rgba(239, 68, 68, 0.4)',
                '0 0 50px rgba(239, 68, 68, 0.7)',
                '0 0 25px rgba(239, 68, 68, 0.4)',
              ],
            }}
            transition={{
              duration: 0.3, // Fast pulsing glow
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      <motion.p
        className="text-lg font-medium"
        animate={{
          color: isCritical
            ? '#ef4444' // red-500
            : isWarning
              ? '#f97316' // orange-500
              : isAttention
                ? '#facc15' // yellow-400
                : '#e9d5ff', // purple-200
        }}
        transition={{ duration: 0.3 }}
      >
        {isCritical
          ? 'VITE !'
          : isWarning
            ? 'Dépêchez-vous !'
            : 'Temps pour répondre...'}
      </motion.p>
    </div>
  )
}
