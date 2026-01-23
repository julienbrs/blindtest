'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  TrophyIcon,
  MusicalNoteIcon,
  ClockIcon,
  HomeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { GameHistory } from '@/components/multiplayer/GameHistory'
import type { Player, Room, RoundHistory } from '@/lib/types'

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
 * Generate confetti particles for the winner celebration
 */
function generateConfettiParticles(): ConfettiParticle[] {
  const colors = [
    '#f472b6',
    '#a855f7',
    '#fbbf24',
    '#34d399',
    '#60a5fa',
    '#f87171',
  ]
  return Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 0.8,
    xOffset: (Math.random() - 0.5) * 300,
    rotation: Math.random() * 1080,
    size: 8 + Math.random() * 8,
  }))
}

/**
 * Medal configuration for podium positions
 */
const PODIUM_CONFIG = {
  1: {
    bg: 'bg-gradient-to-b from-yellow-400 to-yellow-600',
    text: 'text-yellow-900',
    height: 'h-32',
    delay: 0.5,
    label: '1er',
    emoji: '🥇',
  },
  2: {
    bg: 'bg-gradient-to-b from-gray-300 to-gray-500',
    text: 'text-gray-800',
    height: 'h-24',
    delay: 0.3,
    label: '2ème',
    emoji: '🥈',
  },
  3: {
    bg: 'bg-gradient-to-b from-amber-500 to-amber-700',
    text: 'text-amber-950',
    height: 'h-16',
    delay: 0.1,
    label: '3ème',
    emoji: '🥉',
  },
} as const

interface PodiumPlaceProps {
  player: Player | undefined
  position: 1 | 2 | 3
  isCurrentPlayer: boolean
}

/**
 * PodiumPlace - A single podium position with animation
 */
function PodiumPlace({ player, position, isCurrentPlayer }: PodiumPlaceProps) {
  const shouldReduceMotion = useReducedMotion()
  const config = PODIUM_CONFIG[position]

  if (!player) return null

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: config.delay, duration: 0.5, ease: 'easeOut' }}
    >
      {/* Player avatar */}
      <motion.div
        className="mb-2"
        initial={shouldReduceMotion ? {} : { scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: config.delay + 0.15, duration: 0.3 }}
      >
        <PlayerAvatar
          avatar={player.avatar}
          nickname={player.nickname}
          size="lg"
          className={
            isCurrentPlayer ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-900/50' : ''
          }
        />
      </motion.div>

      {/* Player name */}
      <motion.div
        className={`mb-2 rounded-full px-4 py-2 text-center ${
          isCurrentPlayer
            ? 'border-2 border-purple-400 bg-purple-500/50'
            : 'bg-white/10'
        }`}
        initial={shouldReduceMotion ? {} : { scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: config.delay + 0.2, duration: 0.3 }}
      >
        <span className="text-lg font-bold text-white">{player.nickname}</span>
        {isCurrentPlayer && (
          <span className="ml-1 text-xs text-purple-300">(vous)</span>
        )}
      </motion.div>

      {/* Score */}
      <motion.div
        className="mb-2 text-2xl font-bold text-white"
        initial={shouldReduceMotion ? {} : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: config.delay + 0.3,
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        {player.score} pts
      </motion.div>

      {/* Podium block */}
      <motion.div
        className={`flex w-24 items-end justify-center rounded-t-lg ${config.bg} ${config.height}`}
        initial={shouldReduceMotion ? { height: '100%' } : { height: 0 }}
        animate={{ height: '100%' }}
        transition={{
          delay: config.delay,
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <span className={`mb-2 text-2xl font-bold ${config.text}`}>
          {config.emoji}
        </span>
      </motion.div>
    </motion.div>
  )
}

interface MultiplayerRecapProps {
  room: Room
  players: Player[]
  myPlayerId: string | null
  isHost: boolean
  roundHistory: RoundHistory[]
  onNewGame: () => Promise<boolean>
  onLeave: () => void
}

/**
 * MultiplayerRecap - End game screen with podium and final scores
 *
 * Features:
 * - Animated podium for top 3 players
 * - Confetti celebration for the winner
 * - Complete scoreboard with all players
 * - Game statistics (songs played, duration)
 * - "New Game" button (host only) - resets scores to 0
 * - "Leave" button for all players
 */
export function MultiplayerRecap({
  room,
  players,
  myPlayerId,
  isHost,
  roundHistory,
  onNewGame,
  onLeave,
}: MultiplayerRecapProps) {
  const shouldReduceMotion = useReducedMotion()
  const [showConfetti, setShowConfetti] = useState(!shouldReduceMotion)
  const [confettiParticles] = useState<ConfettiParticle[]>(() =>
    !shouldReduceMotion ? generateConfettiParticles() : []
  )
  const [isLoading, setIsLoading] = useState(false)

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  // Get top 3 players for podium
  const firstPlace = sortedPlayers[0]
  const secondPlace = sortedPlayers[1]
  const thirdPlace = sortedPlayers[2]

  // Calculate stats
  const totalScore = players.reduce((sum, p) => sum + p.score, 0)
  const gameStartTime = room.createdAt
  const gameDuration = Math.floor(
    (Date.now() - new Date(gameStartTime).getTime()) / 1000 / 60
  )

  // Stop confetti after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  const handleNewGame = useCallback(async () => {
    setIsLoading(true)
    try {
      await onNewGame()
    } finally {
      setIsLoading(false)
    }
  }, [onNewGame])

  const containerVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.8 },
        },
      }

  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
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
                  y:
                    typeof window !== 'undefined'
                      ? window.innerHeight + 50
                      : 900,
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

      <div className="w-full max-w-2xl">
        {/* Title */}
        <motion.h1
          className="mb-8 text-center font-heading text-4xl font-bold text-white md:text-5xl"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          🎉 Partie terminée !
        </motion.h1>

        {/* Winner announcement */}
        {firstPlace && (
          <motion.div
            className="mb-8 text-center"
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-xl text-purple-200">Le gagnant est</p>
            <p className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
              {firstPlace.nickname} !
            </p>
          </motion.div>
        )}

        {/* Podium */}
        <motion.div
          className="mb-8 flex items-end justify-center gap-4"
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* 2nd place (left) */}
          <PodiumPlace
            player={secondPlace}
            position={2}
            isCurrentPlayer={secondPlace?.id === myPlayerId}
          />

          {/* 1st place (center) */}
          <PodiumPlace
            player={firstPlace}
            position={1}
            isCurrentPlayer={firstPlace?.id === myPlayerId}
          />

          {/* 3rd place (right) */}
          <PodiumPlace
            player={thirdPlace}
            position={3}
            isCurrentPlayer={thirdPlace?.id === myPlayerId}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mb-6 grid grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
          >
            <TrophyIcon className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
            <div className="text-xs text-purple-300">Points totaux</div>
            <div className="text-2xl font-bold text-white">{totalScore}</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
          >
            <MusicalNoteIcon className="mx-auto mb-1 h-5 w-5 text-pink-500" />
            <div className="text-xs text-purple-300">Joueurs</div>
            <div className="text-2xl font-bold text-white">
              {players.length}
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
          >
            <ClockIcon className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <div className="text-xs text-purple-300">Durée</div>
            <div className="text-2xl font-bold text-white">
              {gameDuration} min
            </div>
          </motion.div>
        </motion.div>

        {/* Game History */}
        {roundHistory.length > 0 && (
          <motion.div
            className="mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <GameHistory history={roundHistory} />
          </motion.div>
        )}

        {/* Full scoreboard */}
        <motion.div
          className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            Classement final
          </h3>

          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isCurrentPlayer = player.id === myPlayerId
              const position = index + 1
              const medal =
                position === 1
                  ? '🥇'
                  : position === 2
                    ? '🥈'
                    : position === 3
                      ? '🥉'
                      : null

              return (
                <motion.div
                  key={player.id}
                  variants={itemVariants}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    isCurrentPlayer
                      ? 'border-2 border-purple-400 bg-purple-500/30'
                      : 'bg-white/5'
                  }`}
                >
                  {/* Position */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-sm font-medium text-purple-300">
                        {position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <PlayerAvatar
                    avatar={player.avatar}
                    nickname={player.nickname}
                    size="sm"
                  />

                  {/* Player name */}
                  <div className="min-w-0 flex-1">
                    <span
                      className={`truncate font-medium ${
                        isCurrentPlayer ? 'text-white' : 'text-purple-100'
                      }`}
                    >
                      {player.nickname}
                    </span>
                    {isCurrentPlayer && (
                      <span className="ml-1 text-xs text-purple-300">
                        (vous)
                      </span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <span className="font-bold text-purple-200">
                      {player.score}
                    </span>
                    <span className="ml-1 text-xs text-purple-400">pts</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {isHost && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNewGame}
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              {isLoading ? 'Préparation...' : 'Nouvelle partie'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onLeave}
            className="flex items-center justify-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            Quitter
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
