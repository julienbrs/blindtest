'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { PauseIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'

interface PausedOverlayProps {
  /** Whether to show the overlay */
  show: boolean
  /** Callback when resume is clicked */
  onResume: () => void
}

/**
 * Overlay shown when the game is paused due to page visibility change.
 * Displays a "Game Paused" message with a resume button.
 */
export function PausedOverlay({ show, onResume }: PausedOverlayProps) {
  const shouldReduceMotion = useReducedMotion()

  const animationProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          data-testid="paused-overlay"
          {...animationProps}
        >
          <motion.div
            className="mx-4 flex max-w-sm flex-col items-center rounded-2xl bg-purple-900/90 p-8 text-center shadow-2xl"
            initial={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0 }}
            animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
            exit={shouldReduceMotion ? {} : { scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 rounded-full bg-purple-500/30 p-4">
              <PauseIcon className="h-12 w-12 text-purple-300" />
            </div>
            <h2 className="mb-2 font-heading text-2xl font-bold text-white">
              Partie en pause
            </h2>
            <p className="mb-6 text-purple-200">
              La partie a été mise en pause car vous avez quitté l&apos;onglet.
            </p>
            <Button
              onClick={onResume}
              variant="primary"
              size="lg"
              data-testid="resume-button"
            >
              Reprendre
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
