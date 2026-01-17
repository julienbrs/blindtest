import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scanAudioFolder, getSupportedExtensions } from './audioScanner'
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
