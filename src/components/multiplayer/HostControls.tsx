'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import {
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  EyeIcon,
  StopIcon,
} from '@heroicons/react/24/solid'
import type { MultiplayerGameStatus } from '@/hooks/useMultiplayerGame'

interface HostControlsProps {
  /** Current game status */
  gameStatus: MultiplayerGameStatus
  /** Whether the current answer has been revealed */
  isRevealed: boolean
  /** Whether there is a current buzzer (someone is answering) */
  hasBuzzer: boolean
  /** Validate the current answer (true = correct, false = incorrect) */
  onValidate: (correct: boolean) => Promise<boolean>
  /** Load the next song */
  onNextSong: () => Promise<void>
  /** Reveal the current answer */
  onReveal: () => Promise<boolean>
  /** End the game */
  onEndGame: () => Promise<boolean>
  /** Optional loading state */
  isLoading?: boolean
}

/**
 * HostControls - Interface for the host to control the multiplayer game
 *
 * Provides buttons for:
 * - Correct/Incorrect (visible when someone has buzzed)
 * - Next Song (visible after reveal)
 * - Reveal Answer (visible during playing or buzzed states)
 * - End Game (always visible)
 *
 * Only the host sees these controls. All actions update the room/players
 * in Supabase, and other players see changes in real-time.
 *
 * @example
 * ```tsx
 * {isHost && (
 *   <HostControls
 *     gameStatus={gameState.status}
 *     isRevealed={isRevealed}
 *     hasBuzzer={currentBuzzer !== null}
 *     onValidate={handleValidate}
 *     onNextSong={handleNextSong}
 *     onReveal={handleReveal}
 *     onEndGame={handleEndGame}
 *   />
 * )}
 * ```
 */
export function HostControls({
  gameStatus,
  isRevealed,
  hasBuzzer,
  onValidate,
  onNextSong,
  onReveal,
  onEndGame,
  isLoading = false,
}: HostControlsProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [isLoadingNext, setIsLoadingNext] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  // Show validation buttons when someone has buzzed
  const showValidationButtons = gameStatus === 'buzzed' && hasBuzzer

  // Show next song button after reveal OR when loading (to load first song)
  const showNextButton = gameStatus === 'reveal' || gameStatus === 'loading'

  // Show reveal button during playing or buzzed states (if not already revealed)
  const showRevealButton =
    (gameStatus === 'playing' || gameStatus === 'buzzed') && !isRevealed

  // Show end game button when game is in progress (not in waiting or ended state)
  const showEndButton = gameStatus !== 'waiting' && gameStatus !== 'ended'

  const handleValidate = useCallback(
    async (correct: boolean) => {
      if (isValidating) return
      setIsValidating(true)
      try {
        await onValidate(correct)
      } finally {
        setIsValidating(false)
      }
    },
    [isValidating, onValidate]
  )

  const handleNextSong = useCallback(async () => {
    if (isLoadingNext) return
    setIsLoadingNext(true)
    try {
      await onNextSong()
    } finally {
      setIsLoadingNext(false)
    }
  }, [isLoadingNext, onNextSong])

  const handleReveal = useCallback(async () => {
    if (isRevealing) return
    setIsRevealing(true)
    try {
      await onReveal()
    } finally {
      setIsRevealing(false)
    }
  }, [isRevealing, onReveal])

  const handleEndGame = useCallback(async () => {
    if (isEnding) return
    setIsEnding(true)
    try {
      await onEndGame()
    } finally {
      setIsEnding(false)
    }
  }, [isEnding, onEndGame])

  const anyLoading =
    isLoading || isValidating || isLoadingNext || isRevealing || isEnding

  return (
    <motion.div
      className="flex w-full flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Host indicator */}
      <div className="mb-2 flex items-center justify-center gap-2 text-sm text-purple-300">
        <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
          Controles Hote
        </span>
      </div>

      {/* Validation buttons - visible when someone buzzed */}
      <AnimatePresence mode="wait">
        {showValidationButtons && (
          <motion.div
            key="validation-buttons"
            className="flex w-full gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => handleValidate(true)}
              variant="success"
              size="lg"
              disabled={anyLoading}
              className="flex flex-1 items-center justify-center gap-2"
            >
              {isValidating ? (
                <LoadingSpinner />
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Correct</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => handleValidate(false)}
              variant="danger"
              size="lg"
              disabled={anyLoading}
              className="flex flex-1 items-center justify-center gap-2"
            >
              {isValidating ? (
                <LoadingSpinner />
              ) : (
                <>
                  <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Incorrect</span>
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next song button - visible after reveal */}
      <AnimatePresence mode="wait">
        {showNextButton && (
          <motion.div
            key="next-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleNextSong}
              variant="primary"
              size="lg"
              disabled={anyLoading}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              {isLoadingNext ? (
                <LoadingSpinner />
              ) : (
                <>
                  <span className="text-sm sm:text-base">Chanson suivante</span>
                  <ArrowRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal button - visible during playing or buzzed when not revealed */}
      <AnimatePresence mode="wait">
        {showRevealButton && (
          <motion.div
            key="reveal-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleReveal}
              variant="secondary"
              size="sm"
              disabled={anyLoading}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              {isRevealing ? (
                <LoadingSpinner />
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">Reveler la reponse</span>
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End game button - visible during the game */}
      <AnimatePresence mode="wait">
        {showEndButton && (
          <motion.div
            key="end-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 border-t border-white/10 pt-4"
          >
            <Button
              onClick={handleEndGame}
              variant="danger"
              size="sm"
              disabled={anyLoading}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              {isEnding ? (
                <LoadingSpinner />
              ) : (
                <>
                  <StopIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">Terminer la partie</span>
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
