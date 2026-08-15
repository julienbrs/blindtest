import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'
import * as playlistScanner from '@/lib/playlistScanner'

vi.mock('@/lib/audioScanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/audioScanner')>()
  return { ...actual, getSongsCache: vi.fn() }
})

vi.mock('@/lib/playlistScanner', () => ({
  getPlaylistCatalog: vi.fn(),
}))

describe('GET /api/playlists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne uniquement les résumés publics du catalogue', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])
    vi.mocked(playlistScanner.getPlaylistCatalog).mockResolvedValue([
      {
        id: 'm3u_party',
        name: 'Party',
        relativePath: 'admin/party.m3u',
        songIds: ['one', 'two'],
        songCount: 2,
        missingSongCount: 1,
      },
    ])

    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      playlists: [
        {
          id: 'm3u_party',
          name: 'Party',
          songCount: 2,
          missingSongCount: 1,
        },
      ],
    })
  })

  it('retourne 503 lorsque la bibliothèque audio est indisponible', async () => {
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new audioScanner.AudioPathError('Absent', 'PATH_NOT_FOUND', '/music')
    )

    const response = await GET()
    expect(response.status).toBe(503)
  })
})
