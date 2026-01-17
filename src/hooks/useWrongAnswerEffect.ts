'use client'

import { useState, useCallback, useRef } from 'react'

/**
 * Hook to trigger visual feedback effects when a wrong answer is given.
 * Includes a shake effect that can be applied to a container.
 */
export function useWrongAnswerEffect(respectReducedMotion = true) {
  const [isShaking, setIsShaking] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerShake = useCallback(() => {
    // Check for reduced motion preference
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
  }, [respectReducedMotion])

  // Cleanup function to cancel any pending timeout
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { isShaking, triggerShake, cleanup }
}
