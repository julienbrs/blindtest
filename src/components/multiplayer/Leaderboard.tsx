'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import type { Player } from '@/lib/types'
import { LeaderboardSkeleton } from '@/components/ui/LeaderboardSkeleton'

// Re-export for convenience
export { LeaderboardSkeleton }

/**
 * Medal colors for top 3 positions
 */
const MEDAL_COLORS = {
  1: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-900',
    glow: 'shadow-yellow-500/50',
  },
  2: { bg: 'bg-gray-300', text: 'text-gray-800', glow: 'shadow-gray-300/50' },
  3: {
    bg: 'bg-amber-600',
    text: 'text-amber-950',
    glow: 'shadow-amber-600/50',
  },
} as const

interface LeaderboardEntryProps {
  player: Player
  position: number
  isCurrentPlayer: boolean
  previousPosition?: number
}

/**
 * LeaderboardEntry - A single row in the leaderboard
 *
 * Features:
 * - Position indicator (medal for top 3)
 * - Player nickname
 * - Score with animation on change
 * - Highlight for current player
 */
function LeaderboardEntry({
  player,
  position,
  isCurrentPlayer,
  previousPosition,
}: LeaderboardEntryProps) {
  const shouldReduceMotion = useReducedMotion()
  const medal = position <= 3 ? MEDAL_COLORS[position as 1 | 2 | 3] : null

  // Determine if position changed for animation
  const positionChanged =
    previousPosition !== undefined && previousPosition !== position
  const movedUp = positionChanged && previousPosition > position

  const entryVariants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
      }

  return (
    <motion.div
      layout
      variants={entryVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isCurrentPlayer
          ? 'border-2 border-purple-400 bg-purple-500/30'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      {/* Position indicator */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        {medal ? (
          <motion.div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${medal.bg} ${medal.glow} shadow-lg`}
            initial={shouldReduceMotion ? {} : { scale: 0.8 }}
            animate={shouldReduceMotion ? {} : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {position === 1 ? (
              <TrophyIcon className={`h-4 w-4 ${medal.text}`} />
            ) : (
              <span className={`text-sm font-bold ${medal.text}`}>
                {position}
              </span>
            )}
          </motion.div>
        ) : (
          <span className="text-sm font-medium text-purple-300">
            {position}
          </span>
        )}
      </div>

      {/* Player info */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <PlayerAvatar
            avatar={player.avatar}
            nickname={player.nickname}
            size="sm"
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-purple-900/50 ${
              player.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          {player.isOnline && !shouldReduceMotion && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-50" />
          )}
        </div>

        {/* Nickname */}
        <span
          className={`truncate font-medium ${
            isCurrentPlayer ? 'text-white' : 'text-purple-100'
          }`}
        >
          {player.nickname}
        </span>

        {/* Current player indicator */}
        {isCurrentPlayer && (
          <span className="flex-shrink-0 text-xs text-purple-300">(vous)</span>
        )}

        {/* Position change indicator */}
        {positionChanged && !shouldReduceMotion && (
          <motion.span
            initial={{ opacity: 0, y: movedUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex-shrink-0 text-xs ${
              movedUp ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {movedUp ? '↑' : '↓'}
          </motion.span>
        )}
      </div>

      {/* Score */}
      <motion.div
        key={player.score}
        initial={shouldReduceMotion ? {} : { scale: 1.2, color: '#a855f7' }}
        animate={shouldReduceMotion ? {} : { scale: 1, color: '#e9d5ff' }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 text-right"
      >
        <span className="font-bold text-purple-200">{player.score}</span>
        <span className="ml-1 text-xs text-purple-400">pts</span>
      </motion.div>
    </motion.div>
  )
}

interface LeaderboardProps {
  players: Player[]
  myPlayerId: string | null
  previousPositions?: Map<string, number>
  compact?: boolean
  className?: string
  isLoading?: boolean
}

/**
 * Leaderboard - Real-time player ranking display
 *
 * Features:
 * - Players sorted by score (descending)
 * - Position numbers with medals for top 3 (gold, silver, bronze)
 * - Highlight for current player (me)
 * - Animation when scores change
 * - Visible during gameplay (sidebar or overlay)
 *
 * @param players - Array of players to display
 * @param myPlayerId - Current player's ID for highlighting
 * @param previousPositions - Map of player IDs to their previous positions (for animation)
 * @param compact - Whether to use compact styling
 * @param className - Additional CSS classes
 */
export function Leaderboard({
  players,
  myPlayerId,
  previousPositions,
  compact = false,
  className = '',
  isLoading = false,
}: LeaderboardProps) {
  const shouldReduceMotion = useReducedMotion()

  // Show skeleton while loading with no players
  if (isLoading && players.length === 0) {
    return <LeaderboardSkeleton compact={compact} className={className} />
  }

  // Sort players by score (descending), then by joinedAt (earlier first for ties)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // For tie-breakers, earlier join time wins
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  const containerVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`rounded-xl bg-white/5 backdrop-blur-sm ${
        compact ? 'p-2' : 'p-4'
      } ${className}`}
    >
      {/* Header */}
      <div className={`mb-3 flex items-center gap-2 ${compact ? 'px-1' : ''}`}>
        <TrophyIcon className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold text-white">Classement</h3>
        <span className="text-sm text-purple-300">({players.length})</span>
      </div>

      {/* Player list */}
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => (
            <LeaderboardEntry
              key={player.id}
              player={player}
              position={index + 1}
              isCurrentPlayer={player.id === myPlayerId}
              previousPosition={previousPositions?.get(player.id)}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {players.length === 0 && (
          <div className="py-4 text-center text-sm text-purple-300">
            Aucun joueur
          </div>
        )}
      </div>
    </motion.div>
  )
}
