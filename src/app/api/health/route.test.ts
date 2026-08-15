import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import * as audioScanner from '@/lib/audioScanner'

vi.mock('@/lib/audioScanner', () => ({
  getAudioFolderPath: vi.fn(),
  scanAudioFolder: vi.fn(),
  getSongsCache: vi.fn(),
  getCacheInfo: vi.fn(),
}))

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(audioScanner.getCacheInfo).mockReturnValue({
      count: 1,
      lastScan: 123,
    })
  })

  it('retourne 503 si la bibliothèque n’est pas configurée', async () => {
    vi.mocked(audioScanner.getAudioFolderPath).mockReturnValue(null)

    const response = await GET()
    expect(response.status).toBe(503)
  })

  it('retourne 503 si le montage est vide ou illisible', async () => {
    vi.mocked(audioScanner.getAudioFolderPath).mockReturnValue('/music')
    vi.mocked(audioScanner.scanAudioFolder).mockResolvedValue([])

    const response = await GET()
    expect(response.status).toBe(503)
    expect(audioScanner.getSongsCache).not.toHaveBeenCalled()
  })

  it('initialise le cache et retourne le nombre de fichiers en bonne santé', async () => {
    vi.mocked(audioScanner.getAudioFolderPath).mockReturnValue('/music')
    vi.mocked(audioScanner.scanAudioFolder).mockResolvedValue(['/music/a.mp3'])
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
      {
        id: 'song',
        title: 'Song',
        artist: 'Artist',
        duration: 1,
        filePath: '/music/a.mp3',
        format: 'mp3',
        hasCover: false,
      },
    ])

    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.library).toMatchObject({ songsCount: 1, audioFilesCount: 1 })
  })
})
