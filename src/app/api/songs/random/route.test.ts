import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import * as playlistScanner from '@/lib/playlistScanner'
import type { Song } from '@/lib/types'
import { NextRequest } from 'next/server'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

vi.mock('@/lib/playlistScanner', () => ({
  getPlaylistById: vi.fn(),
}))

// Helper to create a NextRequest with optional query params
function createRequest(queryParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/songs/random')
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return new NextRequest(url)
}

describe('GET /api/songs/random', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSongs: Song[] = [
    {
      id: 'abc123def456',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      year: 1975,
      duration: 354,
      filePath: '/music/queen/bohemian.mp3',
      format: 'mp3',
      hasCover: true,
    },
    {
      id: 'xyz789abc123',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      album: 'Led Zeppelin IV',
      year: 1971,
      duration: 482,
      filePath: '/music/led-zeppelin/stairway.mp3',
      format: 'mp3',
      hasCover: false,
    },
    {
      id: 'def456ghi789',
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      year: 1977,
      duration: 390,
      filePath: '/music/eagles/hotel.mp3',
      format: 'mp3',
      hasCover: true,
    },
  ]

  it('returns a random song from the cache', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toBeDefined()
    expect(mockSongs.some((s) => s.id === data.song.id)).toBe(true)
  })

  it('returns 404 when no songs in cache', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Aucune chanson disponible')
  })

  it('excludes songs specified in the exclude parameter', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    // Exclude all but one song
    const response = await GET(
      createRequest({ exclude: 'abc123def456,xyz789abc123' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.id).toBe('def456ghi789')
    expect(data.song.title).toBe('Hotel California')
  })

  it('returns a distinct exhausted-selection error when all songs are excluded', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    // Exclude all songs
    const response = await GET(
      createRequest({ exclude: 'abc123def456,xyz789abc123,def456ghi789' })
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.code).toBe('SELECTION_EXHAUSTED')
  })

  it('handles empty exclude parameter', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ exclude: '' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toBeDefined()
  })

  it('limits selection to the server-side playlist and still applies exclusions', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)
    vi.mocked(playlistScanner.getPlaylistById).mockResolvedValue({
      id: 'm3u_test',
      name: 'Test',
      relativePath: 'test.m3u',
      songIds: ['abc123def456', 'def456ghi789'],
      songCount: 2,
      missingSongCount: 1,
    })

    const response = await GET(
      createRequest({
        playlist: 'm3u_test',
        exclude: 'abc123def456',
        artists: 'Led Zeppelin',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.id).toBe('def456ghi789')
  })

  it('returns PLAYLIST_NOT_FOUND for an unknown playlist', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)
    vi.mocked(playlistScanner.getPlaylistById).mockResolvedValue(null)

    const response = await GET(createRequest({ playlist: 'unknown' }))
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({
      code: 'PLAYLIST_NOT_FOUND',
    })
  })

  it('returns PLAYLIST_EMPTY for a playlist without valid songs', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)
    vi.mocked(playlistScanner.getPlaylistById).mockResolvedValue({
      id: 'empty',
      name: 'Empty',
      relativePath: 'empty.m3u',
      songIds: [],
      songCount: 0,
      missingSongCount: 2,
    })

    const response = await GET(createRequest({ playlist: 'empty' }))
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ code: 'PLAYLIST_EMPTY' })
  })

  it('returns SELECTION_EXHAUSTED when every playlist song is excluded', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)
    vi.mocked(playlistScanner.getPlaylistById).mockResolvedValue({
      id: 'short',
      name: 'Short',
      relativePath: 'short.m3u',
      songIds: ['abc123def456'],
      songCount: 1,
      missingSongCount: 0,
    })

    const response = await GET(
      createRequest({ playlist: 'short', exclude: 'abc123def456' })
    )
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      code: 'SELECTION_EXHAUSTED',
    })
  })

  it('returns complete song metadata', async () => {
    const singleSong: Song[] = [mockSongs[0]]
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(singleSong)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toEqual(mockSongs[0])
    expect(data.song.id).toBe('abc123def456')
    expect(data.song.title).toBe('Bohemian Rhapsody')
    expect(data.song.artist).toBe('Queen')
    expect(data.song.album).toBe('A Night at the Opera')
    expect(data.song.year).toBe(1975)
    expect(data.song.duration).toBe(354)
    expect(data.song.format).toBe('mp3')
    expect(data.song.hasCover).toBe(true)
  })

  it('returns error 500 when getSongsCache fails', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('Cache error')
    )

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors de la sélection aléatoire')
  })

  it('provides uniform distribution (statistical test)', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    // Run multiple times and count selections
    const counts: Record<string, number> = {}
    const iterations = 300

    for (let i = 0; i < iterations; i++) {
      const response = await GET(createRequest())
      const data = await response.json()
      counts[data.song.id] = (counts[data.song.id] || 0) + 1
    }

    // Each song should be selected approximately 100 times (1/3 of 300)
    // Allow a generous margin for randomness (40-160 range)
    Object.values(counts).forEach((count) => {
      expect(count).toBeGreaterThan(40)
      expect(count).toBeLessThan(160)
    })

    // All songs should be selected at least once
    expect(Object.keys(counts)).toHaveLength(3)
  })
})
