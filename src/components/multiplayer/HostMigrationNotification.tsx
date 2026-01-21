'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/solid'

interface HostMigrationNotificationProps {
  /** Nickname of the new host */
  newHostNickname: string | null
  /** Callback to dismiss the notification */
  onDismiss?: () => void
}

/**
 * HostMigrationNotification - Shows a notification when host migrates
 *
 * Displays a prominent notification when a new host is assigned after
 * the previous host disconnected.
 */
export function HostMigrationNotification({
  newHostNickname,
  onDismiss,
}: HostMigrationNotificationProps) {
  const shouldReduceMotion = useReducedMotion()

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
      {newHostNickname && (
        <motion.div
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div
            className="flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-5 py-3 shadow-lg backdrop-blur-sm"
            role="alert"
            aria-live="polite"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/20">
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-200">
                Nouvel hôte
              </div>
              <div className="text-base font-bold text-white">
                {newHostNickname} est maintenant l&apos;hôte
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-2 rounded-lg p-1 text-yellow-300 transition-colors hover:bg-white/10 hover:text-white"
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
