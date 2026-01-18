'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface BuzzerButtonProps {
  onBuzz: () => void
  disabled?: boolean
}

/**
 * Plays a buzzer sound effect using Web Audio API.
 * Generates a game show-style buzz sound with harmonics and envelope.
 */
function playBuzzSound(
  audioContextRef: React.MutableRefObject<AudioContext | null>
) {
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
  const duration = 0.35 // ~350ms

  // Create oscillators for a rich buzzer sound
  const frequencies = [200, 400, 600, 800]
  const gains = [0.4, 0.3, 0.2, 0.1]

  // Master gain node
  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)
  masterGain.gain.setValueAtTime(0.7, now)

  // Envelope: quick attack, sustain, decay
  masterGain.gain.linearRampToValueAtTime(0.7, now + 0.02) // Attack
  masterGain.gain.setValueAtTime(0.7, now + 0.1) // Sustain
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration) // Decay

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()

    osc.type = 'square' // Square wave for buzzer character
    osc.frequency.setValueAtTime(freq, now)

    oscGain.gain.setValueAtTime(gains[i], now)
    oscGain.connect(masterGain)
    osc.connect(oscGain)

    osc.start(now)
    osc.stop(now + duration)
  })
}

export function BuzzerButton({ onBuzz, disabled = false }: BuzzerButtonProps) {
  const [justBuzzed, setJustBuzzed] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Clean up AudioContext on unmount
  useEffect(() => {
    const audioContext = audioContextRef.current
    return () => {
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled) {
      // Play buzzer sound immediately
      playBuzzSound(audioContextRef)

      // Trigger mobile vibration if supported
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(100)
      }

      // Trigger the buzz animation
      setJustBuzzed(true)
      setTimeout(() => setJustBuzzed(false), 300)

      onBuzz()
    }
  }, [disabled, onBuzz])

  return (
    <div className="relative">
      {/* Shockwave effect */}
      {justBuzzed && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-red-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}

      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        animate={
          justBuzzed
            ? {
                boxShadow: [
                  '0 0 60px rgba(239,68,68,0.5)',
                  '0 0 100px rgba(239,68,68,0.9)',
                  '0 0 60px rgba(239,68,68,0.5)',
                ],
              }
            : { boxShadow: '0 0 60px rgba(239,68,68,0.5)' }
        }
        transition={{ duration: 0.15 }}
        className={`
          relative
          h-40 w-40 md:h-48 md:w-48
          rounded-full
          border-4 border-red-400
          bg-gradient-to-br from-red-500 to-red-700
          text-2xl font-bold text-white
          focus:outline-none focus:ring-4 focus:ring-red-400/50
          disabled:cursor-not-allowed disabled:opacity-50
        `}
      >
        BUZZ!
      </motion.button>
    </div>
  )
}
