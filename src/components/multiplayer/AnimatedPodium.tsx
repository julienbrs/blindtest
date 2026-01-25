'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import type { Player } from '@/lib/types'

interface ConfettiParticle {
  id: number
  color: string
  left: string
  duration: number
  delay: number
  xOffset: number
  rotation: number
  size: number
}

/**
 * Generate confetti particles for the podium celebration
 */
function generateConfettiParticles(): ConfettiParticle[] {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#f472b6', '#a855f7']
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 0.5,
    xOffset: (Math.random() - 0.5) * 200,
    rotation: Math.random() * 720,
    size: 6 + Math.random() * 6,
  }))
}

type PodiumStage = 'hidden' | 'third' | 'second' | 'first' | 'complete'

interface AnimatedPodiumProps {
  players: Player[]
  myPlayerId?: string | null
}

/**
 * AnimatedPodium - Displays an animated podium with staged reveal
 *
 * Animation sequence:
 * 1. Third place rises (500ms delay)
 * 2. Second place rises (1200ms delay)
 * 3. First place rises (1900ms delay)
 * 4. Complete state with all players visible (2600ms delay)
 *
 * Features:
 * - Progressive reveal: 3rd -> 2nd -> 1st place
 * - Confetti celebration in background
 * - Medal emojis on podium positions
 * - Player avatars displayed on podium
 * - Respects prefers-reduced-motion preference
 */
export function AnimatedPodium({ players, myPlayerId }: AnimatedPodiumProps) {
  const shouldReduceMotion = useReducedMotion()
  // Initialize state based on reduced motion preference - skip animation if reduced motion preferred
  const [stage, setStage] = useState<PodiumStage>(() =>
    shouldReduceMotion ? 'complete' : 'hidden'
  )
  const [confettiParticles] = useState<ConfettiParticle[]>(() =>
    !shouldReduceMotion ? generateConfettiParticles() : []
  )

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  const top3 = sortedPlayers.slice(0, 3)
  const others = sortedPlayers.slice(3)

  // Staged animation timing - only runs if reduced motion is not preferred
  useEffect(() => {
    if (shouldReduceMotion) {
      return
    }

    const timers = [
      setTimeout(() => setStage('third'), 500),
      setTimeout(() => setStage('second'), 1200),
      setTimeout(() => setStage('first'), 1900),
      setTimeout(() => setStage('complete'), 2600),
    ]

    return () => timers.forEach(clearTimeout)
  }, [shouldReduceMotion])

  const medals = ['🥇', '🥈', '🥉']
  // Display order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [1, 0, 2] as const
  const podiumHeights = ['h-32', 'h-24', 'h-20'] // Heights for 1st, 2nd, 3rd

  /**
   * Check if a position should be visible based on current stage
   */
  const isPositionVisible = (position: number): boolean => {
    switch (stage) {
      case 'hidden':
        return false
      case 'third':
        return position === 2 // Only 3rd place visible
      case 'second':
        return position === 2 || position === 1 // 3rd and 2nd place visible
      case 'first':
      case 'complete':
        return true // All positions visible
      default:
        return false
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Confetti Background */}
      <AnimatePresence>
        {stage !== 'hidden' && !shouldReduceMotion && (
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            {confettiParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-sm"
                style={{
                  backgroundColor: particle.color,
                  left: particle.left,
                  width: particle.size,
                  height: particle.size * 0.6,
                }}
                initial={{ y: -20, opacity: 1 }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 50 : 900,
                  x: particle.xOffset,
                  rotate: particle.rotation,
                  opacity: [1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((position) => {
          const player = top3[position]
          if (!player) return null

          const isVisible = isPositionVisible(position)
          const isCurrentPlayer = player.id === myPlayerId

          return (
            <motion.div
              key={player.id}
              className="flex flex-col items-center"
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 15 }}
            >
              {/* Medal */}
              <motion.span
                className="mb-2 text-4xl"
                initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
                animate={isVisible ? { scale: 1 } : { scale: 0 }}
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 10,
                }}
              >
                {medals[position]}
              </motion.span>

              {/* Player Avatar */}
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0.8 }}
                animate={isVisible ? { scale: 1 } : { scale: 0.8 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.1, duration: 0.3 }}
              >
                <PlayerAvatar
                  avatar={player.avatar}
                  nickname={player.nickname}
                  size="lg"
                  className={
                    isCurrentPlayer
                      ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-900/50'
                      : ''
                  }
                />
              </motion.div>

              {/* Player Name */}
              <motion.div
                className={`mt-2 rounded-full px-3 py-1 text-center ${
                  isCurrentPlayer
                    ? 'border-2 border-purple-400 bg-purple-500/50'
                    : 'bg-white/10'
                }`}
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.15 }}
              >
                <span className="font-semibold text-white">{player.nickname}</span>
                {isCurrentPlayer && (
                  <span className="ml-1 text-xs text-purple-300">(vous)</span>
                )}
              </motion.div>

              {/* Score */}
              <motion.div
                className="mt-1 text-purple-300 text-sm"
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
              >
                {player.score} pts
              </motion.div>

              {/* Podium Block */}
              <motion.div
                className={`mt-3 w-24 rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-500 ${podiumHeights[position]}`}
                initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
                animate={isVisible ? { scaleY: 1 } : { scaleY: 0 }}
                style={{ originY: 1 }} // Scale from bottom
                transition={{
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Other Players */}
      <AnimatePresence>
        {others.length > 0 && stage === 'complete' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <h4 className="mb-3 text-sm font-medium text-purple-300">
              Autres participants
            </h4>
            <div className="space-y-2">
              {others.map((player, index) => {
                const isCurrentPlayer = player.id === myPlayerId
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                      isCurrentPlayer ? 'bg-purple-500/30' : 'bg-white/5'
                    }`}
                  >
                    <span className="w-6 text-sm text-purple-400">#{index + 4}</span>
                    <PlayerAvatar
                      avatar={player.avatar}
                      nickname={player.nickname}
                      size="sm"
                    />
                    <span className="flex-1 text-white">
                      {player.nickname}
                      {isCurrentPlayer && (
                        <span className="ml-1 text-xs text-purple-300">(vous)</span>
                      )}
                    </span>
                    <span className="text-purple-300">{player.score} pts</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
