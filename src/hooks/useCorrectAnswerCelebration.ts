'use client'

import { useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'

/**
 * Hook to trigger celebration effects when a correct answer is given.
 * Includes confetti animation and green flash overlay.
 */
export function useCorrectAnswerCelebration(respectReducedMotion = true) {
  const confettiRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const celebrate = useCallback(() => {
    // Check for reduced motion preference
    if (
      respectReducedMotion &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
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
