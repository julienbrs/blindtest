'use client'

interface LoadingScreenProps {
  message?: string
}

/**
 * LoadingScreen - Global loading indicator for initial page loads
 *
 * Displays a centered spinner with an optional message.
 * Used during initial library scan and data fetching.
 */
export function LoadingScreen({
  message = 'Chargement de la bibliothèque...',
}: LoadingScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Spinner */}
      <div
        className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
        aria-hidden="true"
      />

      {/* Message */}
      <p className="mt-4 animate-pulse text-purple-300">{message}</p>

      {/* Screen reader announcement */}
      <span className="sr-only">{message}</span>
    </div>
  )
}
