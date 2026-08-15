import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { Song } from '@/lib/types'

vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
  getVideoSidecarPath: vi.fn((filePath: string) =>
    filePath.replace(/\.[^.]+$/, '.mp4')
  ),
}))

import * as audioScanner from '@/lib/audioScanner'
import { GET, HEAD } from './route'

const testDir = join(tmpdir(), 'blindtest-video-test')
const audioFilePath = join(testDir, 'test.mp3')
const videoFilePath = join(testDir, 'test.mp4')
const videoContent = Buffer.alloc(2048)
for (let index = 0; index < videoContent.length; index += 1) {
  videoContent[index] = index % 256
}

if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true })
writeFileSync(audioFilePath, 'audio')
writeFileSync(videoFilePath, videoContent)

afterAll(() => {
  if (existsSync(testDir)) rmSync(testDir, { recursive: true })
})

const song: Song = {
  id: 'abc123def456',
  title: 'Test song',
  artist: 'Test artist',
  duration: 120,
  filePath: audioFilePath,
  format: 'mp3',
  hasCover: true,
  hasVideo: true,
}

function request(range?: string, method = 'GET') {
  const headers = range ? { range } : undefined
  return new NextRequest('http://localhost:3000/api/video/abc123def456', {
    method,
    headers,
  })
}

describe('GET /api/video/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([song])
  })

  it('streams the complete MP4 with seek headers', async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('video/mp4')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect(response.headers.get('Content-Length')).toBe('2048')
    expect((await response.arrayBuffer()).byteLength).toBe(2048)
  })

  it('returns a byte range for browser seeking', async () => {
    const response = await GET(request('bytes=100-299'), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 100-299/2048')
    expect(response.headers.get('Content-Length')).toBe('200')
    const bytes = new Uint8Array(await response.arrayBuffer())
    expect(bytes).toHaveLength(200)
    expect(bytes[0]).toBe(100)
  })

  it('supports an open-ended range', async () => {
    const response = await GET(request('bytes=1024-'), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 1024-2047/2048')
    expect(response.headers.get('Content-Length')).toBe('1024')
  })

  it('supports a suffix range used by media players', async () => {
    const response = await GET(request('bytes=-128'), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 1920-2047/2048')
    expect(response.headers.get('Content-Length')).toBe('128')
    expect((await response.arrayBuffer()).byteLength).toBe(128)
  })

  it('clamps an oversized end byte to the end of the file', async () => {
    const response = await GET(request('bytes=2000-9999'), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 2000-2047/2048')
    expect(response.headers.get('Content-Length')).toBe('48')
  })

  it('returns 416 for malformed or out-of-bounds ranges', async () => {
    for (const range of ['items=0-10', 'bytes=10-1', 'bytes=2048-']) {
      const response = await GET(request(range), {
        params: Promise.resolve({ id: song.id }),
      })
      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe('bytes */2048')
    }
  })

  it('returns 400 for an invalid song ID', async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ id: 'invalid' }),
    })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe("Format d'ID invalide")
  })

  it('returns 404 when the song does not exist', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([])

    const response = await GET(request(), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(404)
    expect((await response.json()).error).toBe('Chanson non trouvée')
  })

  it('returns 404 when the sidecar does not exist', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
      { ...song, filePath: join(testDir, 'missing.mp3'), hasVideo: false },
    ])

    const response = await GET(request(), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(404)
    expect((await response.json()).error).toBe('VIDEO_NOT_FOUND')
    consoleSpy.mockRestore()
  })

  it('returns 500 when the song cache fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(audioScanner.getSongsCache).mockRejectedValue(
      new Error('cache unavailable')
    )

    const response = await GET(request(), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe('Erreur streaming vidéo')
    consoleSpy.mockRestore()
  })
})

describe('HEAD /api/video/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([song])
  })

  it('returns metadata without a response body', async () => {
    const response = await HEAD(request(undefined, 'HEAD'), {
      params: Promise.resolve({ id: song.id }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('video/mp4')
    expect(response.headers.get('Content-Length')).toBe('2048')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect(await response.text()).toBe('')
  })
})
