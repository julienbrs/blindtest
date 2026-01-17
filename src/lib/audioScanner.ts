// Audio scanning utilities - Epic 2
// music-metadata library for reading ID3 tags from audio files
import { parseFile, type IAudioMetadata } from 'music-metadata'

// Export parseFile and IAudioMetadata for use in other modules
export { parseFile, type IAudioMetadata }

// Placeholder - will be implemented in issue 2.2
export async function scanAudioFolder(_path: string) {
  // Will scan folder and return song metadata
  return []
}
