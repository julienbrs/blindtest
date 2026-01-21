/**
 * API Routes Integration Tests
 *
 * This file provides centralized integration tests for the Songs API endpoints
 * as specified in Epic 12.2. It tests the core functionality with appropriate mocks.
 *
 * Additional comprehensive tests are available in:
 * - src/app/api/songs/route.test.ts (GET /api/songs with filters)
 * - src/app/api/songs/random/route.test.ts (random selection, distribution)
 * - src/app/api/songs/[id]/route.test.ts (ID validation, error handling)
 * - src/app/api/audio/[id]/route.test.ts (audio streaming, range requests)
 * - src/app/api/cover/[id]/route.test.ts (cover image serving)
 * - src/app/api/stats/route.test.ts (library statistics)
 * - src/app/api/songs/rescan/route.test.ts (cache refresh)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as GETSongs } from '../songs/route'
import { GET as GETRandom } from '../songs/random/route'
import { GET as GETSongById } from '../songs/[id]/route'
import { NextRequest } from 'next/server'
import type { Song } from '@/lib/types'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(() =>
    Promise.resolve([
      {
        id: 'abc123def456',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        year: 2020,
        duration: 180,
        filePath: '/music/test.mp3',
        format: 'mp3',
        hasCover: true,
      },
      {
        id: 'def456ghi789',
        title: 'Another Song',
        artist: 'Another Artist',
        album: 'Another Album',
        year: 2021,
        duration: 240,
        filePath: '/music/another.mp3',
        format: 'mp3',
        hasCover: false,
      },
    ])
  ),
}))

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}))

describe('API /api/songs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET devrait retourner la liste des chansons', async () => {
    const request = new NextRequest('http://localhost/api/songs')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.total).toBe(2)
  })

  it('GET devrait retourner les métadonnées complètes', async () => {
    const request = new NextRequest('http://localhost/api/songs')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const song = data.songs[0]
    expect(song.id).toBe('abc123def456')
    expect(song.title).toBe('Test Song')
    expect(song.artist).toBe('Test Artist')
    expect(song.album).toBe('Test Album')
    expect(song.year).toBe(2020)
    expect(song.duration).toBe(180)
    expect(song.format).toBe('mp3')
    expect(song.hasCover).toBe(true)
  })

  it('GET devrait retourner totalInLibrary', async () => {
    const request = new NextRequest('http://localhost/api/songs')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalInLibrary).toBe(2)
  })
})

describe('API /api/songs/random', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET devrait retourner une chanson aléatoire', async () => {
    const request = new NextRequest('http://localhost/api/songs/random')
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toBeDefined()
    expect(['abc123def456', 'def456ghi789']).toContain(data.song.id)
  })

  it('GET avec exclude devrait filtrer les chansons', async () => {
    const request = new NextRequest(
      'http://localhost/api/songs/random?exclude=abc123def456'
    )
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.id).toBe('def456ghi789')
  })

  it('GET avec exclude multiple devrait filtrer plusieurs chansons', async () => {
    const request = new NextRequest(
      'http://localhost/api/songs/random?exclude=abc123def456,def456ghi789'
    )
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Toutes les chansons ont été jouées')
  })

  it('GET avec include devrait limiter aux chansons spécifiées', async () => {
    const request = new NextRequest(
      'http://localhost/api/songs/random?include=abc123def456'
    )
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.id).toBe('abc123def456')
  })

  it('GET avec artists devrait filtrer par artiste', async () => {
    const request = new NextRequest(
      'http://localhost/api/songs/random?artists=Test%20Artist'
    )
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.artist).toBe('Test Artist')
  })
})

describe('API /api/songs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET devrait retourner une chanson par ID', async () => {
    const request = new NextRequest('http://localhost/api/songs/abc123def456')
    const response = await GETSongById(request, {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toBeDefined()
    expect(data.song.id).toBe('abc123def456')
    expect(data.song.title).toBe('Test Song')
  })

  it('GET devrait retourner 404 pour ID inconnu', async () => {
    const request = new NextRequest('http://localhost/api/songs/999999999999')
    const response = await GETSongById(request, {
      params: Promise.resolve({ id: '999999999999' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Chanson non trouvée')
  })

  it('GET devrait retourner 400 pour ID invalide', async () => {
    const request = new NextRequest('http://localhost/api/songs/invalid')
    const response = await GETSongById(request, {
      params: Promise.resolve({ id: 'invalid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })
})

describe('API Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('/api/songs devrait retourner 404 pour bibliothèque vide', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost/api/songs')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('EMPTY_LIBRARY')
    expect(data.message).toBe('Aucune chanson trouvée')
  })

  it('/api/songs/random devrait retourner 404 pour bibliothèque vide', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost/api/songs/random')
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Aucune chanson disponible')
  })

  it('/api/songs devrait retourner 500 pour erreur serveur', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockRejectedValueOnce(new Error('Server error'))

    const request = new NextRequest('http://localhost/api/songs')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors du chargement des chansons')
  })

  it('/api/songs/random devrait retourner 500 pour erreur serveur', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockRejectedValueOnce(new Error('Server error'))

    const request = new NextRequest('http://localhost/api/songs/random')
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors de la sélection aléatoire')
  })

  it('/api/songs/[id] devrait retourner 500 pour erreur serveur', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockRejectedValueOnce(new Error('Server error'))

    const request = new NextRequest('http://localhost/api/songs/abc123def456')
    const response = await GETSongById(request, {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur serveur')
  })
})

describe('API Filter Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSongsWithYears: Song[] = [
    {
      id: 'abc123def456',
      title: 'Old Song',
      artist: 'Test Artist',
      year: 1990,
      duration: 180,
      filePath: '/music/old.mp3',
      format: 'mp3',
      hasCover: false,
    },
    {
      id: 'def456ghi789',
      title: 'New Song',
      artist: 'Test Artist',
      year: 2020,
      duration: 240,
      filePath: '/music/new.mp3',
      format: 'mp3',
      hasCover: false,
    },
    {
      id: 'ghi789jkl012',
      title: 'Another New Song',
      artist: 'Different Artist',
      year: 2022,
      duration: 200,
      filePath: '/music/another-new.mp3',
      format: 'mp3',
      hasCover: true,
    },
  ]

  it('/api/songs devrait filtrer par artiste', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce(mockSongsWithYears)

    const request = new NextRequest(
      'http://localhost/api/songs?artists=Test%20Artist'
    )
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.songs.every((s: Song) => s.artist === 'Test Artist')).toBe(true)
    expect(data.totalInLibrary).toBe(3)
  })

  it('/api/songs devrait filtrer par année minimum', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce(mockSongsWithYears)

    const request = new NextRequest('http://localhost/api/songs?yearMin=2000')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.songs.every((s: Song) => s.year && s.year >= 2000)).toBe(true)
  })

  it('/api/songs devrait filtrer par année maximum', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce(mockSongsWithYears)

    const request = new NextRequest('http://localhost/api/songs?yearMax=2000')
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(1)
    expect(data.songs[0].year).toBe(1990)
  })

  it('/api/songs devrait combiner les filtres artiste et année', async () => {
    const { getSongsCache } = await import('@/lib/audioScanner')
    vi.mocked(getSongsCache).mockResolvedValueOnce(mockSongsWithYears)

    const request = new NextRequest(
      'http://localhost/api/songs?artists=Test%20Artist&yearMin=2000'
    )
    const response = await GETSongs(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(1)
    expect(data.songs[0].title).toBe('New Song')
  })
})
