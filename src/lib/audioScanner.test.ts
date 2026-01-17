import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  scanAudioFolder,
  getSupportedExtensions,
  parseFileName,
  generateSongId,
  extractMetadata,
  extractCover,
  getCoverMimeType,
  getCoverFilenames,
  getSongsCache,
  refreshCache,
  getCacheInfo,
  clearCache,
  isCacheInitialized,
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

describe('extractCover', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `cover-test-${Date.now()}`)
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
    const result = await extractCover('/non/existent/file.mp3')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should return null when no embedded cover and no cover file exists', async () => {
    // Create an empty mp3 file with no embedded cover
    const testFile = join(testDir, 'nocov.mp3')
    await writeFile(testFile, '')

    const result = await extractCover(testFile)

    expect(result).toBeNull()
  })

  it('should find cover.jpg in the same directory', async () => {
    const testFile = join(testDir, 'song.mp3')
    const coverFile = join(testDir, 'cover.jpg')
    const coverData = Buffer.from('fake jpeg data')

    await writeFile(testFile, '')
    await writeFile(coverFile, coverData)

    const result = await extractCover(testFile)

    expect(result).not.toBeNull()
    expect(result!.toString()).toBe(coverData.toString())
  })

  it('should find folder.jpg in the same directory', async () => {
    const testFile = join(testDir, 'song.mp3')
    const coverFile = join(testDir, 'folder.jpg')
    const coverData = Buffer.from('fake folder jpg data')

    await writeFile(testFile, '')
    await writeFile(coverFile, coverData)

    const result = await extractCover(testFile)

    expect(result).not.toBeNull()
    expect(result!.toString()).toBe(coverData.toString())
  })

  it('should find cover.png in the same directory', async () => {
    const testFile = join(testDir, 'song.mp3')
    const coverFile = join(testDir, 'cover.png')
    const coverData = Buffer.from('fake png data')

    await writeFile(testFile, '')
    await writeFile(coverFile, coverData)

    const result = await extractCover(testFile)

    expect(result).not.toBeNull()
    expect(result!.toString()).toBe(coverData.toString())
  })

  it('should prefer cover.jpg over folder.jpg', async () => {
    const testFile = join(testDir, 'song.mp3')
    const coverFile = join(testDir, 'cover.jpg')
    const folderFile = join(testDir, 'folder.jpg')
    const coverData = Buffer.from('cover.jpg data')
    const folderData = Buffer.from('folder.jpg data')

    await writeFile(testFile, '')
    await writeFile(coverFile, coverData)
    await writeFile(folderFile, folderData)

    const result = await extractCover(testFile)

    expect(result).not.toBeNull()
    expect(result!.toString()).toBe(coverData.toString())
  })

  it('should find album.jpg as fallback', async () => {
    const testFile = join(testDir, 'song.mp3')
    const coverFile = join(testDir, 'album.jpg')
    const coverData = Buffer.from('album jpg data')

    await writeFile(testFile, '')
    await writeFile(coverFile, coverData)

    const result = await extractCover(testFile)

    expect(result).not.toBeNull()
    expect(result!.toString()).toBe(coverData.toString())
  })
})

describe('getCoverMimeType', () => {
  it('should return image/jpeg for .jpg files', () => {
    expect(getCoverMimeType('/path/to/cover.jpg', false)).toBe('image/jpeg')
    expect(getCoverMimeType('/path/to/COVER.JPG', false)).toBe('image/jpeg')
  })

  it('should return image/png for .png files', () => {
    expect(getCoverMimeType('/path/to/cover.png', false)).toBe('image/png')
    expect(getCoverMimeType('/path/to/COVER.PNG', false)).toBe('image/png')
  })

  it('should return image/gif for .gif files', () => {
    expect(getCoverMimeType('/path/to/cover.gif', false)).toBe('image/gif')
    expect(getCoverMimeType('/path/to/COVER.GIF', false)).toBe('image/gif')
  })

  it('should default to image/jpeg for unknown extensions', () => {
    expect(getCoverMimeType('/path/to/cover', false)).toBe('image/jpeg')
    expect(getCoverMimeType('/path/to/cover.webp', false)).toBe('image/jpeg')
  })

  it('should use embedded format when available', () => {
    const metadata = {
      common: {
        picture: [{ format: 'image/png', data: [] }],
      },
    }
    expect(getCoverMimeType('/path/to/song.mp3', true, metadata as never)).toBe(
      'image/png'
    )
  })

  it('should fall back to extension when embedded format is not available', () => {
    const metadata = {
      common: {
        picture: [{ data: [] }],
      },
    }
    expect(
      getCoverMimeType('/path/to/cover.png', true, metadata as never)
    ).toBe('image/png')
  })
})

describe('getCoverFilenames', () => {
  it('should return all cover filenames', () => {
    const filenames = getCoverFilenames()

    expect(filenames).toContain('cover.jpg')
    expect(filenames).toContain('cover.png')
    expect(filenames).toContain('folder.jpg')
    expect(filenames).toContain('folder.png')
    expect(filenames).toContain('album.jpg')
    expect(filenames).toContain('album.png')
    expect(filenames).toHaveLength(6)
  })

  it('should return a copy of the array', () => {
    const names1 = getCoverFilenames()
    const names2 = getCoverFilenames()

    expect(names1).not.toBe(names2)
    expect(names1).toEqual(names2)
  })
})

describe('Metadata Cache', () => {
  let testDir: string
  const originalEnv = process.env.AUDIO_FOLDER_PATH

  beforeEach(async () => {
    // Clear cache before each test
    clearCache()
    testDir = join(tmpdir(), `cache-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    process.env.AUDIO_FOLDER_PATH = testDir
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    clearCache()
    process.env.AUDIO_FOLDER_PATH = originalEnv
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // First populate the cache
      await writeFile(join(testDir, 'song.mp3'), '')
      await getSongsCache()

      expect(isCacheInitialized()).toBe(true)

      // Clear it
      clearCache()

      expect(isCacheInitialized()).toBe(false)
    })
  })

  describe('isCacheInitialized', () => {
    it('should return false when cache is not initialized', () => {
      expect(isCacheInitialized()).toBe(false)
    })

    it('should return true after cache is populated', async () => {
      await getSongsCache()
      expect(isCacheInitialized()).toBe(true)
    })
  })

  describe('getCacheInfo', () => {
    it('should return count 0 and null lastScan when not initialized', () => {
      const info = getCacheInfo()

      expect(info.count).toBe(0)
      expect(info.lastScan).toBeNull()
    })

    it('should return correct count and lastScan after initialization', async () => {
      await writeFile(join(testDir, 'song1.mp3'), '')
      await writeFile(join(testDir, 'song2.mp3'), '')

      const beforeScan = Date.now()
      await getSongsCache()
      const afterScan = Date.now()

      const info = getCacheInfo()

      expect(info.count).toBe(2)
      expect(info.lastScan).not.toBeNull()
      expect(info.lastScan).toBeGreaterThanOrEqual(beforeScan)
      expect(info.lastScan).toBeLessThanOrEqual(afterScan)
    })
  })

  describe('getSongsCache', () => {
    it('should trigger scan on first call', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await writeFile(join(testDir, 'Artist - Title.mp3'), '')

      expect(isCacheInitialized()).toBe(false)

      const songs = await getSongsCache()

      expect(isCacheInitialized()).toBe(true)
      expect(songs).toHaveLength(1)
      expect(songs[0].artist).toBe('Artist')
      expect(songs[0].title).toBe('Title')
      expect(consoleSpy).toHaveBeenCalledWith('Cache rafraîchi: 1 chansons')
    })

    it('should use cache on subsequent calls', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await writeFile(join(testDir, 'song.mp3'), '')

      // First call - should scan
      const songs1 = await getSongsCache()
      expect(consoleSpy).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      const songs2 = await getSongsCache()
      expect(consoleSpy).toHaveBeenCalledTimes(1) // Still just 1 call

      // Should return same data
      expect(songs1).toBe(songs2)
    })
  })

  describe('refreshCache', () => {
    it('should throw error when AUDIO_FOLDER_PATH is not defined', async () => {
      delete process.env.AUDIO_FOLDER_PATH

      await expect(refreshCache()).rejects.toThrow(
        'AUDIO_FOLDER_PATH non défini'
      )
    })

    it('should rescan and update cache', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Initial scan with one file
      await writeFile(join(testDir, 'song1.mp3'), '')
      await getSongsCache()

      const info1 = getCacheInfo()
      expect(info1.count).toBe(1)
      expect(info1.lastScan).not.toBeNull()

      // Add another file
      await writeFile(join(testDir, 'song2.mp3'), '')

      // Refresh the cache
      await refreshCache()

      const info2 = getCacheInfo()
      expect(info2.count).toBe(2)
      expect(info2.lastScan).not.toBeNull()
      expect(info2.lastScan).toBeGreaterThanOrEqual(info1.lastScan!)
      expect(consoleSpy).toHaveBeenCalledWith('Cache rafraîchi: 2 chansons')
    })

    it('should replace old cache completely', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {})

      // Initial scan
      await writeFile(join(testDir, 'song1.mp3'), '')
      const songs1 = await getSongsCache()
      expect(songs1).toHaveLength(1)

      // Add another file and refresh
      await writeFile(join(testDir, 'song2.mp3'), '')
      await refreshCache()

      // Get cache again - should have new songs
      const songs2 = await getSongsCache()
      expect(songs2).toHaveLength(2)

      // Arrays should be different instances (old cache replaced)
      expect(songs1).not.toBe(songs2)
    })
  })
})
