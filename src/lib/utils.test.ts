import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, fetchWithTimeout, fetchWithRetry, NetworkError } from './utils'

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
