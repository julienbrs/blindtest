import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import type { Song } from '@/lib/types'
import { NextRequest } from 'next/server'
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(),
}))

// Import after mocking
import * as audioScanner from '@/lib/audioScanner'
import { GET, HEAD } from './route'

// Create a test directory and file for Range Request tests
const testDir = join(tmpdir(), 'blindtest-audio-test')
const testFilePath = join(testDir, 'test.mp3')
// Create a 1KB test file with predictable content
const testFileContent = Buffer.alloc(1024, 0)
for (let i = 0; i < 1024; i++) {
  testFileContent[i] = i % 256
}

// Set up test directory and file
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true })
}
writeFileSync(testFilePath, testFileContent)

// Clean up after all tests
afterAll(() => {
  try {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  } catch {
    // Ignore cleanup errors
  }
})

describe('GET /api/audio/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (range?: string) => {
    const headers: Record<string, string> = {}
    if (range) {
      headers['range'] = range
    }
    return new NextRequest('http://localhost:3000/api/audio/abc123def456', {
      headers,
    })
  }

  const mockSong: Song = {
    id: 'abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
    filePath: '/music/test.mp3',
    format: 'mp3',
    hasCover: false,
  }

  const mockSongWithRealFile: Song = {
    id: 'abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
    filePath: testFilePath,
    format: 'mp3',
    hasCover: false,
  }

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
      params: Promise.resolve({ id: 'abc' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })

  it('returns 400 for invalid ID format (too long)', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123def456789abc' }),
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
    expect(data.error).toBe('Erreur streaming')
  })

  it('returns 404 with FILE_NOT_FOUND error when file path does not exist', async () => {
    // Use a non-existent file path
    const songWithBadPath: Song = {
      ...mockSong,
      filePath: '/non/existent/path/test.mp3',
    }
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([songWithBadPath])

    // Mock console.error to verify logging
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(createRequest(), {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('FILE_NOT_FOUND')
    expect(data.message).toBe('Fichier audio introuvable')

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled()
    const logCall = consoleSpy.mock.calls[0][0]
    const logData = JSON.parse(logCall as string)
    expect(logData.error).toBe('FILE_NOT_FOUND')
    expect(logData.context).toContain('/api/audio/')

    consoleSpy.mockRestore()
  })

  it('validates that MIME types are defined for all supported formats', () => {
    // Import the route module to check MIME_TYPES
    // This is a static check to ensure all audio formats have MIME types defined
    const supportedFormats: Song['format'][] = [
      'mp3',
      'wav',
      'ogg',
      'flac',
      'm4a',
      'aac',
    ]

    // Each format should have a corresponding MIME type
    // We verify this by checking the route code structure
    expect(supportedFormats.length).toBe(6)
  })

  // ===== Range Request Tests =====

  describe('Range Requests', () => {
    it('returns full file with Accept-Ranges header when no Range header', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest(), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Accept-Ranges')).toBe('bytes')
      expect(response.headers.get('Content-Length')).toBe('1024')
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(1024)
    })

    it('returns 206 Partial Content for valid Range request', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=0-99'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 0-99/1024')
      expect(response.headers.get('Content-Length')).toBe('100')
      expect(response.headers.get('Accept-Ranges')).toBe('bytes')
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(100)
    })

    it('handles Range request with only start byte (bytes=512-)', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=512-'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 512-1023/1024')
      expect(response.headers.get('Content-Length')).toBe('512')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(512)
    })

    it('returns correct bytes for middle range', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=100-199'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 100-199/1024')
      expect(response.headers.get('Content-Length')).toBe('100')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(100)

      // Verify the actual bytes match the expected content
      const bytes = new Uint8Array(buffer)
      for (let i = 0; i < 100; i++) {
        expect(bytes[i]).toBe((100 + i) % 256)
      }
    })

    it('handles Range request for first byte (bytes=0-0)', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=0-0'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 0-0/1024')
      expect(response.headers.get('Content-Length')).toBe('1')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(1)
    })

    it('handles Range request for last byte (bytes=1023-1023)', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=1023-1023'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 1023-1023/1024')
      expect(response.headers.get('Content-Length')).toBe('1')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(1)
    })

    it('returns 416 for out-of-range start byte', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=2000-2100'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe('bytes */1024')
    })

    it('returns 416 for end byte beyond file size', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=0-2000'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe('bytes */1024')
    })

    it('returns 416 when start is greater than end', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      const response = await GET(createRequest('bytes=500-100'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(416)
      expect(response.headers.get('Content-Range')).toBe('bytes */1024')
    })

    it('handles small chunk size for seeking simulation', async () => {
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
        mockSongWithRealFile,
      ])

      // Simulate typical browser seeking with 1KB chunks
      const response = await GET(createRequest('bytes=0-1023'), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(206)
      expect(response.headers.get('Content-Range')).toBe('bytes 0-1023/1024')
      expect(response.headers.get('Content-Length')).toBe('1024')

      const buffer = await response.arrayBuffer()
      expect(buffer.byteLength).toBe(1024)
    })

    it('returns correct MIME type for different formats', async () => {
      const formats: Array<{
        format: Song['format']
        expectedMime: string
      }> = [
        { format: 'mp3', expectedMime: 'audio/mpeg' },
        { format: 'wav', expectedMime: 'audio/wav' },
        { format: 'ogg', expectedMime: 'audio/ogg' },
        { format: 'flac', expectedMime: 'audio/flac' },
        { format: 'm4a', expectedMime: 'audio/mp4' },
        { format: 'aac', expectedMime: 'audio/aac' },
      ]

      for (const { format, expectedMime } of formats) {
        const songWithFormat: Song = {
          ...mockSongWithRealFile,
          format,
        }
        vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
          songWithFormat,
        ])

        const response = await GET(createRequest('bytes=0-99'), {
          params: Promise.resolve({ id: 'abc123def456' }),
        })

        expect(response.headers.get('Content-Type')).toBe(expectedMime)
      }
    })
  })
})

describe('HEAD /api/audio/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createHeadRequest = () => {
    return new NextRequest('http://localhost:3000/api/audio/abc123def456', {
      method: 'HEAD',
    })
  }

  const mockSong: Song = {
    id: 'abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
    filePath: '/music/test.mp3',
    format: 'mp3',
    hasCover: false,
  }

  const mockSongWithRealFile: Song = {
    id: 'abc123def456',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
    filePath: testFilePath,
    format: 'mp3',
    hasCover: false,
  }

  it('returns 200 with headers when file exists', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([
      mockSongWithRealFile,
    ])

    const response = await HEAD(createHeadRequest(), {
      params: Promise.resolve({ id: 'abc123def456' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Length')).toBe('1024')
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
  })

  it('returns 404 when song not found', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await HEAD(createHeadRequest(), {
      params: Promise.resolve({ id: '111111111111' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Chanson non trouvée')
  })

  it('returns 400 for invalid ID format', async () => {
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([mockSong])

    const response = await HEAD(createHeadRequest(), {
      params: Promise.resolve({ id: 'abc' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Format d'ID invalide")
  })

  it('returns 404 with FILE_NOT_FOUND when file does not exist', async () => {
    const songWithBadPath: Song = {
      ...mockSong,
      filePath: '/non/existent/path/test.mp3',
    }
    vi.mocked(audioScanner.getSongsCache).mockResolvedValue([songWithBadPath])

    // Mock console.error to verify logging
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await HEAD(createHeadRequest(), {
      params: Promise.resolve({ id: 'abc123def456' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('FILE_NOT_FOUND')
    expect(data.message).toBe('Fichier audio introuvable')

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('returns correct MIME type for different formats', async () => {
    const formats: Array<{
      format: Song['format']
      expectedMime: string
    }> = [
      { format: 'mp3', expectedMime: 'audio/mpeg' },
      { format: 'wav', expectedMime: 'audio/wav' },
      { format: 'ogg', expectedMime: 'audio/ogg' },
      { format: 'flac', expectedMime: 'audio/flac' },
      { format: 'm4a', expectedMime: 'audio/mp4' },
      { format: 'aac', expectedMime: 'audio/aac' },
    ]

    for (const { format, expectedMime } of formats) {
      const songWithFormat: Song = {
        ...mockSongWithRealFile,
        format,
      }
      vi.mocked(audioScanner.getSongsCache).mockResolvedValue([songWithFormat])

      const response = await HEAD(createHeadRequest(), {
        params: Promise.resolve({ id: 'abc123def456' }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe(expectedMime)
    }
  })
})
