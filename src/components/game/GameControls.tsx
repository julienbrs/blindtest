'use client'

import type { GameStatus } from '@/lib/types'

interface GameControlsProps {
  status: GameStatus
  onValidate: (correct: boolean) => void
  onReveal: () => void
  onNext: () => void
  onPlay: () => void
  onPause: () => void
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

export function GameControls({
  status,
  onValidate: _onValidate,
  onReveal: _onReveal,
  onNext: _onNext,
  onPlay,
  onPause,
}: GameControlsProps) {
  const isPlaying = status === 'playing'

  return (
    <footer className="mt-6 flex flex-col items-center gap-4">
      {/* Play/Pause button - always visible for MJ control */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/50"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon className="h-8 w-8 text-white" />
        ) : (
          <PlayIcon className="ml-1 h-8 w-8 text-white" />
        )}
      </button>

      {/* Status indicator */}
      <div className="text-sm text-purple-300">État: {status}</div>
    </footer>
  )
}
