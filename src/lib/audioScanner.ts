// Audio scanning utilities - Epic 2
// music-metadata library for reading ID3 tags from audio files
import { parseFile, type IAudioMetadata } from 'music-metadata'
import { createHash } from 'crypto'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import type { Song, AudioFormat } from './types'

// Export parseFile and IAudioMetadata for use in other modules
export { parseFile, type IAudioMetadata }

// Supported audio file extensions
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']

// Directories to ignore during scanning
const IGNORED_DIRECTORIES = ['.', '@eaDir', '__MACOSX', '.DS_Store']

/**
 * Recursively scans a folder and returns all audio file paths
 * @param folderPath - The root folder to scan
 * @returns Array of absolute paths to audio files
 */
export async function scanAudioFolder(folderPath: string): Promise<string[]> {
  const audioFiles: string[] = []

  async function scanDir(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Ignore hidden folders and special directories
          if (
            !entry.name.startsWith('.') &&
            !IGNORED_DIRECTORIES.includes(entry.name)
          ) {
            await scanDir(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            audioFiles.push(fullPath)
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          console.warn(`Directory not found: ${dirPath}`)
        } else if (error.message.includes('EACCES')) {
          console.warn(`Permission denied: ${dirPath}`)
        } else {
          console.error(`Error scanning directory ${dirPath}:`, error.message)
        }
      }
      // Continue scanning other directories even if one fails
    }
  }

  // Verify the root folder exists
  try {
    const rootStat = await stat(folderPath)
    if (!rootStat.isDirectory()) {
      throw new Error(`Path is not a directory: ${folderPath}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new Error(`Audio folder not found: ${folderPath}`)
      }
      throw error
    }
    throw error
  }

  await scanDir(folderPath)
  return audioFiles
}

/**
 * Returns the list of supported audio extensions
 */
export function getSupportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS]
}

/**
 * Parses a filename in "Artist - Title" format
 * @param fileName - The file name without extension
 * @returns Object with optional artist and title
 */
export function parseFileName(fileName: string): {
  artist?: string
  title?: string
} {
  // Format: "Artist - Title" (with possible multiple dashes in title)
  const parts = fileName.split(' - ')
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    }
  }

  // Format: "Title" only (no separator found)
  return { title: fileName.trim() }
}

/**
 * Generates a unique ID for a song based on its file path
 * @param filePath - The absolute path to the audio file
 * @returns A 12-character hex string
 */
export function generateSongId(filePath: string): string {
  return createHash('md5').update(filePath).digest('hex').slice(0, 12)
}

/**
 * Extracts metadata from an audio file
 * @param filePath - The absolute path to the audio file
 * @returns Song object or null if extraction fails
 */
export async function extractMetadata(filePath: string): Promise<Song | null> {
  try {
    const metadata = await parseFile(filePath)

    // Generate a unique ID based on the file path
    const id = generateSongId(filePath)

    // Extract the format from the file extension
    const ext = extname(filePath).toLowerCase().slice(1) as AudioFormat

    // Fallback on filename if no metadata present
    const fileName = basename(filePath, extname(filePath))
    const { artist: parsedArtist, title: parsedTitle } = parseFileName(fileName)

    return {
      id,
      title: metadata.common.title || parsedTitle || 'Titre inconnu',
      artist: metadata.common.artist || parsedArtist || 'Artiste inconnu',
      album: metadata.common.album,
      year: metadata.common.year,
      duration: metadata.format.duration || 0,
      filePath,
      format: ext,
      hasCover: !!(
        metadata.common.picture && metadata.common.picture.length > 0
      ),
    }
  } catch (error) {
    console.error(`Erreur lecture métadonnées: ${filePath}`, error)
    return null
  }
}
