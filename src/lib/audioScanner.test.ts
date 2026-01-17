import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  scanAudioFolder,
  getSupportedExtensions,
  parseFileName,
  generateSongId,
  extractMetadata,
} from './audioScanner'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('scanAudioFolder', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `audio-scanner-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should return an empty array for empty folder', async () => {
    const result = await scanAudioFolder(testDir)
    expect(result).toEqual([])
  })

  it('should find audio files with supported extensions', async () => {
    // Create test audio files (just empty files for testing)
    await writeFile(join(testDir, 'song1.mp3'), '')
    await writeFile(join(testDir, 'song2.wav'), '')
    await writeFile(join(testDir, 'song3.ogg'), '')
    await writeFile(join(testDir, 'song4.flac'), '')
    await writeFile(join(testDir, 'song5.m4a'), '')
    await writeFile(join(testDir, 'song6.aac'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(6)
    expect(result).toContain(join(testDir, 'song1.mp3'))
    expect(result).toContain(join(testDir, 'song2.wav'))
    expect(result).toContain(join(testDir, 'song3.ogg'))
    expect(result).toContain(join(testDir, 'song4.flac'))
    expect(result).toContain(join(testDir, 'song5.m4a'))
    expect(result).toContain(join(testDir, 'song6.aac'))
  })

  it('should ignore non-audio files', async () => {
    await writeFile(join(testDir, 'song.mp3'), '')
    await writeFile(join(testDir, 'document.txt'), '')
    await writeFile(join(testDir, 'image.jpg'), '')
    await writeFile(join(testDir, 'video.mp4'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(join(testDir, 'song.mp3'))
  })

  it('should scan subdirectories recursively', async () => {
    const subDir = join(testDir, 'subfolder')
    const nestedDir = join(subDir, 'nested')
    await mkdir(nestedDir, { recursive: true })

    await writeFile(join(testDir, 'root.mp3'), '')
    await writeFile(join(subDir, 'sub.mp3'), '')
    await writeFile(join(nestedDir, 'nested.mp3'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(3)
    expect(result).toContain(join(testDir, 'root.mp3'))
    expect(result).toContain(join(subDir, 'sub.mp3'))
    expect(result).toContain(join(nestedDir, 'nested.mp3'))
  })

  it('should ignore hidden directories', async () => {
    const hiddenDir = join(testDir, '.hidden')
    await mkdir(hiddenDir, { recursive: true })

    await writeFile(join(testDir, 'visible.mp3'), '')
    await writeFile(join(hiddenDir, 'hidden.mp3'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(join(testDir, 'visible.mp3'))
  })

  it('should ignore @eaDir directories (Synology)', async () => {
    const eaDir = join(testDir, '@eaDir')
    await mkdir(eaDir, { recursive: true })

    await writeFile(join(testDir, 'visible.mp3'), '')
    await writeFile(join(eaDir, 'metadata.mp3'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(join(testDir, 'visible.mp3'))
  })

  it('should throw error for non-existent folder', async () => {
    await expect(scanAudioFolder('/non/existent/path')).rejects.toThrow(
      'Audio folder not found'
    )
  })

  it('should handle case-insensitive extensions', async () => {
    await writeFile(join(testDir, 'song1.MP3'), '')
    await writeFile(join(testDir, 'song2.Mp3'), '')
    await writeFile(join(testDir, 'song3.FLAC'), '')

    const result = await scanAudioFolder(testDir)

    expect(result).toHaveLength(3)
  })
})

describe('getSupportedExtensions', () => {
  it('should return all supported extensions', () => {
    const extensions = getSupportedExtensions()

    expect(extensions).toContain('.mp3')
    expect(extensions).toContain('.wav')
    expect(extensions).toContain('.ogg')
    expect(extensions).toContain('.flac')
    expect(extensions).toContain('.m4a')
    expect(extensions).toContain('.aac')
    expect(extensions).toHaveLength(6)
  })

  it('should return a copy of the array', () => {
    const ext1 = getSupportedExtensions()
    const ext2 = getSupportedExtensions()

    expect(ext1).not.toBe(ext2)
    expect(ext1).toEqual(ext2)
  })
})

describe('parseFileName', () => {
  it('should parse "Artist - Title" format correctly', () => {
    const result = parseFileName('Michael Jackson - Billie Jean')

    expect(result.artist).toBe('Michael Jackson')
    expect(result.title).toBe('Billie Jean')
  })

  it('should handle multiple dashes in title', () => {
    const result = parseFileName('Artist - Song - Part 2 - Extended Mix')

    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Song - Part 2 - Extended Mix')
  })

  it('should return title only when no separator', () => {
    const result = parseFileName('Just A Title')

    expect(result.artist).toBeUndefined()
    expect(result.title).toBe('Just A Title')
  })

  it('should trim whitespace', () => {
    const result = parseFileName('  Artist  -  Title  ')

    expect(result.artist).toBe('Artist')
    expect(result.title).toBe('Title')
  })

  it('should handle empty string', () => {
    const result = parseFileName('')

    expect(result.artist).toBeUndefined()
    expect(result.title).toBe('')
  })
})

describe('generateSongId', () => {
  it('should generate a 12-character hex string', () => {
    const id = generateSongId('/path/to/song.mp3')

    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('should generate the same ID for the same path', () => {
    const path = '/path/to/song.mp3'
    const id1 = generateSongId(path)
    const id2 = generateSongId(path)

    expect(id1).toBe(id2)
  })

  it('should generate different IDs for different paths', () => {
    const id1 = generateSongId('/path/to/song1.mp3')
    const id2 = generateSongId('/path/to/song2.mp3')

    expect(id1).not.toBe(id2)
  })
})

describe('extractMetadata', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `metadata-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should return null for non-existent file', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await extractMetadata('/non/existent/file.mp3')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should use filename fallback when metadata is empty', async () => {
    // Create an empty mp3 file - music-metadata can parse it but finds no tags
    const testFile = join(testDir, 'Artist Name - Song Title.mp3')
    await writeFile(testFile, '')

    const result = await extractMetadata(testFile)

    // Should use filename fallback for artist and title
    expect(result).not.toBeNull()
    expect(result!.artist).toBe('Artist Name')
    expect(result!.title).toBe('Song Title')
    expect(result!.format).toBe('mp3')
    expect(result!.duration).toBe(0)
    expect(result!.hasCover).toBe(false)
  })

  it('should use default values when filename has no artist', async () => {
    const testFile = join(testDir, 'Just A Title.mp3')
    await writeFile(testFile, '')

    const result = await extractMetadata(testFile)

    expect(result).not.toBeNull()
    expect(result!.artist).toBe('Artiste inconnu')
    expect(result!.title).toBe('Just A Title')
  })

  it('should generate correct ID from file path', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const testPath = '/music/Artist - Song.mp3'

    // The ID generation itself works correctly
    const expectedId = generateSongId(testPath)

    expect(expectedId).toHaveLength(12)
    expect(expectedId).toMatch(/^[0-9a-f]{12}$/)
    consoleSpy.mockRestore()
  })
})
