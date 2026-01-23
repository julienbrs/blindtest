'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/serviceWorker'

/**
 * Client component that handles Service Worker registration on app load.
 * Must be rendered as a client component since it uses browser APIs.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log(
          'Blindtest: App cached for offline use',
          registration.scope
        )
      },
      onUpdate: (registration) => {
        console.log('Blindtest: New version available')
        // Optionally prompt user to refresh
        // For now, just log it - the update will apply on next visit
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      },
      onError: (error) => {
        console.warn('Blindtest: Service Worker registration failed:', error)
      },
    })
  }, [])

  // This component doesn't render anything
  return null
}
