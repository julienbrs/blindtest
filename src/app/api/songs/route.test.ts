import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import type { Song } from '@/lib/types'
import { NextRequest } from 'next/server'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}))

// Helper to create a NextRequest with URL params
function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/songs')
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url)
}

describe('GET /api/songs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns EMPTY_LIBRARY error when no songs in cache', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('EMPTY_LIBRARY')
    expect(data.message).toBe('Aucune chanson trouvée')
    expect(data.audioFolderPath).toBeDefined()
  })

  it('returns the list of songs with total count', async () => {
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
    ]

    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.total).toBe(2)
    expect(data.totalInLibrary).toBe(2)
    expect(data.songs[0].title).toBe('Bohemian Rhapsody')
    expect(data.songs[1].title).toBe('Stairway to Heaven')
  })

  it('returns all song metadata fields', async () => {
    const mockSong: Song = {
      id: 'test123id456',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      year: 2020,
      duration: 180,
      filePath: '/music/test.mp3',
      format: 'mp3',
      hasCover: true,
    }

    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs[0]).toEqual(mockSong)
  })

  it('returns error 500 when getSongsCache fails', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('Scan failed')
    )

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors du chargement des chansons')
  })

  it('handles songs without optional fields', async () => {
    const mockSong: Song = {
      id: 'minimal12id34',
      title: 'Unknown Track',
      artist: 'Unknown Artist',
      duration: 200,
      filePath: '/music/unknown.mp3',
      format: 'mp3',
      hasCover: false,
    }

    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs[0].album).toBeUndefined()
    expect(data.songs[0].year).toBeUndefined()
    expect(data.total).toBe(1)
  })
})

describe('GET /api/songs with filters', () => {
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
      title: 'Dancing Queen',
      artist: 'ABBA',
      album: 'Arrival',
      year: 1976,
      duration: 232,
      filePath: '/music/abba/dancing-queen.mp3',
      format: 'mp3',
      hasCover: true,
    },
    {
      id: 'jkl012mno345',
      title: 'We Will Rock You',
      artist: 'Queen',
      album: 'News of the World',
      year: 1977,
      duration: 122,
      filePath: '/music/queen/rock-you.mp3',
      format: 'mp3',
      hasCover: true,
    },
  ]

  it('filters by single artist', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ artists: 'Queen' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.total).toBe(2)
    expect(data.totalInLibrary).toBe(4)
    expect(data.songs.every((s: Song) => s.artist === 'Queen')).toBe(true)
  })

  it('filters by multiple artists', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ artists: 'Queen,ABBA' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(3)
    expect(data.total).toBe(3)
    expect(data.totalInLibrary).toBe(4)
  })

  it('filters by year minimum', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ yearMin: '1976' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.songs.every((s: Song) => s.year && s.year >= 1976)).toBe(true)
  })

  it('filters by year maximum', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ yearMax: '1975' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.songs.every((s: Song) => s.year && s.year <= 1975)).toBe(true)
  })

  it('filters by year range', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(
      createRequest({ yearMin: '1975', yearMax: '1976' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(
      data.songs.every((s: Song) => s.year && s.year >= 1975 && s.year <= 1976)
    ).toBe(true)
  })

  it('combines artist and year filters', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(
      createRequest({ artists: 'Queen', yearMin: '1976' })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(1)
    expect(data.songs[0].title).toBe('We Will Rock You')
  })

  it('returns empty array when no songs match filters', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(mockSongs)

    const response = await GET(createRequest({ artists: 'Unknown Artist' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.totalInLibrary).toBe(4)
  })

  it('excludes songs without year when year filter is applied', async () => {
    const songsWithMissingYear: Song[] = [
      ...mockSongs,
      {
        id: 'noyear12345',
        title: 'No Year Song',
        artist: 'Unknown',
        duration: 200,
        filePath: '/music/unknown.mp3',
        format: 'mp3',
        hasCover: false,
      },
    ]
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(
      songsWithMissingYear
    )

    const response = await GET(createRequest({ yearMin: '1970' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs.every((s: Song) => s.year !== undefined)).toBe(true)
  })
})
