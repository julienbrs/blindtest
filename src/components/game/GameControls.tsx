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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  )
}

export function GameControls({
  status,
  onValidate,
  onReveal: _onReveal,
  onNext: _onNext,
  onPlay,
  onPause,
}: GameControlsProps) {
  const isPlaying = status === 'playing'
  const showValidationButtons = status === 'buzzed' || status === 'timer'

  return (
    <footer className="mt-6 flex flex-col items-center gap-4">
      {/* Validation buttons - visible after buzz */}
      {showValidationButtons && (
        <div className="flex w-full max-w-md gap-4">
          <button
            onClick={() => onValidate(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-4 px-6 text-lg font-bold transition-colors hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-400/50"
          >
            <CheckIcon className="h-6 w-6" />
            Correct
          </button>
          <button
            onClick={() => onValidate(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-4 px-6 text-lg font-bold transition-colors hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-400/50"
          >
            <XIcon className="h-6 w-6" />
            Incorrect
          </button>
        </div>
      )}

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
