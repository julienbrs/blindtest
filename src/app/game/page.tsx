'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { Timer } from '@/components/game/Timer'
import { ScoreDisplay } from '@/components/game/ScoreDisplay'
import { SongReveal } from '@/components/game/SongReveal'
import { GameControls } from '@/components/game/GameControls'
import { GameRecap } from '@/components/game/GameRecap'
import type { GameConfig, GuessMode } from '@/lib/types'

function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

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
          />
        </div>

        {/* Right column (Mobile: bottom area, Desktop: right side) */}
        {/* Contains: Buzzer/Timer + Game Controls */}
        <div className="flex flex-col items-center justify-center gap-6 lg:w-80 lg:flex-shrink-0">
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
