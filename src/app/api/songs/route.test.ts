import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import type { Song } from '@/lib/types'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

describe('GET /api/songs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty list when no songs in cache', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      songs: [],
      total: 0,
    })
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

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.total).toBe(2)
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

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs[0]).toEqual(mockSong)
  })

  it('returns error 500 when getSongsCache fails', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('Scan failed')
    )

    const response = await GET()
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

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs[0].album).toBeUndefined()
    expect(data.songs[0].year).toBeUndefined()
    expect(data.total).toBe(1)
  })
})
