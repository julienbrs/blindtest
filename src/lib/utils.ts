import { clsx, type ClassValue } from 'clsx'
import type { Song, StartPosition } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Calculate the start position in seconds for a song based on the selected mode
 *
 * @param song - The song to calculate start position for
 * @param mode - The start position mode (beginning, random, skip_intro)
 * @param clipDuration - The duration of the clip to play (needed to ensure we don't start too late)
 * @returns The start position in seconds
 *
 * Modes:
 * - 'beginning': Start at 0 seconds
 * - 'random': Start at a random point between 10% and 50% of the song duration
 * - 'skip_intro': Skip the intro - start after 30 seconds (or 20% of song if shorter)
 *
 * For short songs where the calculated start + clipDuration would exceed the song length,
 * the function falls back to starting at the beginning.
 */
export function getStartPosition(
  song: Song,
  mode: StartPosition,
  clipDuration: number
): number {
  const { duration } = song

  // Safety check: if song is too short for the clip, start at beginning
  if (duration <= clipDuration) {
    return 0
  }

  switch (mode) {
    case 'beginning':
      return 0

    case 'random': {
      // Random point between 10% and 50% of the song duration
      const minStart = duration * 0.1
      const maxStart = duration * 0.5
      // Ensure we don't start so late that the clip would exceed the song length
      const safeMaxStart = Math.min(maxStart, duration - clipDuration)
      // If safeMaxStart is less than minStart, fall back to beginning
      if (safeMaxStart < minStart) {
        return 0
      }
      return minStart + Math.random() * (safeMaxStart - minStart)
    }

    case 'skip_intro': {
      // Skip first 30 seconds, or 20% of song if the song is shorter
      const skipAmount = Math.min(30, duration * 0.2)
      // Ensure we don't start so late that the clip would exceed the song length
      const safeStart = Math.min(skipAmount, duration - clipDuration)
      // If this would result in a negative or very small start, fall back to beginning
      if (safeStart <= 0) {
        return 0
      }
      return safeStart
    }

    default:
      return 0
  }
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
 * @param options - Fetch options (signal will be combined with timeout)
 * @param timeout - Timeout in milliseconds (default: 10000ms = 10s)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const timeoutController = new AbortController()
  const id = setTimeout(() => timeoutController.abort(), timeout)

  // If an external signal is provided, listen for its abort event
  const externalSignal = options.signal
  if (externalSignal?.aborted) {
    clearTimeout(id)
    throw new DOMException('The operation was aborted.', 'AbortError')
  }

  // Create abort handler for external signal
  const onExternalAbort = () => {
    timeoutController.abort()
  }
  externalSignal?.addEventListener('abort', onExternalAbort)

  try {
    const response = await fetch(url, {
      ...options,
      signal: timeoutController.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    // If external signal was aborted, propagate as AbortError (not NetworkError)
    if (externalSignal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('TIMEOUT', 'La requête a expiré')
    }
    throw new NetworkError(
      'NETWORK_ERROR',
      'Impossible de contacter le serveur'
    )
  } finally {
    externalSignal?.removeEventListener('abort', onExternalAbort)
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
      // If aborted, propagate immediately without retrying
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
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
