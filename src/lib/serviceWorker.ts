/**
 * Service Worker registration helper
 * Handles registration, updates, and communication with the Service Worker
 */

export interface ServiceWorkerConfig {
  /** Callback when SW is successfully registered */
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  /** Callback when SW update is available */
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  /** Callback when SW registration fails */
  onError?: (error: Error) => void
}

/**
 * Register the Service Worker with optional callbacks for lifecycle events
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  // Only register in browser environment
  if (typeof window === 'undefined') {
    return null
  }

  // Check for Service Worker support
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker: Not supported in this browser')
    return null
  }

  // Don't register in development mode to avoid caching issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Service Worker: Skipped in development mode')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Check for updates on registration
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing
      if (!installingWorker) return

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('Service Worker: Update available')
            config.onUpdate?.(registration)
          } else {
            // Content cached for offline use
            console.log('Service Worker: Content cached for offline use')
            config.onSuccess?.(registration)
          }
        }
      })
    })

    // Check if already active
    if (registration.active) {
      console.log('Service Worker: Already active')
      config.onSuccess?.(registration)
    }

    return registration
  } catch (error) {
    console.error('Service Worker: Registration failed:', error)
    config.onError?.(error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Unregister all Service Workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const result = await registration.unregister()
    console.log('Service Worker: Unregistered successfully')
    return result
  } catch (error) {
    console.error('Service Worker: Unregistration failed:', error)
    return false
  }
}

/**
 * Check for Service Worker updates manually
 */
export async function checkForUpdates(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    console.log('Service Worker: Checked for updates')
  } catch (error) {
    console.error('Service Worker: Update check failed:', error)
  }
}

/**
 * Send a message to the active Service Worker
 */
export function sendMessageToSW<T>(message: unknown): Promise<T | null> {
  return new Promise((resolve) => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !navigator.serviceWorker.controller
    ) {
      resolve(null)
      return
    }

    const messageChannel = new MessageChannel()
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data as T)
    }

    navigator.serviceWorker.controller.postMessage(message, [
      messageChannel.port2,
    ])
  })
}

/**
 * Get the current Service Worker version info
 */
export async function getSWVersion(): Promise<{
  version: number
  cacheName: string
} | null> {
  return sendMessageToSW({ type: 'GET_VERSION' })
}

/**
 * Clear the Service Worker cache
 */
export async function clearSWCache(): Promise<boolean> {
  const result = await sendMessageToSW<{ success: boolean }>({
    type: 'CLEAR_CACHE',
  })
  return result?.success ?? false
}

/**
 * Skip waiting on a pending Service Worker update
 */
export function skipWaiting(): void {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !navigator.serviceWorker.controller
  ) {
    return
  }

  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
}
