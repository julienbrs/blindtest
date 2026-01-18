'use client'

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/solid'
import { useGameState } from '@/hooks/useGameState'
import { useCorrectAnswerCelebration } from '@/hooks/useCorrectAnswerCelebration'
import { useWrongAnswerEffect } from '@/hooks/useWrongAnswerEffect'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAudioUnlock } from '@/hooks/useAudioUnlock'
import { useAudioSupport } from '@/hooks/useAudioSupport'
import { fetchWithRetry, NetworkError } from '@/lib/utils'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { Timer } from '@/components/game/Timer'
import { ScoreDisplay } from '@/components/game/ScoreDisplay'
import { SongReveal } from '@/components/game/SongReveal'
import { GameControls } from '@/components/game/GameControls'
import { GameRecap } from '@/components/game/GameRecap'
import { CorrectAnswerFlash } from '@/components/game/CorrectAnswerFlash'
import { IncorrectAnswerFlash } from '@/components/game/IncorrectAnswerFlash'
import { NetworkErrorToast } from '@/components/game/NetworkErrorToast'
import { BrowserUnsupportedError } from '@/components/game/BrowserUnsupportedError'
import { Button } from '@/components/ui/Button'
import type { GameConfig, GuessMode, Song } from '@/lib/types'

// Animation variants for game state transitions
const fadeSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const fadeScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Transition presets
const quickTransition = { duration: 0.2, ease: 'easeOut' as const }
const smoothTransition = { duration: 0.3, ease: 'easeOut' as const }

function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  // Check browser audio support at load time
  const { isSupported: isAudioSupported, isChecking: isCheckingAudio } =
    useAudioSupport()

  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [allSongsPlayed, setAllSongsPlayed] = useState(false)
  // Track which song ID triggered the audio ready state
  const [audioReadyForSongId, setAudioReadyForSongId] = useState<string | null>(
    null
  )
  const hasInitialized = useRef(false)
  // Track if we're currently loading a song (to prevent duplicate loads)
  const isLoadingSongRef = useRef(false)
  // AbortController for cancelling pending fetch operations
  const loadAbortControllerRef = useRef<AbortController | null>(null)
  // Track if replay was triggered
  const [shouldReplay, setShouldReplay] = useState(false)
  // Track correct answer flash animation
  const [showCorrectFlash, setShowCorrectFlash] = useState(false)
  // Track incorrect answer flash animation
  const [showIncorrectFlash, setShowIncorrectFlash] = useState(false)
  // Music volume (0-1)
  const [musicVolume, setMusicVolume] = useState(0.7)
  // Network error state for retry toast
  const [networkError, setNetworkError] = useState<{
    show: boolean
    message?: string
  }>({ show: false })
  // Store retry callback for when user clicks retry
  const retryCallbackRef = useRef<(() => void) | null>(null)

  // Fullscreen mode
  const {
    isFullscreen,
    toggleFullscreen,
    isSupported: isFullscreenSupported,
  } = useFullscreen()

  // Audio unlock for iOS Safari compatibility
  // Unlocks audio playback on first user interaction
  const { unlockAudio } = useAudioUnlock()

  // Sound effects hook - must be before effects that use it
  const sfx = useSoundEffects()

  // Celebration effects for correct answers - use centralized sfx hook
  const { celebrate, cleanup: cleanupCelebration } =
    useCorrectAnswerCelebration({ onPlaySound: sfx.correct })

  // Wrong answer effects (shake) - use centralized sfx hook
  const {
    isShaking,
    triggerShake,
    cleanup: cleanupShake,
  } = useWrongAnswerEffect({ onPlaySound: sfx.incorrect })

  // Preloading state for the next song
  const [nextSong, setNextSong] = useState<Song | null>(null)
  const preloadedAudioRef = useRef<HTMLAudioElement | null>(null)
  const isPrefetchingRef = useRef(false)

  // Parse config from URL parameters - memoized to prevent unnecessary re-renders
  const config: GameConfig = useMemo(
    () => ({
      guessMode: (searchParams.get('mode') as GuessMode) || 'both',
      clipDuration: Number(searchParams.get('duration')) || 20,
      timerDuration:
        searchParams.get('noTimer') === 'true'
          ? 0
          : Number(searchParams.get('timerDuration')) || 5,
    }),
    [searchParams]
  )

  const game = useGameState(config)

  // Load SFX muted state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sfx_muted')
    if (saved !== null) {
      try {
        const muted = JSON.parse(saved) as boolean
        sfx.setMuted(muted)
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [sfx])

  // Load music volume from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('music_volume')
    if (saved !== null) {
      const vol = parseFloat(saved)
      if (!isNaN(vol) && vol >= 0 && vol <= 1) {
        setMusicVolume(vol)
      }
    }
  }, [])

  // Handle SFX mute toggle with localStorage persistence
  const handleToggleSfxMute = useCallback(() => {
    const newMuted = !sfx.isMuted
    sfx.setMuted(newMuted)
    localStorage.setItem('sfx_muted', JSON.stringify(newMuted))
  }, [sfx])

  // Handle music volume change with localStorage persistence
  const handleMusicVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value)
      setMusicVolume(vol)
      localStorage.setItem('music_volume', vol.toString())
    },
    []
  )

  // Prefetch the next song during REVEAL state
  const prefetchNextSong = useCallback(async (excludeIds: string[]) => {
    if (isPrefetchingRef.current) return
    isPrefetchingRef.current = true

    const exclude = excludeIds.join(',')
    const url = `/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`

    try {
      // Use fetchWithRetry with 2 retries for prefetch (non-critical)
      const res = await fetchWithRetry(url, {}, 2, 10000)

      if (!res.ok) {
        // No more songs available - will be handled when transitioning to next song
        isPrefetchingRef.current = false
        return
      }

      const data = (await res.json()) as { song: Song }
      if (data.song) {
        setNextSong(data.song)
        // Preload the audio
        if (preloadedAudioRef.current) {
          preloadedAudioRef.current.pause()
          preloadedAudioRef.current.src = ''
        }
        const audio = new Audio(`/api/audio/${data.song.id}`)
        audio.preload = 'auto'
        preloadedAudioRef.current = audio
      }
    } catch {
      // Silently fail - will load normally when needed
    } finally {
      isPrefetchingRef.current = false
    }
  }, [])

  // Check if an audio file is accessible via HEAD request
  const checkAudioFileAccessible = useCallback(
    async (songId: string, signal?: AbortSignal): Promise<boolean> => {
      try {
        const res = await fetch(`/api/audio/${songId}`, {
          method: 'HEAD',
          signal,
        })
        return res.ok
      } catch (error) {
        // If aborted, propagate the error so caller can handle it
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        return false
      }
    },
    []
  )

  // Load a random song from the API
  // If the audio file is not accessible, auto-skip and try another song
  // Uses fetchWithRetry for network resilience with timeout and retry
  const loadRandomSong = useCallback(
    async (
      excludeIds: string[],
      preloadedSong: Song | null,
      signal?: AbortSignal
    ) => {
      // Check if aborted before starting
      if (signal?.aborted) {
        return
      }

      // Clear any previous network error
      setNetworkError({ show: false })

      // If we have a preloaded song, verify it's still accessible
      if (preloadedSong) {
        try {
          const isAccessible = await checkAudioFileAccessible(
            preloadedSong.id,
            signal
          )
          // Check abort after async operation
          if (signal?.aborted) return

          if (isAccessible) {
            game.actions.loadSong(preloadedSong)
            setNextSong(null)
            return
          }
        } catch (error) {
          // If aborted, stop processing
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }
        }
        // Preloaded song is not accessible, add to exclude list and load normally
        console.warn(
          `Audio file for preloaded song "${preloadedSong.title}" not accessible, skipping...`
        )
        excludeIds = [...excludeIds, preloadedSong.id]
        setNextSong(null)
      }

      const exclude = excludeIds.join(',')
      const url = `/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`

      try {
        // Use fetchWithRetry with 10s timeout and 3 retries
        const res = await fetchWithRetry(url, { signal }, 3, 10000)

        // Check abort after async operation
        if (signal?.aborted) return

        if (!res.ok) {
          if (res.status === 404) {
            // No more songs available
            setAllSongsPlayed(true)
            game.actions.quit()
          }
          return
        }

        const data = (await res.json()) as { song: Song }

        // Check abort after async operation
        if (signal?.aborted) return

        if (data.song) {
          // Verify the audio file is accessible before loading
          const isAccessible = await checkAudioFileAccessible(
            data.song.id,
            signal
          )

          // Check abort after async operation
          if (signal?.aborted) return

          if (!isAccessible) {
            // Audio file not accessible - add to exclude list and retry
            console.warn(
              `Audio file for song "${data.song.title}" not accessible, skipping...`
            )
            // Recursively call to get another song with updated exclude list
            await loadRandomSong([...excludeIds, data.song.id], null, signal)
            return
          }
          game.actions.loadSong(data.song)
        } else {
          // No song returned
          setAllSongsPlayed(true)
          game.actions.quit()
        }
      } catch (error) {
        // If aborted, stop processing silently
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        // Network error - show toast with retry option
        const isNetworkError = error instanceof NetworkError
        const message = isNetworkError
          ? error.type === 'TIMEOUT'
            ? 'La requête a expiré. Vérifiez votre connexion.'
            : error.type === 'MAX_RETRIES'
              ? 'Impossible de contacter le serveur après plusieurs tentatives.'
              : 'Erreur de connexion au serveur.'
          : 'Une erreur réseau est survenue.'

        // Store retry callback
        retryCallbackRef.current = () => {
          void loadRandomSong(excludeIds, null)
        }

        setNetworkError({ show: true, message })
      }
    },
    [game.actions, checkAudioFileAccessible]
  )

  // Handle network error retry
  const handleNetworkRetry = useCallback(() => {
    setNetworkError({ show: false })
    if (retryCallbackRef.current) {
      retryCallbackRef.current()
    }
  }, [])

  // Handle network error dismiss
  const handleNetworkDismiss = useCallback(() => {
    setNetworkError({ show: false })
  }, [])

  // IDLE → LOADING transition: Start game automatically when page loads
  useEffect(() => {
    if (game.state.status === 'idle' && !hasInitialized.current) {
      hasInitialized.current = true
      game.actions.startGame()
    }
  }, [game.state.status, game.actions])

  // LOADING state handler: Load a random song when in loading state with no current song
  // This handles both initial load (after START_GAME) and subsequent loads (after NEXT_SONG)
  useEffect(() => {
    // Only proceed if we need to load (loading state, no current song)
    if (game.state.status !== 'loading' || game.state.currentSong) {
      // Reset loading flag when not in loading state
      isLoadingSongRef.current = false
      return
    }

    // Prevent duplicate loads - check if we're already loading
    if (isLoadingSongRef.current) {
      return
    }
    isLoadingSongRef.current = true

    // Abort any previous pending load operation
    if (loadAbortControllerRef.current) {
      loadAbortControllerRef.current.abort()
    }

    // Create new AbortController for this load operation
    const abortController = new AbortController()
    loadAbortControllerRef.current = abortController

    // Capture values for the async function
    const playedIds = game.state.playedSongIds
    const preloadedSong = nextSong

    // Reset the audioReady state for the new song
    setAudioReadyForSongId(null)

    // Load a new random song (excluding already played songs), using preloaded if available
    void loadRandomSong(playedIds, preloadedSong, abortController.signal)

    // Cleanup: abort the operation when effect is cleaned up (component unmount or deps change)
    return () => {
      abortController.abort()
      isLoadingSongRef.current = false
    }
  }, [
    game.state.status,
    game.state.currentSong,
    game.state.playedSongIds,
    loadRandomSong,
    nextSong,
  ])

  // Prefetch next song during REVEAL state
  useEffect(() => {
    if (
      game.state.status === 'reveal' &&
      !nextSong &&
      !isPrefetchingRef.current
    ) {
      // Build exclude list: already played songs + current song
      const excludeIds = [
        ...game.state.playedSongIds,
        game.state.currentSong?.id,
      ].filter((id): id is string => Boolean(id))
      void prefetchNextSong(excludeIds)
    }
  }, [
    game.state.status,
    game.state.playedSongIds,
    game.state.currentSong,
    nextSong,
    prefetchNextSong,
  ])

  // Cleanup preloaded audio and celebration on unmount
  useEffect(() => {
    return () => {
      if (preloadedAudioRef.current) {
        preloadedAudioRef.current.pause()
        preloadedAudioRef.current.src = ''
        preloadedAudioRef.current = null
      }
      cleanupCelebration()
      cleanupShake()
    }
  }, [cleanupCelebration, cleanupShake])

  // LOADING → PLAYING transition: Start playback when audio is ready
  // We check that the audio ready signal matches the current song to avoid race conditions
  useEffect(() => {
    if (
      game.state.status === 'loading' &&
      game.state.currentSong &&
      audioReadyForSongId === game.state.currentSong.id
    ) {
      game.actions.play()
    }
  }, [
    game.state.status,
    game.state.currentSong,
    audioReadyForSongId,
    game.actions,
  ])

  // Callback when audio is ready to play - receives songId from AudioPlayer
  const handleAudioReady = useCallback((songId: string) => {
    setAudioReadyForSongId(songId)
  }, [])

  // Handle replay button click - trigger replay and transition state
  // Also unlocks audio for iOS Safari on this user interaction
  const handleReplay = useCallback(async () => {
    // Unlock audio on interaction (iOS Safari)
    await unlockAudio()
    setShouldReplay(true)
    game.actions.replay()
  }, [game.actions, unlockAudio])

  // Callback when replay is complete (audio has been reset)
  const handleReplayComplete = useCallback(() => {
    setShouldReplay(false)
  }, [])

  // Handle play action with audio unlock for iOS Safari
  const handlePlay = useCallback(async () => {
    await unlockAudio()
    game.actions.play()
  }, [unlockAudio, game.actions])

  // Handle reveal action with audio unlock for iOS Safari
  const handleReveal = useCallback(async () => {
    await unlockAudio()
    game.actions.reveal()
  }, [unlockAudio, game.actions])

  // Handle next song action with audio unlock for iOS Safari
  const handleNextSong = useCallback(async () => {
    await unlockAudio()
    game.actions.nextSong()
  }, [unlockAudio, game.actions])

  // Handle buzz with audio unlock for iOS Safari
  // This ensures audio is unlocked on the first user interaction
  const handleBuzz = useCallback(async () => {
    // Unlock audio on first interaction (critical for iOS Safari)
    await unlockAudio()
    // Then trigger the actual buzz action
    game.actions.buzz()
  }, [unlockAudio, game.actions])

  // Handle validation with celebration on correct answers and shake on incorrect
  // Also unlocks audio for iOS Safari on this user interaction
  const handleValidate = useCallback(
    async (correct: boolean) => {
      // Unlock audio on interaction (iOS Safari)
      await unlockAudio()

      if (correct) {
        // Trigger confetti and green flash
        celebrate()
        setShowCorrectFlash(true)
        // Clear the flash after animation completes
        setTimeout(() => {
          setShowCorrectFlash(false)
        }, 500)
      } else {
        // Trigger shake and red flash for incorrect answer
        triggerShake()
        setShowIncorrectFlash(true)
        // Clear the flash after animation completes
        setTimeout(() => {
          setShowIncorrectFlash(false)
        }, 300)
      }
      game.actions.validate(correct)
    },
    [celebrate, triggerShake, game.actions, unlockAudio]
  )

  const handleNewGame = () => {
    // Reload the page with same config to start a new game
    window.location.reload()
  }

  const handleHome = () => {
    router.push('/')
  }

  // Get animation props based on reduced motion preference
  const getAnimationProps = (
    variants: typeof fadeSlideUp | typeof fadeScale | typeof fadeIn,
    transition = smoothTransition
  ) => {
    if (shouldReduceMotion) {
      return {}
    }
    return {
      variants,
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
      transition,
    }
  }

  // Show loading screen while checking audio support
  if (isCheckingAudio) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
      </div>
    )
  }

  // Show error screen if browser doesn't support audio
  if (!isAudioSupported) {
    return <BrowserUnsupportedError />
  }

  // Show recap screen when game is ended
  if (game.state.status === 'ended') {
    return (
      <motion.div key="game-recap" {...getAnimationProps(fadeScale)}>
        <GameRecap
          score={game.state.score}
          songsPlayed={game.state.songsPlayed}
          onNewGame={handleNewGame}
          onHome={handleHome}
          allSongsPlayed={allSongsPlayed}
        />
      </motion.div>
    )
  }

  // Shake animation for incorrect answers
  const shakeAnimation = isShaking
    ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
    : {}

  return (
    <motion.main
      className="flex min-h-screen w-full flex-col overflow-x-hidden p-3 sm:p-4 lg:p-6"
      animate={shouldReduceMotion ? {} : shakeAnimation}
    >
      {/* Header avec score - Responsive layout */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 lg:mb-6">
        <ScoreDisplay
          score={game.state.score}
          songsPlayed={game.state.songsPlayed}
        />
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Music Volume Slider - Hidden on very small screens, compact on mobile */}
          <div
            className="hidden min-h-[44px] items-center gap-2 rounded-lg bg-white/10 px-3 py-2 sm:flex"
            data-testid="music-volume-control"
          >
            <MusicalNoteIcon
              className="h-4 w-4 text-purple-300"
              aria-hidden="true"
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              className="h-6 w-16 cursor-pointer accent-purple-500 sm:w-20 md:w-24"
              aria-label="Volume de la musique"
              data-testid="music-volume-slider"
            />
            <span
              className="w-8 text-xs text-purple-300"
              data-testid="music-volume-percentage"
            >
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          {/* SFX Mute Toggle Button */}
          <Button
            onClick={handleToggleSfxMute}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1 sm:gap-2"
            aria-label={
              sfx.isMuted
                ? 'Activer les effets sonores'
                : 'Couper les effets sonores'
            }
            data-testid="sfx-mute-toggle"
          >
            {sfx.isMuted ? (
              <SpeakerXMarkIcon className="h-4 w-4" />
            ) : (
              <SpeakerWaveIcon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">SFX</span>
          </Button>
          {/* Fullscreen Toggle Button - only show if supported */}
          {isFullscreenSupported && (
            <Button
              onClick={toggleFullscreen}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 sm:gap-2"
              aria-label={
                isFullscreen
                  ? 'Quitter le mode plein écran'
                  : 'Passer en mode plein écran'
              }
              data-testid="fullscreen-toggle"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            onClick={() => setShowQuitConfirm(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1 sm:gap-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Quitter</span>
          </Button>
        </div>
      </header>

      {/* Quit confirmation modal */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            key="quit-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            {...getAnimationProps(fadeIn, quickTransition)}
          >
            <motion.div
              key="quit-modal-content"
              className="mx-4 max-w-sm rounded-xl bg-purple-900 p-6"
              {...getAnimationProps(fadeScale)}
            >
              <h3 className="mb-4 text-xl font-bold">Quitter la partie ?</h3>
              <p className="mb-6 text-purple-200">
                Votre score ne sera pas sauvegardé.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowQuitConfirm(false)}
                  variant="secondary"
                  size="md"
                  className="flex min-w-[44px] flex-1 items-center justify-center gap-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Annuler
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="danger"
                  size="md"
                  className="flex min-w-[44px] flex-1 items-center justify-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Quitter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area - Portrait: vertical stack, Landscape/Desktop: two columns */}
      <div className="flex flex-1 flex-col gap-4 portrait:flex-col landscape:flex-row sm:gap-6 lg:flex-row lg:gap-8">
        {/* Left column (Portrait: full width, Landscape/Desktop: left side) */}
        {/* Contains: Cover image + Audio player */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 landscape:gap-2 sm:gap-4 lg:gap-6">
          {/* Pochette / Révélation */}
          <SongReveal
            song={game.state.currentSong}
            isRevealed={game.state.isRevealed}
            guessMode={config.guessMode}
          />

          {/* Lecteur audio */}
          <div className="w-full max-w-xs px-2 sm:max-w-sm sm:px-0 md:max-w-md">
            <AudioPlayer
              songId={game.state.currentSong?.id}
              isPlaying={game.state.status === 'playing'}
              maxDuration={config.clipDuration}
              onEnded={game.actions.clipEnded}
              onReady={handleAudioReady}
              shouldReplay={shouldReplay}
              onReplayComplete={handleReplayComplete}
              volume={musicVolume}
            />
          </div>
        </div>

        {/* Right column (Portrait: bottom area, Landscape/Desktop: right side) */}
        {/* Contains: Buzzer/Timer + Game Controls */}
        <div className="flex flex-col items-center justify-center gap-4 landscape:w-64 landscape:flex-shrink-0 sm:gap-6 lg:w-80 lg:flex-shrink-0">
          {/* Animated state transitions for loading/buzzer/timer */}
          <AnimatePresence mode="wait">
            {/* Loading indicator - visible during loading state */}
            {game.state.status === 'loading' && (
              <motion.div
                key="loading"
                className="flex flex-col items-center justify-center gap-3"
                {...getAnimationProps(fadeIn, quickTransition)}
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-400 border-t-transparent sm:h-12 sm:w-12" />
                <p className="text-sm text-purple-300 sm:text-base">
                  Chargement...
                </p>
              </motion.div>
            )}

            {/* Buzzer - visible during playing state */}
            {game.state.status === 'playing' && (
              <motion.div
                key="buzzer"
                className="flex items-center justify-center"
                {...getAnimationProps(fadeSlideUp)}
              >
                <BuzzerButton onBuzz={handleBuzz} onPlaySound={sfx.buzz} />
              </motion.div>
            )}

            {/* Timer - visible during timer state */}
            {game.state.status === 'timer' && (
              <motion.div
                key="timer"
                className="flex items-center justify-center"
                {...getAnimationProps(fadeScale)}
              >
                <Timer
                  duration={config.timerDuration}
                  remaining={game.state.timerRemaining}
                  onPlayTick={sfx.tick}
                  onPlayTimeout={sfx.timeout}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contrôles du MJ */}
          <div className="w-full max-w-xs px-2 sm:max-w-sm sm:px-0 md:max-w-md lg:max-w-none">
            <GameControls
              status={game.state.status}
              isRevealed={game.state.isRevealed}
              onValidate={handleValidate}
              onReveal={handleReveal}
              onNext={handleNextSong}
              onPlay={handlePlay}
              onPause={game.actions.pause}
              onReplay={handleReplay}
            />
          </div>
        </div>
      </div>

      {/* Green flash overlay for correct answers */}
      <CorrectAnswerFlash show={showCorrectFlash} />

      {/* Red flash overlay for incorrect answers */}
      <IncorrectAnswerFlash show={showIncorrectFlash} />

      {/* Network error toast with retry option */}
      <NetworkErrorToast
        show={networkError.show}
        message={networkError.message}
        onRetry={handleNetworkRetry}
        onDismiss={handleNetworkDismiss}
      />
    </motion.main>
  )
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-purple-300">Chargement...</div>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  )
}
