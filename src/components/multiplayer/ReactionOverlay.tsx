'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ReactionEvent } from '@/lib/reactions'

export interface ReactionOverlayProps {
  /** Active reactions to display */
  reactions: ReactionEvent[]
}

/**
 * ReactionOverlay - Displays floating emoji reactions across the screen
 *
 * Reactions float up from the bottom of the screen in a Twitch-style animation.
 * Each reaction appears at a random horizontal position and floats upward,
 * fading out as it reaches the top.
 *
 * Respects prefers-reduced-motion by disabling animations when enabled.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const { reactions } = useReactions({ roomCode, playerId, nickname });
 *
 *   return (
 *     <>
 *       <ReactionOverlay reactions={reactions} />
 *       <GameContent />
 *     </>
 *   );
 * }
 * ```
 */
export function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
      aria-live="polite"
      aria-label="Live reactions"
    >
      <AnimatePresence>
        {reactions.map((reaction) => {
          // Generate a consistent horizontal position for this reaction
          // Use a simple hash of the ID to get a pseudo-random but consistent position
          const hashCode = reaction.id.split('').reduce((acc, char) => {
            return ((acc << 5) - acc + char.charCodeAt(0)) | 0
          }, 0)
          const xPosition = 10 + (Math.abs(hashCode) % 80) // 10% to 90% of screen width

          return (
            <motion.div
              key={reaction.id}
              initial={{
                opacity: 1,
                y: '100vh',
                x: `${xPosition}%`,
              }}
              animate={{
                opacity: shouldReduceMotion ? 0 : [1, 1, 0],
                y: shouldReduceMotion ? '100vh' : '-10vh',
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 3,
                ease: 'linear',
                opacity: {
                  times: [0, 0.8, 1],
                  duration: shouldReduceMotion ? 0 : 3,
                },
              }}
              className="absolute text-4xl drop-shadow-lg"
              aria-hidden="true"
            >
              {reaction.emoji}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
