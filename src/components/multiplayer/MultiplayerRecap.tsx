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
import { AnimatedPodium } from '@/components/multiplayer/AnimatedPodium'
import type { Player, Room, RoundHistory } from '@/lib/types'

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
 * MultiplayerRecap - End game screen with animated podium transition
 *
 * Flow:
 * 1. Shows recap stats, game history, and scoreboard immediately
 * 2. After 2.5 seconds, transitions to animated podium view
 * 3. Podium animates progressively: 3rd → 2nd → 1st place
 *
 * Features:
 * - Animated podium for top 3 players (staged reveal)
 * - Complete scoreboard with all players
 * - Game statistics (songs played, duration)
 * - Game history showing each round
 * - "New Game" button (host only) - resets scores to 0
 * - "Leave" button for all players
 * - Respects prefers-reduced-motion preference
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
  const [showPodium, setShowPodium] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  // Get winner for announcement
  const firstPlace = sortedPlayers[0]

  // Calculate stats
  const totalScore = players.reduce((sum, p) => sum + p.score, 0)
  const gameStartTime = room.createdAt
  const gameDuration = Math.floor(
    (Date.now() - new Date(gameStartTime).getTime()) / 1000 / 60
  )

  // Transition to podium view after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPodium(true), 2500)
    return () => clearTimeout(timer)
  }, [])

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
          transition: { staggerChildren: 0.1, delayChildren: 0.3 },
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
      <AnimatePresence mode="wait">
        {!showPodium ? (
          /* Recap View - shown first */
          <motion.div
            key="recap"
            className="w-full max-w-2xl"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
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

            {/* Loading indicator for transition */}
            <motion.div
              className="mb-4 text-center text-sm text-purple-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Podium dans quelques instants...
            </motion.div>
          </motion.div>
        ) : (
          /* Animated Podium View - shown after 2.5 seconds */
          <motion.div
            key="podium"
            className="w-full max-w-2xl"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <motion.h1
              className="mb-8 text-center font-heading text-4xl font-bold text-white md:text-5xl"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              🏆 Podium
            </motion.h1>

            {/* Winner announcement */}
            {firstPlace && (
              <motion.div
                className="mb-8 text-center"
                initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <p className="text-xl text-purple-200">Félicitations à</p>
                <p className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
                  {firstPlace.nickname} !
                </p>
              </motion.div>
            )}

            {/* Animated Podium */}
            <div className="mb-8">
              <AnimatedPodium players={players} myPlayerId={myPlayerId} />
            </div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
