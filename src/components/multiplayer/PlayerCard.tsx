'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { StarIcon, XMarkIcon } from '@heroicons/react/24/solid'
import type { Player } from '@/lib/types'

interface PlayerCardProps {
  player: Player
  isCurrentPlayer?: boolean
  canKick?: boolean
  onKick?: () => void
}

/**
 * PlayerCard - Displays a player in the lobby
 *
 * Features:
 * - Shows player nickname
 * - Shows online/offline indicator
 * - Shows "Host" badge for the room host
 * - Highlights the current player (me)
 * - Kick button for hosts to remove other players
 * - Animated entrance/exit
 */
export function PlayerCard({
  player,
  isCurrentPlayer = false,
  canKick = false,
  onKick,
}: PlayerCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const cardVariants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, x: -20, scale: 0.95 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 20, scale: 0.95 },
      }

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-center justify-between rounded-xl p-4 transition-colors ${
        isCurrentPlayer
          ? 'border-2 border-purple-400 bg-purple-500/20'
          : 'border border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Online/Offline indicator */}
        <div className="relative">
          <div
            className={`h-3 w-3 rounded-full ${
              player.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          {player.isOnline && (
            <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-50" />
          )}
        </div>

        {/* Player info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                isCurrentPlayer ? 'text-white' : 'text-purple-100'
              }`}
            >
              {player.nickname}
            </span>
            {isCurrentPlayer && (
              <span className="text-xs text-purple-300">(vous)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Host badge */}
        {player.isHost && (
          <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
            <StarIcon className="h-3 w-3" />
            Host
          </div>
        )}

        {/* Kick button (visible for hosts on non-host players) */}
        {canKick && !player.isHost && onKick && (
          <button
            onClick={onKick}
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            title={`Exclure ${player.nickname}`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

/**
 * PlayerList - Animated list of player cards
 */
interface PlayerListProps {
  players: Player[]
  currentPlayerId: string | null
  isHost: boolean
  onKickPlayer?: (playerId: string) => void
}

export function PlayerList({
  players,
  currentPlayerId,
  isHost,
  onKickPlayer,
}: PlayerListProps) {
  return (
    <AnimatePresence mode="popLayout">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentPlayer={player.id === currentPlayerId}
          canKick={isHost && player.id !== currentPlayerId}
          onKick={onKickPlayer ? () => onKickPlayer(player.id) : undefined}
        />
      ))}
    </AnimatePresence>
  )
}
