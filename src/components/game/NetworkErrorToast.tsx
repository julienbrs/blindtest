'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'

interface NetworkErrorToastProps {
  /** Whether the toast is visible */
  show: boolean
  /** Callback when user clicks retry */
  onRetry: () => void
  /** Callback to dismiss the toast */
  onDismiss?: () => void
  /** Custom error message (optional) */
  message?: string
}

/**
 * Toast component for displaying network errors with retry option
 * Appears at the bottom of the screen with a red/orange style
 */
export function NetworkErrorToast({
  show,
  onRetry,
  onDismiss,
  message,
}: NetworkErrorToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
          role="alert"
          aria-live="assertive"
          data-testid="network-error-toast"
        >
          <div className="rounded-xl bg-red-900/90 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-red-400">
                <ExclamationTriangleIcon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-white">
                  Erreur de connexion
                </h4>
                <p className="mt-1 text-sm text-red-200">
                  {message ||
                    'Impossible de contacter le serveur. Vérifiez votre connexion.'}
                </p>
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 rounded-lg p-1 text-red-300 hover:bg-red-800/50 hover:text-white"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={onRetry}
                variant="danger"
                size="sm"
                data-testid="network-error-retry"
              >
                Réessayer
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
