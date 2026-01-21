'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Player, Buzz } from '@/lib/types'

interface BuzzIndicatorProps {
  /** All buzzes for the current round */
  buzzes: Buzz[]
  /** All players in the room */
  players: Player[]
  /** The player who won the buzz (has the right to answer) */
  currentBuzzer: Player | null
  /** The current player's ID */
  myPlayerId: string | null
}

/**
 * BuzzIndicator - Shows who buzzed and who is currently answering
 *
 * Displays:
 * - The buzz winner prominently (the player who gets to answer)
 * - A list of other players who also buzzed (for context)
 * - Visual indication if the current player is the buzz winner
 *
 * @example
 * ```tsx
 * <BuzzIndicator
 *   buzzes={currentBuzzes}
 *   players={players}
 *   currentBuzzer={currentBuzzer}
 *   myPlayerId={myPlayer?.id}
 * />
 * ```
 */
export function BuzzIndicator({
  buzzes,
  players,
  currentBuzzer,
  myPlayerId,
}: BuzzIndicatorProps) {
  // Get nicknames for buzzing players
  const getBuzzerNickname = (playerId: string): string => {
    const player = players.find((p) => p.id === playerId)
    return player?.nickname ?? 'Joueur inconnu'
  }

  // Sort buzzes by time (first buzz = winner)
  const sortedBuzzes = [...buzzes].sort(
    (a, b) => a.buzzedAt.getTime() - b.buzzedAt.getTime()
  )

  // Get non-winning buzzes (other players who also buzzed)
  const otherBuzzes = sortedBuzzes.filter((b) => !b.isWinner)

  const isMyBuzz = currentBuzzer?.id === myPlayerId

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {currentBuzzer && (
          <motion.div
            key="buzzer-indicator"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative"
          >
            {/* Main buzzer card */}
            <motion.div
              className={`relative overflow-hidden rounded-2xl border-2 ${
                isMyBuzz
                  ? 'border-green-400 bg-gradient-to-br from-green-600/90 to-emerald-700/90'
                  : 'border-red-400 bg-gradient-to-br from-red-600/90 to-orange-700/90'
              } p-6 text-center shadow-2xl backdrop-blur-sm`}
              animate={{
                boxShadow: isMyBuzz
                  ? [
                      '0 0 30px rgba(34, 197, 94, 0.5)',
                      '0 0 50px rgba(34, 197, 94, 0.7)',
                      '0 0 30px rgba(34, 197, 94, 0.5)',
                    ]
                  : [
                      '0 0 30px rgba(239, 68, 68, 0.5)',
                      '0 0 50px rgba(239, 68, 68, 0.7)',
                      '0 0 30px rgba(239, 68, 68, 0.5)',
                    ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10" />

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  className="mb-2 text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  {isMyBuzz ? '🎯' : '🔔'}
                </motion.div>

                <p className="mb-1 text-sm font-medium uppercase tracking-wide text-white/80">
                  {isMyBuzz ? "C'est à vous !" : 'Répond actuellement'}
                </p>

                <motion.h2
                  className="text-2xl font-bold text-white sm:text-3xl"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {isMyBuzz ? 'VOUS' : currentBuzzer.nickname}
                </motion.h2>

                {isMyBuzz && (
                  <motion.p
                    className="mt-2 text-sm text-white/80"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Donnez votre réponse à l&apos;hôte !
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Other buzzers (who buzzed after the winner) */}
            {otherBuzzes.length > 0 && (
              <motion.div
                className="mt-4 rounded-lg bg-white/10 p-3 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-purple-300">
                  Ont aussi buzzé
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherBuzzes.map((buzz, index) => {
                    const isMe = buzz.playerId === myPlayerId
                    return (
                      <motion.span
                        key={buzz.id}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                          isMe
                            ? 'bg-purple-500/50 text-white'
                            : 'bg-white/20 text-purple-200'
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                      >
                        <span className="mr-1 text-xs text-purple-400">
                          #{index + 2}
                        </span>
                        {isMe ? 'Vous' : getBuzzerNickname(buzz.playerId)}
                      </motion.span>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No buzzer state - optional, can be used to show "En attente de buzz" */}
      {!currentBuzzer && buzzes.length === 0 && (
        <motion.div
          className="rounded-xl border border-purple-500/30 bg-purple-900/30 p-4 text-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-purple-300">
            Appuyez sur BUZZ! pour répondre en premier
          </p>
        </motion.div>
      )}
    </div>
  )
}
