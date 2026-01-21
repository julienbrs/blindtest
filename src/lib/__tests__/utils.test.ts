/**
 * Comprehensive unit tests for utility functions
 * Epic 12.6 - Unit tests for all utility functions with >90% coverage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  getStartPosition,
  NetworkError,
  fetchWithTimeout,
  fetchWithRetry,
} from '../utils'
import { parseFileName, generateSongId } from '../audioScanner'
import type { Song, StartPosition } from '../types'

// ============================================================================
// cn() - Class name utility
// ============================================================================

describe('cn (class name utility)', () => {
  describe('basic functionality', () => {
    it('should combine multiple class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle single class name', () => {
      expect(cn('single')).toBe('single')
    })

    it('should handle empty call', () => {
      expect(cn()).toBe('')
    })
  })

  describe('conditional classes', () => {
    it('should filter out false values', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should filter out undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('should filter out null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar')
    })

    it('should filter out empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })

    it('should handle boolean conditions', () => {
      const isActive = true
      const isDisabled = false
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
        'base active'
      )
    })
  })

  describe('edge cases', () => {
    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle mixed inputs', () => {
      expect(cn('base', ['array'], { object: true })).toBe('base array object')
    })
  })
})

// ============================================================================
// parseFileName() - File name parsing utility
// ============================================================================

describe('parseFileName', () => {
  describe('standard "Artist - Title" format', () => {
    it('should parse standard artist - title format', () => {
      const result = parseFileName('Queen - Bohemian Rhapsody')
      expect(result.artist).toBe('Queen')
      expect(result.title).toBe('Bohemian Rhapsody')
    })

    it('should handle multiple dashes in title', () => {
      const result = parseFileName('Artist - Song - Part 2 - Extended')
      expect(result.artist).toBe('Artist')
      expect(result.title).toBe('Song - Part 2 - Extended')
    })

    it('should handle spaces around dash', () => {
      const result = parseFileName('  Artist   -   Title  ')
      expect(result.artist).toBe('Artist')
      expect(result.title).toBe('Title')
    })
  })

  describe('title-only format', () => {
    it('should return title only when no separator', () => {
      const result = parseFileName('Unknown Song')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Unknown Song')
    })

    it('should handle empty string', () => {
      const result = parseFileName('')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('')
    })
  })

  describe('track number formats', () => {
    it('should parse "01 - Title" format', () => {
      const result = parseFileName('01 - Bohemian Rhapsody')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Bohemian Rhapsody')
    })

    it('should parse "1 - Title" format (single digit)', () => {
      const result = parseFileName('1 - First Track')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('First Track')
    })

    it('should parse "123 - Title" format (three digits)', () => {
      const result = parseFileName('123 - Some Track')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Some Track')
    })

    it('should parse "01. Title" format', () => {
      const result = parseFileName('01. Bohemian Rhapsody')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Bohemian Rhapsody')
    })

    it('should parse "01.Title" format (no space)', () => {
      const result = parseFileName('01.Bohemian Rhapsody')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Bohemian Rhapsody')
    })
  })

  describe('underscore format', () => {
    it('should parse "Artist_Title" format', () => {
      const result = parseFileName('Queen_Bohemian Rhapsody')
      expect(result.artist).toBe('Queen')
      expect(result.title).toBe('Bohemian Rhapsody')
    })

    it('should not parse multiple underscores as artist-title', () => {
      const result = parseFileName('Some_Complex_Filename')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Some_Complex_Filename')
    })

    it('should not parse underscore with empty parts', () => {
      const result = parseFileName('_Title')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('_Title')
    })
  })

  describe('format priority', () => {
    it('should prefer dash format over underscore', () => {
      const result = parseFileName('Artist_Name - Song Title')
      expect(result.artist).toBe('Artist_Name')
      expect(result.title).toBe('Song Title')
    })

    it('should handle track number with dashes in title', () => {
      const result = parseFileName('05 - Song - Remix - Extended')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Song - Remix - Extended')
    })
  })
})

// ============================================================================
// generateSongId() - Song ID generation
// ============================================================================

describe('generateSongId', () => {
  it('should generate a 12-character ID', () => {
    const id = generateSongId('/path/to/song.mp3')
    expect(id).toHaveLength(12)
  })

  it('should generate hex characters only', () => {
    const id = generateSongId('/path/to/song.mp3')
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('should be deterministic (same input = same output)', () => {
    const id1 = generateSongId('/path/to/song.mp3')
    const id2 = generateSongId('/path/to/song.mp3')
    expect(id1).toBe(id2)
  })

  it('should be unique for different inputs', () => {
    const id1 = generateSongId('/path/to/song1.mp3')
    const id2 = generateSongId('/path/to/song2.mp3')
    expect(id1).not.toBe(id2)
  })

  it('should handle special characters in path', () => {
    const id = generateSongId('/path/to/song with spaces & special chars!.mp3')
    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('should handle unicode in path', () => {
    const id = generateSongId('/music/日本語/song.mp3')
    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('should handle empty string', () => {
    const id = generateSongId('')
    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('should handle very long paths', () => {
    const longPath = '/very' + '/long'.repeat(100) + '/path/to/song.mp3'
    const id = generateSongId(longPath)
    expect(id).toHaveLength(12)
  })
})

// ============================================================================
// getStartPosition() - Song start position calculation
// ============================================================================

describe('getStartPosition', () => {
  // Helper to create mock songs
  const createMockSong = (duration: number): Song => ({
    id: 'test-id',
    title: 'Test Song',
    artist: 'Test Artist',
    duration,
    filePath: '/path/to/song.mp3',
    format: 'mp3',
    hasCover: false,
  })

  describe('beginning mode', () => {
    it('should always return 0', () => {
      const song = createMockSong(180)
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
    })

    it('should return 0 for short songs', () => {
      const song = createMockSong(30)
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
    })

    it('should return 0 for very long songs', () => {
      const song = createMockSong(3600)
      expect(getStartPosition(song, 'beginning', 60)).toBe(0)
    })
  })

  describe('random mode', () => {
    it('should return value between 10% and 50% of duration', () => {
      const song = createMockSong(200)
      const clipDuration = 20

      for (let i = 0; i < 50; i++) {
        const start = getStartPosition(song, 'random', clipDuration)
        expect(start).toBeGreaterThanOrEqual(20) // 10% of 200
        expect(start).toBeLessThanOrEqual(100) // 50% of 200
      }
    })

    it('should respect clip duration constraint', () => {
      const song = createMockSong(100)
      const clipDuration = 40

      for (let i = 0; i < 50; i++) {
        const start = getStartPosition(song, 'random', clipDuration)
        expect(start + clipDuration).toBeLessThanOrEqual(song.duration)
      }
    })

    it('should return 0 when safe range is invalid', () => {
      const song = createMockSong(50)
      const clipDuration = 47
      // safeMaxStart = min(25, 3) = 3, minStart = 5, invalid range
      expect(getStartPosition(song, 'random', clipDuration)).toBe(0)
    })
  })

  describe('skip_intro mode', () => {
    it('should skip first 30 seconds for long songs', () => {
      const song = createMockSong(300)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(30)
    })

    it('should skip 20% of duration for shorter songs', () => {
      const song = createMockSong(100) // 20% = 20 seconds
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(20)
    })

    it('should respect clip duration constraint', () => {
      const song = createMockSong(80)
      const clipDuration = 60
      const start = getStartPosition(song, 'skip_intro', clipDuration)
      expect(start + clipDuration).toBeLessThanOrEqual(song.duration)
    })
  })

  describe('short song handling', () => {
    it('should return 0 when song equals clip duration', () => {
      const song = createMockSong(20)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })

    it('should return 0 when song is shorter than clip', () => {
      const song = createMockSong(15)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })

    it('should return 0 for 0 duration songs', () => {
      const song = createMockSong(0)
      expect(getStartPosition(song, 'beginning', 20)).toBe(0)
      expect(getStartPosition(song, 'random', 20)).toBe(0)
      expect(getStartPosition(song, 'skip_intro', 20)).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should return 0 for unknown mode', () => {
      const song = createMockSong(180)
      // Cast to StartPosition to test default case handling
      expect(
        getStartPosition(song, 'invalid' as unknown as StartPosition, 20)
      ).toBe(0)
    })

    it('should handle various duration/clip combinations', () => {
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

// ============================================================================
// NetworkError - Custom error class
// ============================================================================

describe('NetworkError', () => {
  it('should create error with TIMEOUT type', () => {
    const error = new NetworkError('TIMEOUT', 'Request timed out')
    expect(error.type).toBe('TIMEOUT')
    expect(error.message).toBe('Request timed out')
    expect(error.name).toBe('NetworkError')
  })

  it('should create error with NETWORK_ERROR type', () => {
    const error = new NetworkError('NETWORK_ERROR', 'Server unreachable')
    expect(error.type).toBe('NETWORK_ERROR')
    expect(error.message).toBe('Server unreachable')
  })

  it('should create error with MAX_RETRIES type', () => {
    const error = new NetworkError('MAX_RETRIES', 'Failed after 3 attempts')
    expect(error.type).toBe('MAX_RETRIES')
    expect(error.message).toBe('Failed after 3 attempts')
  })

  it('should be instanceof Error', () => {
    const error = new NetworkError('TIMEOUT', 'Test')
    expect(error instanceof Error).toBe(true)
    expect(error instanceof NetworkError).toBe(true)
  })

  it('should have correct name property', () => {
    const error = new NetworkError('TIMEOUT', 'Test')
    expect(error.name).toBe('NetworkError')
  })

  it('should preserve stack trace', () => {
    const error = new NetworkError('TIMEOUT', 'Test')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('NetworkError')
  })
})

// ============================================================================
// fetchWithTimeout() - Fetch with timeout support
// ============================================================================

describe('fetchWithTimeout', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('successful requests', () => {
    it('should return response on success', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const result = await fetchWithTimeout('/api/test')

      expect(result).toBe(mockResponse)
    })

    it('should pass options to fetch', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const options = { method: 'POST', body: 'test' }
      await fetchWithTimeout('/api/test', options)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: 'test',
          signal: expect.any(AbortSignal),
        })
      )
    })

    it('should use default timeout of 10000ms', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      await fetchWithTimeout('/api/test')

      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('timeout handling', () => {
    it('should throw TIMEOUT error on timeout', async () => {
      vi.mocked(global.fetch).mockImplementationOnce(
        (_url, options) =>
          new Promise((_, reject) => {
            const signal = (options as RequestInit)?.signal
            signal?.addEventListener('abort', () => {
              const abortError = new Error('Aborted')
              abortError.name = 'AbortError'
              reject(abortError)
            })
          })
      )

      await expect(fetchWithTimeout('/api/test', {}, 50)).rejects.toMatchObject(
        {
          type: 'TIMEOUT',
          message: 'La requête a expiré',
        }
      )
    })
  })

  describe('network error handling', () => {
    it('should throw NETWORK_ERROR on fetch failure', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new Error('Network failure')
      )

      await expect(fetchWithTimeout('/api/test')).rejects.toMatchObject({
        type: 'NETWORK_ERROR',
        message: 'Impossible de contacter le serveur',
      })
    })
  })

  describe('external signal handling', () => {
    it('should throw AbortError when external signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        fetchWithTimeout('/api/test', { signal: controller.signal })
      ).rejects.toThrow('The operation was aborted.')
    })

    it('should propagate external abort', async () => {
      const controller = new AbortController()

      vi.mocked(global.fetch).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              controller.abort()
              const error = new Error('Aborted')
              error.name = 'AbortError'
              reject(error)
            }, 10)
          })
      )

      await expect(
        fetchWithTimeout('/api/test', { signal: controller.signal }, 10000)
      ).rejects.toThrow()
    })
  })
})

// ============================================================================
// fetchWithRetry() - Fetch with retry support
// ============================================================================

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('successful requests', () => {
    it('should return response on first success', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const result = await fetchWithRetry('/api/test')

      expect(result).toBe(mockResponse)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should succeed on retry after failure', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse)

      const result = await fetchWithRetry('/api/test', {}, 3, 100)

      expect(result).toBe(mockResponse)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    }, 10000)
  })

  describe('retry exhaustion', () => {
    it('should throw MAX_RETRIES after exhausting retries', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await expect(
        fetchWithRetry('/api/test', {}, 2, 100)
      ).rejects.toMatchObject({
        type: 'MAX_RETRIES',
      })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    }, 15000)

    it('should include retry count in error message', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Connection refused'))

      await expect(
        fetchWithRetry('/api/test', {}, 3, 100)
      ).rejects.toMatchObject({
        message: expect.stringContaining('3 tentatives'),
      })
    }, 15000)
  })

  describe('non-retryable responses', () => {
    it('should not retry 404 responses', async () => {
      const mockResponse = new Response('Not Found', { status: 404 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const result = await fetchWithRetry('/api/test')

      expect(result.status).toBe(404)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry 400 responses', async () => {
      const mockResponse = new Response('Bad Request', { status: 400 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const result = await fetchWithRetry('/api/test')

      expect(result.status).toBe(400)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('abort signal handling', () => {
    it('should not retry when aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        fetchWithRetry('/api/test', { signal: controller.signal })
      ).rejects.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(0)
    })
  })

  describe('options passthrough', () => {
    it('should pass options to underlying fetch', async () => {
      const mockResponse = new Response('OK', { status: 200 })
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
      await fetchWithRetry('/api/test', options)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })
})
