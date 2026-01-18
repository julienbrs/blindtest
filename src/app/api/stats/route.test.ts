import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
  getCacheInfo: vi.fn(),
}))

import { getSongsCache, getCacheInfo } from '@/lib/audioScanner'

const mockGetSongsCache = vi.mocked(getSongsCache)
const mockGetCacheInfo = vi.mocked(getCacheInfo)

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return EMPTY_LIBRARY error for an empty library', async () => {
    mockGetSongsCache.mockResolvedValue([])
    mockGetCacheInfo.mockReturnValue({
      count: 0,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('EMPTY_LIBRARY')
    expect(data.message).toBe('Aucune chanson trouvée')
    expect(data.audioFolderPath).toBeDefined()
  })

  it('should return correct stats for a library with songs', async () => {
    mockGetSongsCache.mockResolvedValue([
      {
        id: 'abc123def456',
        title: 'Song 1',
        artist: 'Artist A',
        album: 'Album 1',
        year: 2020,
        duration: 180,
        format: 'mp3',
        hasCover: true,
        filePath: '/test/song1.mp3',
      },
      {
        id: 'def456ghi789',
        title: 'Song 2',
        artist: 'Artist A',
        album: 'Album 1',
        year: 2020,
        duration: 240,
        format: 'mp3',
        hasCover: true,
        filePath: '/test/song2.mp3',
      },
      {
        id: 'ghi789jkl012',
        title: 'Song 3',
        artist: 'Artist B',
        album: 'Album 2',
        year: 2021,
        duration: 300,
        format: 'flac',
        hasCover: false,
        filePath: '/test/song3.flac',
      },
    ])
    mockGetCacheInfo.mockReturnValue({
      count: 3,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalSongs).toBe(3)
    expect(data.totalArtists).toBe(2) // Artist A, Artist B
    expect(data.totalAlbums).toBe(2) // Album 1, Album 2
    expect(data.totalDuration).toBe(720) // 180 + 240 + 300
    expect(data.formats).toEqual({ mp3: 2, flac: 1 })
    expect(data.songsWithCover).toBe(2)
    expect(data.lastScan).toBe(1705487200000)
  })

  it('should format duration correctly', async () => {
    mockGetSongsCache.mockResolvedValue([
      {
        id: 'abc123def456',
        title: 'Song 1',
        artist: 'Artist A',
        album: undefined,
        year: undefined,
        duration: 7325, // 2 hours, 2 minutes, 5 seconds
        format: 'mp3',
        hasCover: false,
        filePath: '/test/song1.mp3',
      },
    ])
    mockGetCacheInfo.mockReturnValue({
      count: 1,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(data.totalDurationFormatted).toBe('2h 2min')
  })

  it('should handle songs without album metadata', async () => {
    mockGetSongsCache.mockResolvedValue([
      {
        id: 'abc123def456',
        title: 'Song 1',
        artist: 'Artist A',
        album: undefined,
        year: undefined,
        duration: 180,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/song1.mp3',
      },
      {
        id: 'def456ghi789',
        title: 'Song 2',
        artist: 'Artist B',
        album: 'Album 1',
        year: 2021,
        duration: 240,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/song2.mp3',
      },
    ])
    mockGetCacheInfo.mockReturnValue({
      count: 2,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(data.totalSongs).toBe(2)
    expect(data.totalArtists).toBe(2)
    expect(data.totalAlbums).toBe(1) // Only Album 1, undefined is filtered out
  })

  it('should count formats correctly with multiple format types', async () => {
    mockGetSongsCache.mockResolvedValue([
      {
        id: 'a1',
        title: 'Song 1',
        artist: 'A',
        album: undefined,
        year: undefined,
        duration: 100,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/1.mp3',
      },
      {
        id: 'a2',
        title: 'Song 2',
        artist: 'A',
        album: undefined,
        year: undefined,
        duration: 100,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/2.mp3',
      },
      {
        id: 'a3',
        title: 'Song 3',
        artist: 'A',
        album: undefined,
        year: undefined,
        duration: 100,
        format: 'flac',
        hasCover: false,
        filePath: '/test/3.flac',
      },
      {
        id: 'a4',
        title: 'Song 4',
        artist: 'A',
        album: undefined,
        year: undefined,
        duration: 100,
        format: 'ogg',
        hasCover: false,
        filePath: '/test/4.ogg',
      },
      {
        id: 'a5',
        title: 'Song 5',
        artist: 'A',
        album: undefined,
        year: undefined,
        duration: 100,
        format: 'm4a',
        hasCover: false,
        filePath: '/test/5.m4a',
      },
    ])
    mockGetCacheInfo.mockReturnValue({
      count: 5,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(data.formats).toEqual({ mp3: 2, flac: 1, ogg: 1, m4a: 1 })
  })

  it('should return 500 when getSongsCache throws an error', async () => {
    mockGetSongsCache.mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur stats')
  })

  it('should round total duration to nearest integer', async () => {
    mockGetSongsCache.mockResolvedValue([
      {
        id: 'abc123def456',
        title: 'Song 1',
        artist: 'Artist A',
        album: undefined,
        year: undefined,
        duration: 180.7,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/song1.mp3',
      },
      {
        id: 'def456ghi789',
        title: 'Song 2',
        artist: 'Artist B',
        album: undefined,
        year: undefined,
        duration: 240.3,
        format: 'mp3',
        hasCover: false,
        filePath: '/test/song2.mp3',
      },
    ])
    mockGetCacheInfo.mockReturnValue({
      count: 2,
      lastScan: 1705487200000,
    })

    const response = await GET()
    const data = await response.json()

    expect(data.totalDuration).toBe(421) // Math.round(421.0)
  })
})
