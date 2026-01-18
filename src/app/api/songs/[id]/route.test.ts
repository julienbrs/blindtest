import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import type { Song } from '@/lib/types'
import { NextRequest } from 'next/server'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

describe('GET /api/songs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/songs/abc123def456')
  }

  const mockSong: Song = {
    id: 'abc123def456',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    year: 1975,
    duration: 354,
    filePath: '/music/queen/bohemian.mp3',
    format: 'mp3',
    hasCover: true,
  }

  it('returns the song when found', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toEqual(mockSong)
  })

  it('returns 404 when song not found', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: '111111111111' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Chanson non trouvée')
  })

  it('returns 400 for invalid ID format (too short)', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })

  it('returns 400 for invalid ID format (too long)', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123def456789' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })

  it('returns 400 for invalid ID format (non-hex characters)', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'xyz123ghijkl' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })

  it('returns 500 when getSongsCache fails', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('Cache error')
    )

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur serveur')
  })

  it('returns song with all optional fields', async () => {
    const fullSong: Song = {
      id: 'f11a2b3c4d5e',
      title: 'Complete Song',
      artist: 'Complete Artist',
      album: 'Complete Album',
      year: 2023,
      duration: 240,
      filePath: '/music/complete.mp3',
      format: 'mp3',
      hasCover: true,
    }

    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([fullSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'f11a2b3c4d5e' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.album).toBe('Complete Album')
    expect(data.song.year).toBe(2023)
  })

  it('returns song without optional fields', async () => {
    const minimalSong: Song = {
      id: 'a1b2c3d4e5f6',
      title: 'Minimal Song',
      artist: 'Unknown',
      duration: 180,
      filePath: '/music/minimal.mp3',
      format: 'mp3',
      hasCover: false,
    }

    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([minimalSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'a1b2c3d4e5f6' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song.album).toBeUndefined()
    expect(data.song.year).toBeUndefined()
  })
})
