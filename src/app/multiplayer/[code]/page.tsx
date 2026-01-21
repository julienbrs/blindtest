'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Lobby } from '@/components/multiplayer/Lobby'
import { useRoom } from '@/hooks/useRoom'

/**
 * MultiplayerRoomPage - The lobby/game page for a specific multiplayer room
 *
 * Routes: /multiplayer/[code]
 *
 * This page handles:
 * - Room loading and validation
 * - Player reconnection (via stored playerId in localStorage)
 * - Lobby display for waiting state
 * - Game display for playing state (TODO: 13.10+)
 * - End game recap for ended state (TODO: 13.17)
 */
export default function MultiplayerRoomPage() {
  const params = useParams()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const roomCode =
    typeof params.code === 'string' ? params.code.toUpperCase() : ''

  const {
    room,
    players,
    myPlayer,
    isHost,
    isLoading,
    error,
    isConfigured,
    reconnectToRoom,
    leaveRoom,
    updateSettings,
    startGame,
    kickPlayer,
  } = useRoom({ roomCode })

  const [isReconnecting, setIsReconnecting] = useState(true)
  const [reconnectFailed, setReconnectFailed] = useState(false)

  // Try to reconnect on mount
  useEffect(() => {
    if (!roomCode || !isConfigured) {
      /* eslint-disable react-hooks/set-state-in-effect -- Early exit for missing config is a valid pattern */
      setIsReconnecting(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }

    const tryReconnect = async () => {
      setIsReconnecting(true)
      const success = await reconnectToRoom(roomCode)
      setReconnectFailed(!success)
      setIsReconnecting(false)
    }

    tryReconnect()
  }, [roomCode, isConfigured, reconnectToRoom])

  const handleLeaveRoom = useCallback(async () => {
    await leaveRoom()
    router.push('/multiplayer')
  }, [leaveRoom, router])

  const handleStartGame = useCallback(async () => {
    const success = await startGame()
    if (success) {
      // Game will start - the room status change will be received via realtime
      // Future: redirect to game screen or show game UI
    }
    return success
  }, [startGame])

  const handleBack = useCallback(() => {
    router.push('/multiplayer')
  }, [router])

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  // Loading state
  if (isReconnecting || isLoading) {
    return <LoadingScreen message="Connexion à la room..." />
  }

  // Supabase not configured
  if (!isConfigured) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
        >
          <Card variant="elevated" className="p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-xl font-bold text-white">
              Supabase non configuré
            </h2>
            <p className="mb-6 text-purple-200">
              Le mode multijoueur nécessite une configuration Supabase.
            </p>
            <Button variant="secondary" onClick={handleBack} fullWidth>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Card>
        </motion.div>
      </main>
    )
  }

  // Room not found or player not in room (needs to join)
  if (reconnectFailed || (!room && !isLoading)) {
    return (
      <main className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
        >
          <Card variant="elevated" className="p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-xl font-bold text-white">Accès refusé</h2>
            <p className="mb-6 text-purple-200">
              Vous n&apos;êtes pas dans cette room ou elle n&apos;existe pas.
              Veuillez rejoindre la room avec le code.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={handleBack} fullWidth>
                Rejoindre une room
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/play')}
                fullWidth
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </div>
          </Card>
        </motion.div>
      </main>
    )
  }

  // Room exists - check status
  if (room) {
    // Waiting room (lobby)
    if (room.status === 'waiting') {
      return (
        <main className="flex min-h-screen w-full flex-1 flex-col items-center overflow-x-hidden p-4 pt-8 lg:p-8">
          {/* Header */}
          <motion.div
            className="mb-8 text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
          >
            <h1 className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
              Lobby
            </h1>
            <p className="mt-2 text-purple-200">En attente des joueurs...</p>
          </motion.div>

          {/* Lobby Component */}
          <Lobby
            room={room}
            players={players}
            myPlayerId={myPlayer?.id ?? null}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onUpdateSettings={updateSettings}
            onKickPlayer={kickPlayer}
            isLoading={isLoading}
            error={error}
          />
        </main>
      )
    }

    // Game in progress
    if (room.status === 'playing') {
      // TODO: Issue 13.10+ - Implement multiplayer game screen
      return (
        <main className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
          >
            <Card variant="glow" className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Partie en cours
              </h2>
              <p className="mb-6 text-purple-200">
                Le mode de jeu multijoueur sera disponible dans une prochaine
                mise à jour.
              </p>
              <Button variant="secondary" onClick={handleLeaveRoom} fullWidth>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Quitter la partie
              </Button>
            </Card>
          </motion.div>
        </main>
      )
    }

    // Game ended
    if (room.status === 'ended') {
      // TODO: Issue 13.17 - Implement multiplayer recap screen
      return (
        <main className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
          >
            <Card variant="elevated" className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Partie terminée
              </h2>
              <p className="mb-6 text-purple-200">
                Le récapitulatif multijoueur sera disponible dans une prochaine
                mise à jour.
              </p>
              <Button variant="secondary" onClick={handleLeaveRoom} fullWidth>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour au menu
              </Button>
            </Card>
          </motion.div>
        </main>
      )
    }
  }

  // Fallback - should not reach here
  return <LoadingScreen message="Chargement..." />
}
