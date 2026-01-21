import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { Stats } from 'fs'

// Create hoisted mock functions to ensure they're available during module initialization
const { mockStat, mockReaddir } = vi.hoisted(() => ({
  mockStat: vi.fn(),
  mockReaddir: vi.fn(),
}))

// Mock fs/promises before importing route
vi.mock('fs/promises', () => ({
  stat: mockStat,
  readdir: mockReaddir,
  default: { stat: mockStat, readdir: mockReaddir },
}))

// Import route after mock is set up
import { POST, GET } from './route'

// Helper to set readdir mock with string array (without withFileTypes option)
const setMockReaddir = (files: string[]) => {
  mockReaddir.mockResolvedValue(files)
}

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}))

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/test-path', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('POST /api/admin/test-path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Don't restore mocks - that would undo our vi.mock setup
    // vi.clearAllMocks() already runs in beforeEach
  })

  it('should return 400 if path is missing', async () => {
    const request = createRequest({})
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Le chemin est requis')
  })

  it('should return 400 if path is not a string', async () => {
    const request = createRequest({ path: 123 })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Le chemin est requis')
  })

  it('should return 400 if path is empty', async () => {
    const request = createRequest({ path: '   ' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Le chemin ne peut pas être vide')
  })

  it('should return 400 if path does not exist', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException
    error.code = 'ENOENT'
    mockStat.mockRejectedValue(error)

    const request = createRequest({ path: '/nonexistent/path' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Chemin introuvable')
    expect(data.code).toBe('PATH_NOT_FOUND')
  })

  it('should return 400 if permission denied', async () => {
    const error = new Error('EACCES') as NodeJS.ErrnoException
    error.code = 'EACCES'
    mockStat.mockRejectedValue(error)

    const request = createRequest({ path: '/protected/path' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Permission refusée')
    expect(data.code).toBe('PERMISSION_DENIED')
  })

  it('should return 400 if path is not a directory', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => false,
    } as Stats)

    const request = createRequest({ path: '/path/to/file.txt' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Le chemin n'est pas un dossier")
    expect(data.code).toBe('NOT_A_DIRECTORY')
  })

  it('should return success with audio file count', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    } as Stats)
    setMockReaddir([
      'song1.mp3',
      'song2.wav',
      'song3.ogg',
      'document.pdf',
      'image.jpg',
    ])

    const request = createRequest({ path: '/valid/audio/path' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.filesFound).toBe(3) // Only audio files
    expect(data.path).toBe('/valid/audio/path')
  })

  it('should handle all supported audio formats', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    } as Stats)
    setMockReaddir([
      'song1.mp3',
      'song2.wav',
      'song3.ogg',
      'song4.flac',
      'song5.m4a',
      'song6.aac',
      'SONG7.MP3', // Uppercase
    ])

    const request = createRequest({ path: '/audio' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filesFound).toBe(7)
  })

  it('should return 0 files for directory with no audio', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    } as Stats)
    setMockReaddir(['document.pdf', 'image.jpg', 'video.mp4'])

    const request = createRequest({ path: '/no/audio' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.filesFound).toBe(0)
  })

  it('should return 500 on unexpected error', async () => {
    mockStat.mockRejectedValue(new Error('Unexpected error'))

    const request = createRequest({ path: '/some/path' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors du test du chemin')
  })

  it('should trim whitespace from path', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    } as Stats)
    setMockReaddir(['song.mp3'])

    const request = createRequest({ path: '  /audio/path  ' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.path).toBe('/audio/path')
    expect(mockStat).toHaveBeenCalledWith('/audio/path')
  })
})

describe('GET /api/admin/test-path', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    // Don't restore mocks - that would undo our vi.mock setup
  })

  it('should return configured: false if AUDIO_FOLDER_PATH is not set', async () => {
    delete process.env.AUDIO_FOLDER_PATH
    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(false)
    expect(data.path).toBeNull()
    expect(data.message).toBe('AUDIO_FOLDER_PATH non configuré')
  })

  it('should return valid: true for valid configured path', async () => {
    process.env.AUDIO_FOLDER_PATH = '/valid/audio'
    mockStat.mockResolvedValue({
      isDirectory: () => true,
    } as Stats)
    setMockReaddir(['song1.mp3', 'song2.wav'])

    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.path).toBe('/valid/audio')
    expect(data.valid).toBe(true)
    expect(data.filesFound).toBe(2)
  })

  it('should return valid: false if configured path does not exist', async () => {
    process.env.AUDIO_FOLDER_PATH = '/nonexistent'
    const error = new Error('ENOENT') as NodeJS.ErrnoException
    error.code = 'ENOENT'
    mockStat.mockRejectedValue(error)

    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.path).toBe('/nonexistent')
    expect(data.valid).toBe(false)
    expect(data.error).toBe('Chemin introuvable')
    expect(data.code).toBe('PATH_NOT_FOUND')
  })

  it('should return valid: false if configured path has no permissions', async () => {
    process.env.AUDIO_FOLDER_PATH = '/protected'
    const error = new Error('EACCES') as NodeJS.ErrnoException
    error.code = 'EACCES'
    mockStat.mockRejectedValue(error)

    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.valid).toBe(false)
    expect(data.error).toBe('Permission refusée')
    expect(data.code).toBe('PERMISSION_DENIED')
  })

  it('should return valid: false if configured path is not a directory', async () => {
    process.env.AUDIO_FOLDER_PATH = '/path/to/file'
    mockStat.mockResolvedValue({
      isDirectory: () => false,
    } as Stats)

    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.valid).toBe(false)
    expect(data.error).toBe("Le chemin configuré n'est pas un dossier")
  })

  it('should handle unknown errors', async () => {
    process.env.AUDIO_FOLDER_PATH = '/some/path'
    mockStat.mockRejectedValue(new Error('Unknown'))

    const response = await GET()
    const data = await response.json()

    expect(data.configured).toBe(true)
    expect(data.valid).toBe(false)
    expect(data.error).toBe('Erreur inconnue')
    expect(data.code).toBe('UNKNOWN_ERROR')
  })
})
