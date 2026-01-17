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
    <div className="flex items-center gap-4">
      <div className="relative rounded-xl border border-white/10 bg-white/10 px-4 py-2 shadow-lg backdrop-blur-sm">
        <div className="text-sm text-purple-300">Score</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={score}
            className="text-2xl font-bold"
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
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold"
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
        <span className="font-semibold text-white">Chanson {songNumber}</span>
        <span className="text-sm">
          {songsPlayed} jouée{songsPlayed !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
