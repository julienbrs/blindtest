// Blindtest Service Worker - Caching for offline support and performance
const CACHE_NAME = 'blindtest-v1'
const CACHE_VERSION = 1

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/play',
  '/solo',
  '/game',
  '/multiplayer',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with catch to handle failures gracefully
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Service Worker: Some assets failed to cache:', error)
        // Continue installation even if some assets fail
        return Promise.resolve()
      })
    })
  )
  // Take control immediately without waiting for old SW to finish
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('blindtest-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // API requests: Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request))
    return
  }

  // Fonts: Cache-first strategy (fonts rarely change)
  if (
    url.pathname.includes('/fonts/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirstStrategy(event.request))
    return
  }

  // Static assets (JS, CSS, images): Stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(staleWhileRevalidate(event.request))
    return
  }

  // Navigation requests (HTML pages): Network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(event.request))
    return
  }

  // Default: Network-first for everything else
  event.respondWith(networkFirstStrategy(event.request))
})

/**
 * Cache-first strategy - Use cached version if available, otherwise fetch
 * Best for: Fonts, static assets that rarely change
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Return offline fallback if available
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network-first strategy - Try network first, fall back to cache
 * Best for: API calls, HTML pages, dynamic content
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request)
    // Cache successful responses for offline fallback
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Try to return cached version
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No network connection' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Stale-while-revalidate strategy - Return cached version immediately,
 * then update cache in background
 * Best for: Static assets that may update (JS, CSS, images)
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => {
      // Silently fail on network error
      return null
    })

  // Return cached version if available, otherwise wait for fetch
  return cached || fetchPromise
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION, cacheName: CACHE_NAME })
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true })
    })
  }
})
