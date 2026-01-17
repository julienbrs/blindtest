'use client'

import type { GameStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'

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
          <ArrowPathIcon className="h-5 w-5" />
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
            <XMarkIcon className="h-6 w-6" />
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
