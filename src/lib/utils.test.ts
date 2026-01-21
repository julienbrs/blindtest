import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  fetchWithTimeout,
  fetchWithRetry,
  NetworkError,
  getStartPosition,
} from './utils'
import type { Song } from './types'

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})

describe('NetworkError', () => {
  it('creates error with TIMEOUT type', () => {
    const error = new NetworkError('TIMEOUT', 'Request timed out')
    expect(error.type).toBe('TIMEOUT')
    expect(error.message).toBe('Request timed out')
    expect(error.name).toBe('NetworkError')
  })

  it('creates error with NETWORK_ERROR type', () => {
    const error = new NetworkError('NETWORK_ERROR', 'Server unreachable')
    expect(error.type).toBe('NETWORK_ERROR')
    expect(error.message).toBe('Server unreachable')
  })

  it('creates error with MAX_RETRIES type', () => {
    const error = new NetworkError('MAX_RETRIES', 'Failed after 3 attempts')
    expect(error.type).toBe('MAX_RETRIES')
    expect(error.message).toBe('Failed after 3 attempts')
  })

  it('is instanceof Error', () => {
    const error = new NetworkError('TIMEOUT', 'Test')
    expect(error instanceof Error).toBe(true)
  })
})

describe('fetchWithTimeout', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns response on successful fetch within timeout', async () => {
    const mockResponse = new Response('OK', { status: 200 })
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const result = await fetchWithTimeout('/api/test', {}, 10000)

    expect(result).toBe(mockResponse)
  })

  it('throws TIMEOUT error when request exceeds timeout', async () => {
    // Simulate a slow request that takes longer than timeout
    vi.mocked(global.fetch).mockImplementationOnce(
      (_url, options) =>
        new Promise((resolve, reject) => {
          const signal = (options as RequestInit)?.signal
          if (signal) {
            signal.addEventListener('abort', () => {
              const abortError = new Error('Aborted')
              abortError.name = 'AbortError'
              reject(abortError)
            })
          }
          // Never resolves naturally - waits for abort
        })
    )

    // Use a very short timeout for testing
    await expect(fetchWithTimeout('/api/test', {}, 50)).rejects.toMatchObject({
      type: 'TIMEOUT',
      message: 'La requête a expiré',
    })
  })

  it('throws NETWORK_ERROR on fetch failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network failure'))

    await expect(
      fetchWithTimeout('/api/test', {}, 10000)
    ).rejects.toMatchObject({
      type: 'NETWORK_ERROR',
      message: 'Impossible de contacter le serveur',
    })
  })

  it('passes options to fetch', async () => {
    const mockResponse = new Response('OK', { status: 200 })
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const options = { method: 'POST', body: 'test' }
    await fetchWithTimeout('/api/test', options, 10000)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: 'test',
        signal: expect.any(AbortSignal),
      })
    )
  })
})

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns response on first successful attempt', async () => {
    const mockResponse = new Response('OK', { status: 200 })
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const result = await fetchWithRetry('/api/test', {}, 3, 10000)

    expect(result).toBe(mockResponse)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on network error and succeeds on second attempt', async () => {
    const mockResponse = new Response('OK', { status: 200 })
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse)

    // Use short timeout for retries
    const result = await fetchWithRetry('/api/test', {}, 3, 100)

    expect(result).toBe(mockResponse)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  }, 10000) // Longer test timeout

  it('throws MAX_RETRIES error after exhausting all retries', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

    await expect(
      fetchWithRetry('/api/test', {}, 2, 100) // Only 2 retries with short timeout
    ).rejects.toMatchObject({
      type: 'MAX_RETRIES',
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  }, 15000) // Longer test timeout for retries

  it('returns non-ok response without retrying (for 404, 400, etc.)', async () => {
    const mockResponse = new Response('Not Found', { status: 404 })
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const result = await fetchWithRetry('/api/test', {}, 3, 10000)

    expect(result.status).toBe(404)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('passes options to underlying fetch', async () => {
    const mockResponse = new Response('OK', { status: 200 })
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
    await fetchWithRetry('/api/test', options, 3, 10000)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('includes error message in MAX_RETRIES error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Connection refused'))

    await expect(fetchWithRetry('/api/test', {}, 2, 100)).rejects.toMatchObject(
      {
        type: 'MAX_RETRIES',
        message: expect.stringContaining('2 tentatives'),
      }
    )
  }, 15000)
})

describe('getStartPosition', () => {
  // Helper to create a mock song with specified duration
  const createMockSong = (duration: number): Song => ({
    id: 'test-song-id',
    title: 'Test Song',
    artist: 'Test Artist',
    duration,
    filePath: '/path/to/song.mp3',
    format: 'mp3',
    hasCover: false,
  })

  describe('beginning mode', () => {
    it('returns 0 for beginning mode', () => {
      const song = createMockSong(180) // 3 minutes
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
    })

    it('returns 0 for beginning mode even with short songs', () => {
      const song = createMockSong(30) // 30 seconds
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
    })
  })

  describe('random mode', () => {
    it('returns a value between 10% and 50% of duration for normal songs', () => {
      const song = createMockSong(200) // 200 seconds
      const clipDuration = 20

      // Test multiple times due to randomness
      for (let i = 0; i < 100; i++) {
        const start = getStartPosition(song, 'random', clipDuration)
        const minExpected = song.duration * 0.1 // 20
        const maxExpected = Math.min(
          song.duration * 0.5,
          song.duration - clipDuration
        ) // 100 or 180 = 100

        expect(start).toBeGreaterThanOrEqual(minExpected)
        expect(start).toBeLessThanOrEqual(maxExpected)
      }
    })

    it('respects clip duration constraint (does not start too late)', () => {
      const song = createMockSong(100) // 100 seconds
      const clipDuration = 40

      // Test multiple times
      for (let i = 0; i < 100; i++) {
        const start = getStartPosition(song, 'random', clipDuration)
        // Should not exceed song.duration - clipDuration = 60
        expect(start + clipDuration).toBeLessThanOrEqual(song.duration)
      }
    })

    it('returns 0 for songs where safe range is invalid', () => {
      const song = createMockSong(50) // 50 seconds
      const clipDuration = 47

      // minStart = 5, safeMaxStart = min(25, 3) = 3, which is < minStart (5)
      // Should fall back to 0
      const start = getStartPosition(song, 'random', clipDuration)
      expect(start).toBe(0)
    })
  })

  describe('skip_intro mode', () => {
    it('skips first 30 seconds for long songs', () => {
      const song = createMockSong(300) // 5 minutes
      const clipDuration = 20

      const start = getStartPosition(song, 'skip_intro', clipDuration)
      expect(start).toBe(30)
    })

    it('skips 20% of duration for shorter songs', () => {
      const song = createMockSong(100) // 100 seconds, 20% = 20 seconds
      const clipDuration = 20

      const start = getStartPosition(song, 'skip_intro', clipDuration)
      expect(start).toBe(20)
    })

    it('respects clip duration constraint', () => {
      const song = createMockSong(80) // 80 seconds
      const clipDuration = 60

      // Skip would be min(30, 16) = 16, but safeStart = min(16, 20) = 16
      const start = getStartPosition(song, 'skip_intro', clipDuration)
      expect(start + clipDuration).toBeLessThanOrEqual(song.duration)
    })

    it('returns 0 if skip would leave no room for clip', () => {
      const song = createMockSong(40) // 40 seconds
      const clipDuration = 35

      // Skip would be min(30, 8) = 8, safeStart = min(8, 5) = 5
      // Should still work with 5 second skip
      const start = getStartPosition(song, 'skip_intro', clipDuration)
      expect(start + clipDuration).toBeLessThanOrEqual(song.duration)
    })
  })

  describe('short song handling', () => {
    it('returns 0 when song duration equals clip duration', () => {
      const song = createMockSong(20)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })

    it('returns 0 when song is shorter than clip duration', () => {
      const song = createMockSong(15)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })

    it('returns valid positions for very short songs (< 10 seconds)', () => {
      const song = createMockSong(8)
      const clipDuration = 5

      // For 8s song with 5s clip:
      // random: minStart=0.8, maxStart=4, safeMaxStart=min(4,3)=3 - valid range [0.8, 3]
      for (let i = 0; i < 10; i++) {
        const randomStart = getStartPosition(song, 'random', clipDuration)
        expect(randomStart + clipDuration).toBeLessThanOrEqual(song.duration)
      }

      // skip_intro: skipAmount=min(30,1.6)=1.6, safeStart=min(1.6,3)=1.6
      const skipStart = getStartPosition(song, 'skip_intro', clipDuration)
      expect(skipStart).toBeCloseTo(1.6, 1)
    })
  })

  describe('edge cases', () => {
    it('handles exact boundary conditions correctly', () => {
      const song = createMockSong(100)
      const clipDuration = 50

      // For random: minStart = 10, maxStart = 50, safeMaxStart = 50
      // Should produce values in [10, 50] range
      for (let i = 0; i < 50; i++) {
        const start = getStartPosition(song, 'random', clipDuration)
        expect(start).toBeGreaterThanOrEqual(10)
        expect(start).toBeLessThanOrEqual(50)
      }
    })

    it('returns 0 for unknown mode (default case)', () => {
      const song = createMockSong(180)
      // @ts-expect-error - Testing invalid mode
      expect(getStartPosition(song, 'invalid_mode', 20)).toBe(0)
    })

    it('handles 0 duration song gracefully', () => {
      const song = createMockSong(0)
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })

    it('ensures start + clipDuration never exceeds song duration', () => {
      // Test various combinations
      const testCases = [
        { duration: 60, clip: 20 },
        { duration: 120, clip: 30 },
        { duration: 180, clip: 45 },
        { duration: 240, clip: 60 },
        { duration: 45, clip: 40 },
      ]

      for (const { duration, clip } of testCases) {
        const song = createMockSong(duration)

        for (const mode of ['random', 'skip_intro'] as const) {
          for (let i = 0; i < 10; i++) {
            const start = getStartPosition(song, mode, clip)
            expect(start + clip).toBeLessThanOrEqual(duration)
          }
        }
      }
    })
  })
})
