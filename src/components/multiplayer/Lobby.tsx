'use client'

import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ClipboardIcon,
  CheckIcon,
  PlayIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlayerList } from './PlayerCard'
import type { Room, Player, GameConfig, GuessMode } from '@/lib/types'

interface LobbyProps {
  room: Room
  players: Player[]
  myPlayerId: string | null
  isHost: boolean
  onStartGame: () => Promise<boolean>
  onLeaveRoom: () => Promise<void>
  onUpdateSettings: (settings: Partial<GameConfig>) => Promise<boolean>
  onKickPlayer: (playerId: string) => Promise<boolean>
  isLoading?: boolean
  error?: string | null
}

const modes: { value: GuessMode; label: string; description: string }[] = [
  {
    value: 'title',
    label: 'Titre',
    description: 'Deviner le nom de la chanson',
  },
  {
    value: 'artist',
    label: 'Artiste',
    description: "Deviner l'artiste ou le groupe",
  },
  {
    value: 'both',
    label: 'Les deux',
    description: 'Deviner titre ET artiste',
  },
]

/**
 * Lobby - Multiplayer lobby/waiting room component
 *
 * Features:
 * - Displays room code (big, copiable)
 * - Shows list of players with online/offline indicator
 * - Host badge for the room host
 * - Start button (host only, visible if >= 2 players)
 * - Leave button for all players
 * - Game configuration (host only): guess mode, clip duration
 * - Animated player join/leave
 */
export function Lobby({
  room,
  players,
  myPlayerId,
  isHost,
  onStartGame,
  onLeaveRoom,
  onUpdateSettings,
  onKickPlayer,
  isLoading = false,
  error = null,
}: LobbyProps) {
  const shouldReduceMotion = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const canStart = isHost && players.length >= 2

  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
      const textArea = document.createElement('textarea')
      textArea.value = room.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [room.code])

  const handleStartGame = useCallback(async () => {
    if (!canStart || isStarting) return
    setIsStarting(true)
    try {
      await onStartGame()
    } finally {
      setIsStarting(false)
    }
  }, [canStart, isStarting, onStartGame])

  const handleLeaveRoom = useCallback(async () => {
    if (isLeaving) return
    setIsLeaving(true)
    try {
      await onLeaveRoom()
    } finally {
      setIsLeaving(false)
    }
  }, [isLeaving, onLeaveRoom])

  const handleGuessModeChange = useCallback(
    async (mode: GuessMode) => {
      await onUpdateSettings({ guessMode: mode })
    },
    [onUpdateSettings]
  )

  const handleClipDurationChange = useCallback(
    async (duration: number) => {
      await onUpdateSettings({ clipDuration: duration })
    },
    [onUpdateSettings]
  )

  const handleTimerDurationChange = useCallback(
    async (duration: number) => {
      await onUpdateSettings({ timerDuration: duration })
    },
    [onUpdateSettings]
  )

  const handleKickPlayer = useCallback(
    async (playerId: string) => {
      await onKickPlayer(playerId)
    },
    [onKickPlayer]
  )

  return (
    <motion.div
      className="flex w-full max-w-md flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Room Code Section */}
      <motion.div variants={fadeUpVariants} transition={{ duration: 0.4 }}>
        <Card variant="glow" className="p-6 text-center">
          <div className="mb-2 text-sm font-medium text-purple-300">
            Code de la room
          </div>
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="font-mono text-4xl font-bold tracking-[0.3em] text-white">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="rounded-lg p-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Copier le code"
            >
              {copied ? (
                <CheckIcon className="h-6 w-6 text-green-400" />
              ) : (
                <ClipboardIcon className="h-6 w-6" />
              )}
            </button>
          </div>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-400"
            >
              Code copié !
            </motion.div>
          )}
          <div className="text-sm text-purple-300">
            Partagez ce code avec vos amis pour qu&apos;ils rejoignent
          </div>
        </Card>
      </motion.div>

      {/* Players Section */}
      <motion.div
        variants={fadeUpVariants}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card variant="elevated" className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Joueurs ({players.length}/10)
            </h2>
            {players.length < 2 && (
              <span className="text-sm text-yellow-400">
                Min. 2 joueurs requis
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <PlayerList
              players={players}
              currentPlayerId={myPlayerId}
              isHost={isHost}
              onKickPlayer={handleKickPlayer}
            />
          </div>

          {players.length === 0 && (
            <div className="py-8 text-center text-purple-300">
              En attente de joueurs...
            </div>
          )}
        </Card>
      </motion.div>

      {/* Settings Section (Host only) */}
      {isHost && (
        <motion.div
          variants={fadeUpVariants}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="default" className="overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex w-full items-center justify-between p-6"
            >
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <Cog6ToothIcon className="h-5 w-5 text-purple-400" />
                Configuration
              </h2>
              <ChevronRightIcon
                className={`h-5 w-5 transform text-purple-300 transition-transform duration-200 ${
                  showSettings ? 'rotate-90' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showSettings ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-6 border-t border-white/10 p-6 pt-4">
                {/* Guess Mode */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-purple-200">
                    Que deviner ?
                  </h3>
                  <div className="space-y-2">
                    {modes.map((mode) => (
                      <label
                        key={mode.value}
                        className={`flex min-h-[44px] cursor-pointer items-center rounded-lg p-3 transition-all ${
                          room.settings.guessMode === mode.value
                            ? 'border-2 border-purple-400 bg-purple-500/30'
                            : 'border-2 border-transparent bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="guessMode"
                          value={mode.value}
                          checked={room.settings.guessMode === mode.value}
                          onChange={() => handleGuessModeChange(mode.value)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {mode.label}
                          </div>
                          <div className="text-xs text-purple-200">
                            {mode.description}
                          </div>
                        </div>
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            room.settings.guessMode === mode.value
                              ? 'border-purple-400 bg-purple-400'
                              : 'border-white/50'
                          }`}
                        >
                          {room.settings.guessMode === mode.value && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clip Duration */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-200">
                    <ClockIcon className="h-4 w-4" />
                    Durée des extraits
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-300">Durée</span>
                      <span className="text-xl font-bold text-white">
                        {room.settings.clipDuration}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={room.settings.clipDuration}
                      onChange={(e) =>
                        handleClipDurationChange(Number(e.target.value))
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-purple-300">
                      <span>5s</span>
                      <span>30s</span>
                      <span>60s</span>
                    </div>
                  </div>
                </div>

                {/* Timer Duration */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-purple-200">
                    Temps pour répondre
                  </h3>
                  <div className="flex gap-2">
                    {[3, 5, 10, 15].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => handleTimerDurationChange(seconds)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          room.settings.timerDuration === seconds
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        }`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          variants={fadeUpVariants}
          className="rounded-lg bg-red-500/20 px-4 py-3 text-center text-sm text-red-300"
        >
          {error}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        variants={fadeUpVariants}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col gap-3"
      >
        {/* Start Game Button (Host only) */}
        {isHost && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleStartGame}
            disabled={!canStart || isStarting || isLoading}
            className="flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Démarrage...
              </span>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Démarrer la partie
              </>
            )}
          </Button>
        )}

        {/* Waiting message for non-host */}
        {!isHost && (
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <div className="mb-1 text-white">En attente du lancement...</div>
            <div className="text-sm text-purple-300">
              L&apos;hôte va bientôt démarrer la partie
            </div>
          </div>
        )}

        {/* Leave Room Button */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleLeaveRoom}
          disabled={isLeaving || isLoading}
          className="flex items-center justify-center gap-2"
        >
          {isLeaving ? (
            'Déconnexion...'
          ) : (
            <>
              <ArrowLeftIcon className="h-4 w-4" />
              Quitter la room
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
