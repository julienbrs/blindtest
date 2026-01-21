import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import type { Song } from '@/lib/types'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}))

// Mock the audio scanner
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

const mockSong = (id: string, artist: string): Song => ({
  id,
  title: `Song ${id}`,
  artist,
  duration: 180,
  filePath: `/music/${artist}/${id}.mp3`,
  format: 'mp3',
  hasCover: false,
})

describe('GET /api/artists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty array when no songs exist', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(data.artists).toEqual([])
    expect(data.total).toBe(0)
  })

  it('returns unique artists sorted alphabetically', async () => {
    const songs = [
      mockSong('1', 'ABBA'),
      mockSong('2', 'Queen'),
      mockSong('3', 'Beatles'),
      mockSong('4', 'ABBA'), // Duplicate
      mockSong('5', 'Queen'), // Duplicate
    ]
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(songs)

    const response = await GET()
    const data = await response.json()

    expect(data.artists).toEqual(['ABBA', 'Beatles', 'Queen'])
    expect(data.total).toBe(3)
  })

  it('sorts artists case-insensitively', async () => {
    const songs = [
      mockSong('1', 'abba'),
      mockSong('2', 'ABBA'),
      mockSong('3', 'Abba'),
      mockSong('4', 'Zorro'),
    ]
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(songs)

    const response = await GET()
    const data = await response.json()

    // Should have 4 unique artists (case-sensitive) sorted case-insensitively
    expect(data.artists.length).toBe(4)
    expect(data.total).toBe(4)
  })

  it('handles songs with many unique artists', async () => {
    const artists = ['Artist A', 'Artist B', 'Artist C', 'Artist D', 'Artist E']
    const songs = artists.map((artist, i) => mockSong(String(i), artist))
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue(songs)

    const response = await GET()
    const data = await response.json()

    expect(data.artists).toEqual(artists) // Already sorted alphabetically
    expect(data.total).toBe(5)
  })

  it('returns 500 on error', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('Database error')
    )

    const response = await GET()

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Erreur lors du chargement des artistes')
  })
})
