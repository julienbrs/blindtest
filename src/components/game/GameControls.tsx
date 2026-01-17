'use client'

import type { GameStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface GameControlsProps {
  status: GameStatus
  isRevealed: boolean
  onValidate: (correct: boolean) => void
  onReveal: () => void
  onNext: () => void
  onPlay: () => void
  onPause: () => void
  onReplay?: () => void
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  )
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  )
}

export function GameControls({
  status,
  isRevealed,
  onValidate,
  onReveal,
  onNext,
  onPlay,
  onPause,
  onReplay,
}: GameControlsProps) {
  const isPlaying = status === 'playing'
  const showValidationButtons = status === 'buzzed' || status === 'timer'
  const showNextButton = status === 'reveal'
  const showRevealButton =
    (status === 'playing' || status === 'buzzed' || status === 'timer') &&
    !isRevealed
  const showReplayButton = status === 'reveal' && onReplay

  return (
    <footer className="mt-6 flex flex-col items-center gap-4">
      {/* Next song button - visible only in reveal state */}
      {showNextButton && (
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          className="flex w-full max-w-md items-center justify-center gap-2"
        >
          Chanson suivante
          <ArrowRightIcon className="h-6 w-6" />
        </Button>
      )}

      {/* Replay button - visible in reveal state to replay the same song */}
      {showReplayButton && (
        <Button
          onClick={onReplay}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <ReplayIcon className="h-5 w-5" />
          Rejouer l&apos;extrait
        </Button>
      )}

      {/* Validation buttons - visible after buzz */}
      {showValidationButtons && (
        <div className="flex w-full max-w-md gap-4">
          <Button
            onClick={() => onValidate(true)}
            variant="success"
            size="lg"
            className="flex flex-1 items-center justify-center gap-2"
          >
            <CheckIcon className="h-6 w-6" />
            Correct
          </Button>
          <Button
            onClick={() => onValidate(false)}
            variant="danger"
            size="lg"
            className="flex flex-1 items-center justify-center gap-2"
          >
            <XIcon className="h-6 w-6" />
            Incorrect
          </Button>
        </div>
      )}

      {/* Reveal button - visible during playing/buzzed/timer when not yet revealed */}
      {showRevealButton && (
        <Button
          onClick={onReveal}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <EyeIcon className="h-5 w-5" />
          Révéler la réponse
        </Button>
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
