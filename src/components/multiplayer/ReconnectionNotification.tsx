'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface ReconnectionNotificationProps {
  /** Whether to show the notification */
  show: boolean
  /** Callback to dismiss the notification */
  onDismiss?: () => void
  /** Auto-dismiss delay in milliseconds (default: 3000) */
  autoDismissDelay?: number
}

/**
 * ReconnectionNotification - Shows a notification when a player reconnects
 *
 * Displays a brief notification confirming the player has successfully
 * reconnected to the game session.
 */
export function ReconnectionNotification({
  show,
  onDismiss,
  autoDismissDelay = 3000,
}: ReconnectionNotificationProps) {
  const shouldReduceMotion = useReducedMotion()

  // Auto-dismiss after delay
  useEffect(() => {
    if (show && onDismiss && autoDismissDelay > 0) {
      const timer = setTimeout(onDismiss, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [show, onDismiss, autoDismissDelay])

  const variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: -50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
      }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div
            className="flex items-center gap-3 rounded-xl border border-green-400/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-5 py-3 shadow-lg backdrop-blur-sm"
            role="alert"
            aria-live="polite"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-400/20">
              <ArrowPathIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-200">
                Reconnexion reussie
              </div>
              <div className="text-base font-bold text-white">
                Vous avez rejoint la partie
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-2 rounded-lg p-1 text-green-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fermer"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
