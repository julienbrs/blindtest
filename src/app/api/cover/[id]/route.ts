import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache, extractCover } from '@/lib/audioScanner'

// Placeholder image in SVG (simple music icon)
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#374151"/>
  <circle cx="100" cy="100" r="60" fill="none" stroke="#9CA3AF" stroke-width="4"/>
  <circle cx="100" cy="100" r="20" fill="#9CA3AF"/>
</svg>`

/**
 * Detects the MIME type of an image from its first bytes
 * @param buffer - The image buffer
 * @returns The detected MIME type
 */
function detectImageMimeType(buffer: Buffer): string {
  // PNG: 0x89 0x50 0x4E 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return 'image/png'
  }
  // GIF: 0x47 0x49 0x46
  if (buffer[0] === 0x47 && buffer[1] === 0x49) {
    return 'image/gif'
  }
  // WebP: "RIFF" + "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45
  ) {
    return 'image/webp'
  }
  // Default to JPEG
  return 'image/jpeg'
}

/**
 * Validates that an ID is in the correct format (12 hex characters)
 */
function isValidId(id: string): boolean {
  return /^[a-f0-9]{12}$/.test(id)
}

/**
 * GET /api/cover/[id]
 * Returns the album cover for a song
 * - Returns embedded cover if available
 * - Falls back to cover.jpg/cover.png in the song's directory
 * - Returns placeholder SVG if no cover found
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: 'Format ID invalide (attendu: 12 caractères hexadécimaux)' },
        { status: 400 }
      )
    }

    const songs = await getSongsCache()
    const song = songs.find((s) => s.id === id)

    if (!song) {
      return NextResponse.json(
        { error: 'Chanson non trouvée' },
        { status: 404 }
      )
    }

    const coverBuffer = await extractCover(song.filePath)

    if (coverBuffer) {
      // Detect the image type from buffer
      const mimeType = detectImageMimeType(coverBuffer)

      return new NextResponse(new Uint8Array(coverBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000', // Cache 1 year
        },
      })
    }

    // Return the placeholder SVG
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    const { id } = await params
    console.error(`Erreur GET /api/cover/${id}:`, error)
    return NextResponse.json(
      { error: 'Erreur récupération pochette' },
      { status: 500 }
    )
  }
}
