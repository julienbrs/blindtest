import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Error types for network operations
 */
export type NetworkErrorType = 'TIMEOUT' | 'NETWORK_ERROR' | 'MAX_RETRIES'

export class NetworkError extends Error {
  constructor(
    public type: NetworkErrorType,
    message: string
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * Fetch with timeout - aborts the request if it takes longer than the specified timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000ms = 10s)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('TIMEOUT', 'La requête a expiré')
    }
    throw new NetworkError(
      'NETWORK_ERROR',
      'Impossible de contacter le serveur'
    )
  }
}

/**
 * Fetch with retry - retries the request up to the specified number of times with exponential backoff
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries (default: 3)
 * @param timeout - Timeout per request in milliseconds (default: 10000ms)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeout = 10000
): Promise<Response> {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(url, options, timeout)
      if (res.ok) return res
      // Non-ok response but not a network error - return it
      // This allows handling 404, 400, etc. without retrying
      return res
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Only retry on network errors, not on successful responses
      if (i < retries - 1) {
        // Exponential backoff: 1s, 2s, 3s
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      }
    }
  }

  throw new NetworkError(
    'MAX_RETRIES',
    `Échec après ${retries} tentatives: ${lastError?.message || 'Erreur inconnue'}`
  )
}
