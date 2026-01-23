'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ClockIcon, MusicalNoteIcon } from '@heroicons/react/24/solid'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import type { RoundHistory } from '@/lib/types'

interface GameHistoryProps {
  history: RoundHistory[]
}

/**
 * GameHistory - Displays a timeline of all rounds played in the game
 *
 * Features:
 * - Shows song title and artist for each round
 * - Displays who buzzed (with avatar) and if they were correct
 * - Shows buzz time in seconds
 * - Handles rounds with no buzz (timeout or skip)
 * - Scrollable container for long games
 * - Animated entries with stagger effect
 */
export function GameHistory({ history }: GameHistoryProps) {
  const shouldReduceMotion = useReducedMotion()

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <MusicalNoteIcon className="h-5 w-5 text-pink-500" />
          Historique
        </h3>
        <p className="text-center text-sm text-purple-300">
          Aucun round joué
        </p>
      </div>
    )
  }

  const containerVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 },
        },
      }

  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
        <MusicalNoteIcon className="h-5 w-5 text-pink-500" />
        Historique ({history.length} round{history.length > 1 ? 's' : ''})
      </h3>

      <motion.div
        className="max-h-64 space-y-3 overflow-y-auto pr-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {history.map((round) => (
          <motion.div
            key={`${round.songId}-${round.roundNumber}`}
            variants={itemVariants}
            className="flex items-center gap-3 rounded-lg bg-white/5 p-3 text-sm"
          >
            {/* Round number */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/30">
              <span className="text-xs font-bold text-purple-200">
                #{round.roundNumber}
              </span>
            </div>

            {/* Song info */}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-white">
                {round.songTitle}
              </div>
              <div className="truncate text-xs text-purple-300">
                {round.songArtist}
              </div>
            </div>

            {/* Buzz result */}
            {round.buzzWinner ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <PlayerAvatar
                  avatar={round.buzzWinner.avatar}
                  nickname={round.buzzWinner.nickname}
                  size="sm"
                />
                <div className="flex flex-col items-end">
                  <span
                    className={`text-lg ${
                      round.wasCorrect ? 'text-green-400' : 'text-red-400'
                    }`}
                    title={round.wasCorrect ? 'Bonne réponse' : 'Mauvaise réponse'}
                  >
                    {round.wasCorrect ? '✓' : '✗'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-purple-300">
                    <ClockIcon className="h-3 w-3" />
                    {(round.buzzWinner.buzzTime / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                  Pas de buzz
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
