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
import { PageTransition } from '@/components/ui/PageTransition'
import { Lobby } from '@/components/multiplayer/Lobby'
import { HostControls } from '@/components/multiplayer/HostControls'
import { BuzzIndicator } from '@/components/multiplayer/BuzzIndicator'
import { SyncedAudioPlayer } from '@/components/multiplayer/SyncedAudioPlayer'
import { Leaderboard } from '@/components/multiplayer/Leaderboard'
import { HostMigrationNotification } from '@/components/multiplayer/HostMigrationNotification'
import { ReconnectionNotification } from '@/components/multiplayer/ReconnectionNotification'
import { MultiplayerRecap } from '@/components/multiplayer/MultiplayerRecap'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { SongReveal } from '@/components/game/SongReveal'
import { Timer } from '@/components/game/Timer'
import { useRoom } from '@/hooks/useRoom'
import { usePresence } from '@/hooks/usePresence'
import { useHostMigration } from '@/hooks/useHostMigration'
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame'
import { useAudioPreloader } from '@/hooks/useAudioPreloader'
import { useReactions } from '@/hooks/useReactions'
import { useStreak } from '@/hooks/useStreak'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { useAudioUnlock } from '@/hooks/useAudioUnlock'
import { ReactionPicker } from '@/components/multiplayer/ReactionPicker'
import { ReactionOverlay } from '@/components/multiplayer/ReactionOverlay'
import { StreakCelebration } from '@/components/game/StreakCelebration'
import type { Song } from '@/lib/types'

/**
 * MultiplayerRoomPage - The lobby/game page for a specific multiplayer room
 *
 * Routes: /multiplayer/[code]
 *
 * This page handles:
 * - Room loading and validation
 * - Player reconnection (via stored playerId in localStorage)
 * - Lobby display for waiting state
 * - Game display for playing state
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
    restartGame,
  } = useRoom({ roomCode })

  // Multiplayer game state
  const {
    gameState,
    currentBuzzer,
    currentBuzzes,
    shouldPauseAudio,
    shouldReduceVolume,
    timerActive,
    roundHistory,
    isListeningToRest,
    setIsListeningToRest,
    setCurrentRoundInfo,
    buzz,
    validate,
    nextSong,
    reveal,
    endGame,
  } = useMultiplayerGame({
    room,
    players,
    myPlayerId: myPlayer?.id ?? null,
    isHost,
  })

  // Presence tracking for online/offline status
  const { onlineStatus, isOnline } = usePresence({
    roomId: room?.id ?? null,
    playerId: myPlayer?.id ?? null,
    nickname: myPlayer?.nickname,
  })

  // Host migration when host goes offline
  const { newHostNickname, clearNotification } = useHostMigration({
    room,
    players,
    myPlayerId: myPlayer?.id ?? null,
    isHost,
    onlineStatus,
    isOnline,
  })

  // Audio preloader for intelligent next song preloading (host only)
  const audioPreloader = useAudioPreloader({ enabled: isHost })

  // Live reactions for multiplayer games
  const { reactions, sendReaction } = useReactions({
    roomCode,
    playerId: myPlayer?.id ?? null,
    nickname: myPlayer?.nickname ?? null,
  })

  // Sound effects for streak celebration
  const sfx = useSoundEffects()

  // Streak tracking for consecutive correct answers (player-specific, tracks own correct answers)
  const {
    showCelebration: showStreakCelebration,
    recordCorrect: recordStreakCorrect,
    recordIncorrect: recordStreakIncorrect,
    recordSkip: recordStreakSkip,
  } = useStreak({ threshold: 3 })

  // Audio unlock for iOS Safari and browsers with autoplay restrictions
  const { unlockAudio } = useAudioUnlock()

  const [isReconnecting, setIsReconnecting] = useState(true)
  const [reconnectFailed, setReconnectFailed] = useState(false)
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isBuzzing, setIsBuzzing] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [revealCountdown, setRevealCountdown] = useState(0)

  // Try to reconnect on mount
  useEffect(() => {
    if (!roomCode || !isConfigured) {
      setIsReconnecting(false)
      return
    }

    const tryReconnect = async () => {
      setIsReconnecting(true)
      const success = await reconnectToRoom(roomCode)
      setReconnectFailed(!success)
      setIsReconnecting(false)

      // Show reconnection message if successful and game is in progress
      // (waiting status doesn't need a reconnection message - it's just joining)
      if (success) {
        // Fetch room to check if it's a game in progress
        // The reconnection message is shown when returning to an active game
        setShowReconnectedMessage(true)
      }
    }

    tryReconnect()
  }, [roomCode, isConfigured, reconnectToRoom])

  // Clear reconnection message callback
  const clearReconnectionMessage = useCallback(() => {
    setShowReconnectedMessage(false)
  }, [])

  // Fetch current song when gameState.currentSongId changes
  useEffect(() => {
    if (!gameState.currentSongId) {
      setCurrentSong(null)
      setIsRevealed(false)
      return
    }

    const fetchSong = async () => {
      try {
        const response = await fetch(`/api/songs/${gameState.currentSongId}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentSong(data.song)
          // Update round info for history tracking
          if (data.song) {
            setCurrentRoundInfo(
              data.song.id,
              data.song.title,
              data.song.artist
            )
          }
        } else {
          console.error(
            `Failed to fetch song ${gameState.currentSongId}: ${response.status}`
          )
        }
      } catch (error) {
        console.error(
          `Error fetching song ${gameState.currentSongId}:`,
          error
        )
      }
    }

    fetchSong()
    // Reset revealed state when song changes
    setIsRevealed(false)
  }, [gameState.currentSongId, setCurrentRoundInfo])

  // Reset revealed state when game state changes to playing
  useEffect(() => {
    if (gameState.status === 'playing') {
      setIsRevealed(false)
      setTimerRemaining(0)
    } else if (gameState.status === 'reveal') {
      setIsRevealed(true)
    } else if (gameState.status === 'buzzed') {
      // Start timer when someone buzzes
      setTimerRemaining(room?.settings.timerDuration ?? 5)
    }
  }, [gameState.status, room?.settings.timerDuration])

  // Preload next song during reveal state (host only)
  useEffect(() => {
    if (
      isHost &&
      gameState.status === 'reveal' &&
      !audioPreloader.getPreloaded() &&
      !audioPreloader.isPrefetching
    ) {
      // Build exclude list: already played songs + current song
      const excludeIds = [
        ...gameState.playedSongIds,
        gameState.currentSongId,
      ].filter((id): id is string => Boolean(id))
      void audioPreloader.preloadNext(excludeIds)
    }
  }, [
    isHost,
    gameState.status,
    gameState.playedSongIds,
    gameState.currentSongId,
    audioPreloader,
  ])

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timerRemaining <= 0) return

    const timer = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timerRemaining])

  // Auto-advance countdown after correct answer (host only)
  // Starts 3-second countdown when entering reveal state, unless listening to rest
  useEffect(() => {
    if (gameState.status !== 'reveal' || !isHost || isListeningToRest) {
      setRevealCountdown(0)
      return
    }

    // Start 3-second countdown
    setRevealCountdown(3)

    const timer = setInterval(() => {
      setRevealCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.status, isHost, isListeningToRest])

  const handleLeaveRoom = useCallback(async () => {
    await leaveRoom()
    router.push('/multiplayer')
  }, [leaveRoom, router])

  const handleStartGame = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari) - critical for host's audio playback
    await unlockAudio()
    const success = await startGame()
    if (success) {
      // Auto-load the first song when game starts
      // Fetch a random song and start it immediately
      try {
        const response = await fetch('/api/songs/random')
        if (response.ok) {
          const data = await response.json()
          if (data.song) {
            await nextSong(data.song.id)
          }
        }
      } catch {
        // Ignore fetch errors - host can still click "Next Song" manually
      }
    }
    return success
  }, [startGame, unlockAudio, nextSong])

  const handleBack = useCallback(() => {
    router.push('/multiplayer')
  }, [router])

  const handleBuzz = useCallback(async () => {
    if (isBuzzing) return
    setIsBuzzing(true)
    try {
      // Unlock audio on first interaction (critical for iOS Safari and autoplay restrictions)
      await unlockAudio()
      await buzz()
    } finally {
      setIsBuzzing(false)
    }
  }, [buzz, isBuzzing, unlockAudio])

  const handleValidate = useCallback(
    async (correct: boolean) => {
      // Unlock audio on interaction (iOS Safari)
      await unlockAudio()

      // Track streak for the player who buzzed (if it's me)
      const buzzerIsMe = currentBuzzer?.id === myPlayer?.id
      if (buzzerIsMe) {
        if (correct) {
          recordStreakCorrect()
        } else {
          recordStreakIncorrect()
        }
      }

      const success = await validate(correct)
      if (success) {
        setIsRevealed(true)
      }
      return success
    },
    [validate, currentBuzzer, myPlayer, recordStreakCorrect, recordStreakIncorrect, unlockAudio]
  )

  const handleNextSong = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari)
    await unlockAudio()
    // Reset listening state when moving to next song
    setIsListeningToRest(false)

    // Try to use preloaded song first for instant transition
    const preloaded = audioPreloader.consumePreloaded()
    if (preloaded) {
      await nextSong(preloaded.song.id)
      setIsRevealed(false)
      return
    }

    // Fallback: Fetch a random song and start it
    try {
      const excludeIds = gameState.playedSongIds.join(',')
      const url = excludeIds
        ? `/api/songs/random?exclude=${excludeIds}`
        : '/api/songs/random'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.song) {
          await nextSong(data.song.id)
          setIsRevealed(false)
        }
      }
    } catch {
      // Ignore fetch errors
    }
  }, [nextSong, gameState.playedSongIds, audioPreloader, setIsListeningToRest, unlockAudio])

  // Auto-advance when countdown reaches 0 (host only, during reveal, not listening to rest)
  useEffect(() => {
    if (
      revealCountdown === 0 &&
      gameState.status === 'reveal' &&
      isHost &&
      !isListeningToRest
    ) {
      // Small delay to ensure countdown visually shows 0 before advancing
      const timeout = setTimeout(() => {
        handleNextSong()
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [revealCountdown, gameState.status, isHost, isListeningToRest, handleNextSong])

  // Handler for "listen to rest of song" button
  const handleListenToRest = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari)
    await unlockAudio()
    setIsListeningToRest(true)
    setRevealCountdown(0) // Cancel auto-advance
  }, [setIsListeningToRest, unlockAudio])

  const handleReveal = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari)
    await unlockAudio()
    // Revealing without buzz/answer resets streak (skip)
    recordStreakSkip()
    const success = await reveal()
    if (success) {
      setIsRevealed(true)
    }
    return success
  }, [reveal, recordStreakSkip, unlockAudio])

  const handleEndGame = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari)
    await unlockAudio()
    return await endGame()
  }, [endGame, unlockAudio])

  const handleTimerEnd = useCallback(() => {
    // Timer ended but host can still validate - just show visual indicator
    // Don't auto-reveal anymore, host decides if correct or incorrect
  }, [])

  const handleAudioEnded = useCallback(() => {
    if (isListeningToRest) {
      // Full song ended while listening to rest, auto-advance
      setIsListeningToRest(false)
      handleNextSong()
    } else if (gameState.status === 'playing') {
      // Clip ended during playing state (no one buzzed)
      // Reveal the answer for all clients
      setIsRevealed(true)

      // Host triggers full reveal action (updates game state, history, starts countdown)
      if (isHost) {
        handleReveal()
      }
    }
  }, [isListeningToRest, setIsListeningToRest, handleNextSong, gameState.status, isHost, handleReveal])

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  // Loading state
  if (isReconnecting || isLoading) {
    return (
      <PageTransition>
        <LoadingScreen message="Connexion a la room..." />
      </PageTransition>
    )
  }

  // Supabase not configured
  if (!isConfigured) {
    return (
      <PageTransition>
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
                Supabase non configure
              </h2>
              <p className="mb-6 text-purple-200">
                Le mode multijoueur necessite une configuration Supabase.
              </p>
              <Button variant="secondary" onClick={handleBack} fullWidth>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Card>
          </motion.div>
        </main>
      </PageTransition>
    )
  }

  // Room not found or player not in room (needs to join)
  if (reconnectFailed || (!room && !isLoading)) {
    return (
      <PageTransition>
        <main className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4">
          <motion.div
            className="w-full max-w-md"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
        >
          <Card variant="elevated" className="p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-xl font-bold text-white">Acces refuse</h2>
            <p className="mb-6 text-purple-200">
              Vous n&apos;etes pas dans cette room ou elle n&apos;existe pas.
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
                className="flex items-center justify-center"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </div>
          </Card>
        </motion.div>
        </main>
      </PageTransition>
    )
  }

  // Room exists - check status
  if (room) {
    // Waiting room (lobby)
    if (room.status === 'waiting') {
      return (
        <PageTransition>
          <main className="flex min-h-screen w-full flex-1 flex-col items-center overflow-x-hidden p-4 pt-8 lg:p-8">
            {/* Reconnection notification */}
            <ReconnectionNotification
              show={showReconnectedMessage}
              onDismiss={clearReconnectionMessage}
            />

            {/* Host migration notification */}
            <HostMigrationNotification
              newHostNickname={newHostNickname}
              onDismiss={clearNotification}
            />

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
        </PageTransition>
      )
    }

    // Game in progress
    if (room.status === 'playing') {
      // Check if this player already answered incorrectly this round
      const hasAnsweredIncorrectly = currentBuzzes.some(
        (b) => b.playerId === myPlayer?.id && b.wasIncorrect
      )

      const canBuzz =
        gameState.status === 'playing' &&
        !currentBuzzer &&
        !isBuzzing &&
        !isRevealed &&
        !hasAnsweredIncorrectly

      return (
        <PageTransition>
          {/* Reaction overlay (floating emojis) */}
          <ReactionOverlay reactions={reactions} />

          {/* Streak celebration overlay (3+ consecutive correct answers) */}
          <StreakCelebration
            show={showStreakCelebration}
            isMuted={sfx.isMuted}
            volume={sfx.volume}
          />

          <main className="flex min-h-screen w-full flex-1 flex-col items-center overflow-x-hidden p-4 pt-8 lg:p-8">
            {/* Reconnection notification */}
            <ReconnectionNotification
              show={showReconnectedMessage}
              onDismiss={clearReconnectionMessage}
            />

            {/* Host migration notification */}
            <HostMigrationNotification
              newHostNickname={newHostNickname}
              onDismiss={clearNotification}
            />

            {/* Header */}
            <motion.div
              className="mb-6 text-center"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              <h1 className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                Partie en cours
              </h1>
              <p className="mt-1 text-sm text-purple-200">
                Room: {room.code} | {players.length} joueur
                {players.length > 1 ? 's' : ''}
              </p>
            </motion.div>

            {/* Main game layout with sidebar on larger screens */}
            <div className="flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:justify-center">
              {/* Leaderboard (mobile: collapsible at top, desktop: sidebar) */}
              <motion.div
                className="w-full lg:sticky lg:top-8 lg:w-72 lg:flex-shrink-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Leaderboard
                  players={players}
                  myPlayerId={myPlayer?.id ?? null}
                  compact
                />
              </motion.div>

              {/* Main game content */}
              <div className="flex w-full max-w-lg flex-col items-center gap-6">
                {/* Audio Player */}
                {gameState.currentSongId && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <SyncedAudioPlayer
                      songId={gameState.currentSongId}
                      startedAt={gameState.currentSongStartedAt}
                      isPlaying={
                        (gameState.status === 'playing' ||
                          gameState.status === 'buzzed' ||
                          gameState.status === 'reveal') &&
                        !shouldPauseAudio
                      }
                      maxDuration={room.settings.clipDuration ?? 30}
                      volume={0.5}
                      unlimitedPlayback={isListeningToRest || gameState.status === 'reveal'}
                      onEnded={handleAudioEnded}
                    />
                  </motion.div>
                )}

                {/* Song cover with blur (reveal when appropriate) */}
                {currentSong && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <SongReveal
                      song={currentSong}
                      guessMode={room.settings.guessMode ?? 'both'}
                      isRevealed={isRevealed}
                      isPlaying={
                        gameState.status === 'playing' && !shouldPauseAudio
                      }
                    />
                  </motion.div>
                )}

                {/* Buzz indicator (shows who buzzed) */}
                {currentBuzzer && (
                  <BuzzIndicator
                    buzzes={currentBuzzes}
                    players={players}
                    currentBuzzer={currentBuzzer}
                    myPlayerId={myPlayer?.id ?? null}
                  />
                )}

                {/* Timer (when someone is answering) */}
                {timerActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Timer
                      duration={room.settings.timerDuration ?? 5}
                      remaining={timerRemaining}
                      onTimeout={handleTimerEnd}
                    />
                  </motion.div>
                )}

                {/* Buzzer button (for non-host or host when playing) */}
                {canBuzz && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <BuzzerButton
                      disabled={!canBuzz || isBuzzing}
                      onBuzz={handleBuzz}
                    />
                  </motion.div>
                )}

                {/* Show message when player answered incorrectly */}
                {hasAnsweredIncorrectly && gameState.status === 'playing' && !isRevealed && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-center">
                      <p className="text-red-300 font-medium">
                        Mauvaise réponse ! Attendez la prochaine chanson.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Host Controls */}
                {isHost && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card variant="elevated" className="p-4">
                      <HostControls
                        gameStatus={gameState.status}
                        isRevealed={isRevealed}
                        hasBuzzer={currentBuzzer !== null}
                        onValidate={handleValidate}
                        onNextSong={handleNextSong}
                        onReveal={handleReveal}
                        onEndGame={handleEndGame}
                        isLoading={isLoading}
                        isListeningToRest={isListeningToRest}
                        revealCountdown={revealCountdown}
                        onListenToRest={handleListenToRest}
                        timerExpired={timerRemaining === 0 && timerActive}
                      />
                    </Card>
                  </motion.div>
                )}

                {/* Leave button for non-hosts */}
                {!isHost && (
                  <Button
                    variant="secondary"
                    onClick={handleLeaveRoom}
                    className="mt-4"
                  >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Quitter la partie
                  </Button>
                )}

                {/* Reaction picker bar */}
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ReactionPicker onReact={sendReaction} />
                </motion.div>
              </div>
            </div>
          </main>
        </PageTransition>
      )
    }

    // Game ended - Show multiplayer recap
    if (room.status === 'ended') {
      return (
        <PageTransition>
          <main className="flex min-h-screen w-full flex-1 flex-col items-center overflow-x-hidden">
            <MultiplayerRecap
              room={room}
              players={players}
              myPlayerId={myPlayer?.id ?? null}
              isHost={isHost}
              roundHistory={roundHistory}
              onNewGame={restartGame}
              onLeave={handleLeaveRoom}
            />
          </main>
        </PageTransition>
      )
    }
  }

  // Fallback - should not reach here
  return (
    <PageTransition>
      <LoadingScreen message="Chargement..." />
    </PageTransition>
  )
}
