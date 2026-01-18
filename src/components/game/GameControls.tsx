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
    <footer className="mt-4 flex flex-col items-center gap-4 sm:mt-6">
      {/* Next song button - visible only in reveal state */}
      {showNextButton && (
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          className="flex w-full items-center justify-center gap-2"
        >
          <span className="text-sm sm:text-base">Chanson suivante</span>
          <ArrowRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}

      {/* Replay button - visible in reveal state to replay the same song */}
      {showReplayButton && (
        <Button
          onClick={onReplay}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1 sm:gap-2"
        >
          <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Rejouer l&apos;extrait</span>
        </Button>
      )}

      {/* Validation buttons - visible after buzz */}
      {showValidationButtons && (
        <div className="flex w-full gap-4">
          <Button
            onClick={() => onValidate(true)}
            variant="success"
            size="lg"
            className="flex flex-1 items-center justify-center gap-1 sm:gap-2"
          >
            <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">Correct</span>
          </Button>
          <Button
            onClick={() => onValidate(false)}
            variant="danger"
            size="lg"
            className="flex flex-1 items-center justify-center gap-1 sm:gap-2"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">Incorrect</span>
          </Button>
        </div>
      )}

      {/* Reveal button - visible during playing/buzzed/timer when not yet revealed */}
      {showRevealButton && (
        <Button
          onClick={onReveal}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1 sm:gap-2"
        >
          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Révéler la réponse</span>
        </Button>
      )}

      {/* Play/Pause button - always visible for MJ control */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-purple-400/50 sm:h-14 sm:w-14 md:h-16 md:w-16"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon className="h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
        ) : (
          <PlayIcon className="ml-1 h-6 w-6 text-white sm:h-7 sm:w-7 md:h-8 md:w-8" />
        )}
      </button>

      {/* Status indicator */}
      <div className="text-xs text-purple-300 sm:text-sm">État: {status}</div>
    </footer>
  )
}
