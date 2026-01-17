// Audio scanning utilities - Epic 2
// music-metadata library for reading ID3 tags from audio files
import { parseFile, type IAudioMetadata } from 'music-metadata'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

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
