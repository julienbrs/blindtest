'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface AudioVisualizerProps {
  isPlaying: boolean
}

/**
 * Pre-computed bar configurations for deterministic rendering.
 * Each bar has unique but static animation values for organic feel.
 * Values are manually varied to simulate randomness without calling Math.random().
 */
const BAR_CONFIGS = [
  { id: 0, heights: ['35%', '65%', '40%'], duration: 0.6, delay: 0 },
  { id: 1, heights: ['28%', '72%', '35%'], duration: 0.8, delay: 0.1 },
  { id: 2, heights: ['42%', '58%', '48%'], duration: 0.55, delay: 0.2 },
  { id: 3, heights: ['25%', '80%', '30%'], duration: 0.75, delay: 0.3 },
  { id: 4, heights: ['38%', '70%', '42%'], duration: 0.65, delay: 0.4 },
  { id: 5, heights: ['32%', '75%', '38%'], duration: 0.7, delay: 0.5 },
  { id: 6, heights: ['45%', '55%', '50%'], duration: 0.58, delay: 0.6 },
  { id: 7, heights: ['30%', '68%', '35%'], duration: 0.72, delay: 0.7 },
  { id: 8, heights: ['40%', '60%', '45%'], duration: 0.62, delay: 0.8 },
  { id: 9, heights: ['33%', '78%', '40%'], duration: 0.68, delay: 0.9 },
]

/**
 * AudioVisualizer - Decorative animated bars that react to playback state
 *
 * Features:
 * - 10 vertical bars with animated heights
 * - Decorative only (no real audio frequency analysis)
 * - Synchronized with playback state (pauses when audio pauses)
 * - Low opacity (15%) to avoid distracting from the cover
 * - Respects prefers-reduced-motion preference
 */
export function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-end justify-center gap-1 opacity-15"
      aria-hidden="true"
    >
      {BAR_CONFIGS.map((config) => (
        <motion.div
          key={config.id}
          className="w-2 rounded-full bg-gradient-to-t from-purple-500 to-pink-500"
          animate={
            isPlaying && !shouldReduceMotion
              ? {
                  height: config.heights,
                }
              : { height: '20%' }
          }
          transition={{
            duration: config.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: config.delay,
          }}
        />
      ))}
    </div>
  )
}
