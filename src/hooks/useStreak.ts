'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Options for the useStreak hook
 */
export interface UseStreakOptions {
  /** Number of consecutive correct answers to trigger streak celebration (default: 3) */
  threshold?: number
  /** Callback when streak is triggered */
  onStreak?: () => void
}

/**
 * Return value for the useStreak hook
 */
export interface UseStreakResult {
  /** Current count of consecutive correct answers */
  count: number
  /** Whether the streak celebration should be shown */
  showCelebration: boolean
  /** Record a correct answer */
  recordCorrect: () => void
  /** Record an incorrect answer (resets streak) */
  recordIncorrect: () => void
  /** Record a skip/reveal without answer (resets streak) */
  recordSkip: () => void
  /** Reset the streak completely */
  reset: () => void
}

/**
 * Hook to track consecutive correct answers and trigger streak celebrations.
 *
 * Features:
 * - Tracks consecutive correct answers
 * - Triggers celebration at threshold (default: 3) and every multiple of threshold
 * - Resets on incorrect answer or skip (reveal without answering)
 * - No visible counter - streak is a surprise!
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const { showCelebration, recordCorrect, recordIncorrect, recordSkip, reset } = useStreak({
 *     threshold: 3,
 *     onStreak: () => console.log('STREAK!')
 *   });
 *
 *   const handleValidate = (correct: boolean) => {
 *     if (correct) recordCorrect();
 *     else recordIncorrect();
 *   };
 *
 *   const handleSkip = () => {
 *     recordSkip();
 *   };
 *
 *   return (
 *     <>
 *       {showCelebration && <StreakCelebration />}
 *       ...
 *     </>
 *   );
 * }
 * ```
 */
export function useStreak(options: UseStreakOptions = {}): UseStreakResult {
  const { threshold = 3, onStreak } = options

  const [count, setCount] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  const recordCorrect = useCallback(() => {
    setCount((prev) => {
      const newCount = prev + 1
      // Trigger celebration at threshold and every multiple of threshold
      if (newCount >= threshold && newCount % threshold === 0) {
        setShowCelebration(true)
        onStreak?.()

        // Clear any existing timeout
        if (celebrationTimeoutRef.current) {
          clearTimeout(celebrationTimeoutRef.current)
        }

        // Hide celebration after 2.5 seconds
        celebrationTimeoutRef.current = setTimeout(() => {
          setShowCelebration(false)
        }, 2500)
      }
      return newCount
    })
  }, [threshold, onStreak])

  const recordIncorrect = useCallback(() => {
    setCount(0)
  }, [])

  const recordSkip = useCallback(() => {
    // Skip = reveal without answering, also resets streak
    setCount(0)
  }, [])

  const reset = useCallback(() => {
    setCount(0)
    setShowCelebration(false)
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current)
      celebrationTimeoutRef.current = null
    }
  }, [])

  return {
    count,
    showCelebration,
    recordCorrect,
    recordIncorrect,
    recordSkip,
    reset,
  }
}
