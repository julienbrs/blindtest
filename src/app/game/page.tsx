'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { Timer } from '@/components/game/Timer'
import { ScoreDisplay } from '@/components/game/ScoreDisplay'
import { SongReveal } from '@/components/game/SongReveal'
import { GameControls } from '@/components/game/GameControls'
import { GameRecap } from '@/components/game/GameRecap'
import type { GameConfig, GuessMode, Song } from '@/lib/types'

function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [allSongsPlayed, setAllSongsPlayed] = useState(false)
  // Track which song ID triggered the audio ready state
  const [audioReadyForSongId, setAudioReadyForSongId] = useState<string | null>(
    null
  )
  const hasInitialized = useRef(false)
  // Track if replay was triggered
  const [shouldReplay, setShouldReplay] = useState(false)

  // Preloading state for the next song
  const [nextSong, setNextSong] = useState<Song | null>(null)
  const preloadedAudioRef = useRef<HTMLAudioElement | null>(null)
  const isPrefetchingRef = useRef(false)

  // Parse config from URL parameters
  const config: GameConfig = {
    guessMode: (searchParams.get('mode') as GuessMode) || 'both',
    clipDuration: Number(searchParams.get('duration')) || 20,
    timerDuration:
      searchParams.get('noTimer') === 'true'
        ? 0
        : Number(searchParams.get('timerDuration')) || 5,
  }

  const game = useGameState(config)

  // Prefetch the next song during REVEAL state
  const prefetchNextSong = useCallback(async (excludeIds: string[]) => {
    if (isPrefetchingRef.current) return
    isPrefetchingRef.current = true

    const exclude = excludeIds.join(',')
    const url = `/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`

    try {
      const res = await fetch(url)

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

  // Load a random song from the API
  const loadRandomSong = useCallback(
    async (excludeIds: string[], preloadedSong: Song | null) => {
      // If we have a preloaded song, use it immediately
      if (preloadedSong) {
        game.actions.loadSong(preloadedSong)
        setNextSong(null)
        return
      }

      const exclude = excludeIds.join(',')
      const url = `/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`

      try {
        const res = await fetch(url)

        if (!res.ok) {
          if (res.status === 404) {
            // No more songs available
            setAllSongsPlayed(true)
            game.actions.quit()
          }
          return
        }

        const data = (await res.json()) as { song: Song }
        if (data.song) {
          game.actions.loadSong(data.song)
        } else {
          // No song returned
          setAllSongsPlayed(true)
          game.actions.quit()
        }
      } catch {
        // Network error - end the game
        game.actions.quit()
      }
    },
    [game.actions]
  )

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
    if (game.state.status === 'loading' && !game.state.currentSong) {
      // Capture playedSongIds and nextSong to use in microtask
      const playedIds = game.state.playedSongIds
      const preloadedSong = nextSong
      // Use queueMicrotask to avoid calling setState synchronously in effect
      queueMicrotask(() => {
        // Reset the audioReady state for the new song
        setAudioReadyForSongId(null)
        // Load a new random song (excluding already played songs), using preloaded if available
        void loadRandomSong(playedIds, preloadedSong)
      })
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

  // Cleanup preloaded audio on unmount
  useEffect(() => {
    return () => {
      if (preloadedAudioRef.current) {
        preloadedAudioRef.current.pause()
        preloadedAudioRef.current.src = ''
        preloadedAudioRef.current = null
      }
    }
  }, [])

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
  const handleReplay = useCallback(() => {
    setShouldReplay(true)
    game.actions.replay()
  }, [game.actions])

  // Callback when replay is complete (audio has been reset)
  const handleReplayComplete = useCallback(() => {
    setShouldReplay(false)
  }, [])

  const handleNewGame = () => {
    // Reload the page with same config to start a new game
    window.location.reload()
  }

  const handleHome = () => {
    router.push('/')
  }

  // Show recap screen when game is ended
  if (game.state.status === 'ended') {
    return (
      <GameRecap
        score={game.state.score}
        songsPlayed={game.state.songsPlayed}
        onNewGame={handleNewGame}
        onHome={handleHome}
        allSongsPlayed={allSongsPlayed}
      />
    )
  }

  return (
    <main className="flex min-h-screen flex-col p-4 lg:p-6">
      {/* Header avec score - Full width on all breakpoints */}
      <header className="mb-4 flex items-center justify-between lg:mb-6">
        <ScoreDisplay
          score={game.state.score}
          songsPlayed={game.state.songsPlayed}
        />
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="rounded-lg px-3 py-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Quitter
        </button>
      </header>

      {/* Quit confirmation modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-sm rounded-xl bg-purple-900 p-6">
            <h3 className="mb-4 text-xl font-bold">Quitter la partie ?</h3>
            <p className="mb-6 text-purple-200">
              Votre score ne sera pas sauvegardé.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 rounded-lg bg-white/10 py-2 transition-colors hover:bg-white/20"
              >
                Annuler
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 rounded-lg bg-red-600 py-2 transition-colors hover:bg-red-500"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area - Mobile: vertical stack, Desktop: two columns */}
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left column (Mobile: full width, Desktop: left side) */}
        {/* Contains: Cover image + Audio player */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 lg:gap-6">
          {/* Pochette / Révélation */}
          <SongReveal
            song={game.state.currentSong}
            isRevealed={game.state.isRevealed}
            guessMode={config.guessMode}
          />

          {/* Lecteur audio */}
          <AudioPlayer
            songId={game.state.currentSong?.id}
            isPlaying={game.state.status === 'playing'}
            maxDuration={config.clipDuration}
            onEnded={game.actions.clipEnded}
            onReady={handleAudioReady}
            shouldReplay={shouldReplay}
            onReplayComplete={handleReplayComplete}
          />
        </div>

        {/* Right column (Mobile: bottom area, Desktop: right side) */}
        {/* Contains: Buzzer/Timer + Game Controls */}
        <div className="flex flex-col items-center justify-center gap-6 lg:w-80 lg:flex-shrink-0">
          {/* Loading indicator - visible during loading state */}
          {game.state.status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-400 border-t-transparent" />
              <p className="text-purple-300">Chargement...</p>
            </div>
          )}

          {/* Buzzer - visible during playing state */}
          {game.state.status === 'playing' && (
            <div className="flex items-center justify-center">
              <BuzzerButton onBuzz={game.actions.buzz} />
            </div>
          )}

          {/* Timer - visible during timer state */}
          {game.state.status === 'timer' && (
            <div className="flex items-center justify-center">
              <Timer
                duration={config.timerDuration}
                remaining={game.state.timerRemaining}
              />
            </div>
          )}

          {/* Contrôles du MJ */}
          <div className="w-full max-w-md lg:max-w-none">
            <GameControls
              status={game.state.status}
              isRevealed={game.state.isRevealed}
              onValidate={game.actions.validate}
              onReveal={game.actions.reveal}
              onNext={game.actions.nextSong}
              onPlay={game.actions.play}
              onPause={game.actions.pause}
              onReplay={handleReplay}
            />
          </div>
        </div>
      </div>
    </main>
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
