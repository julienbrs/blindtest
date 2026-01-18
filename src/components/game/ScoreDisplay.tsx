'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface ScoreDisplayProps {
  score: number
  songsPlayed: number
  currentSongNumber?: number
}

export function ScoreDisplay({
  score,
  songsPlayed,
  currentSongNumber,
}: ScoreDisplayProps) {
  const shouldReduceMotion = useReducedMotion()
  const prevScoreRef = useRef(score)
  const [justScored, setJustScored] = useState(false)

  // If currentSongNumber is provided, use it; otherwise calculate as songsPlayed + 1
  const songNumber = currentSongNumber ?? songsPlayed + 1

  // Detect when score increases to trigger animation
  useEffect(() => {
    if (score > prevScoreRef.current) {
      // Use queueMicrotask to avoid calling setState synchronously in effect
      queueMicrotask(() => {
        setJustScored(true)
      })
      // Clear the animation state after animation completes
      const timer = setTimeout(() => {
        setJustScored(false)
      }, 500)
      return () => clearTimeout(timer)
    }
    prevScoreRef.current = score
  }, [score])

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="relative rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 shadow-lg backdrop-blur-sm sm:px-4 sm:py-2">
        <div className="text-xs text-purple-300 sm:text-sm">Score</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={score}
            className="text-xl font-bold sm:text-2xl"
            initial={
              shouldReduceMotion ? false : { scale: 1.5, color: '#22c55e' }
            }
            animate={shouldReduceMotion ? {} : { scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {score}
          </motion.div>
        </AnimatePresence>
        {/* Visual indicator for score increase */}
        <AnimatePresence>
          {justScored && !shouldReduceMotion && (
            <motion.div
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold sm:-top-2 sm:-right-2 sm:h-6 sm:w-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col text-purple-300">
        <span className="text-sm font-semibold text-white sm:text-base">
          Chanson {songNumber}
        </span>
        <span className="text-xs sm:text-sm">
          {songsPlayed} jouée{songsPlayed !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
