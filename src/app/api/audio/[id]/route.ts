import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync, Stats } from 'fs'
import { Readable } from 'stream'
import { getSongsCache } from '@/lib/audioScanner'
import type { AudioFormat, Song } from '@/lib/types'

/**
 * MIME types for supported audio formats
 */
const MIME_TYPES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
}

/**
 * Default high water mark for streaming (64KB chunks)
 * Optimized for audio streaming performance
 */
const STREAM_HIGH_WATER_MARK = 64 * 1024

/**
 * GET /api/audio/[id]
 * Streams an audio file with Range Request support for seeking
 * Optimized for memory efficiency - uses true streaming instead of buffering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format (12 hex characters)
    if (!/^[a-f0-9]{12}$/.test(id)) {
      return NextResponse.json(
        { error: "Format d'ID invalide" },
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

    const filePath = song.filePath
    let stat
    try {
      stat = statSync(filePath)
    } catch (error) {
      // Log the error for server-side debugging
      const errorCode =
        error instanceof Error && 'code' in error
          ? (error as NodeJS.ErrnoException).code
          : 'UNKNOWN'
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          context: `GET /api/audio/${id}`,
          error: 'FILE_NOT_FOUND',
          message: `Audio file not found at path: ${filePath}`,
          code: errorCode,
        })
      )

      return NextResponse.json(
        { error: 'FILE_NOT_FOUND', message: 'Fichier audio introuvable' },
        { status: 404 }
      )
    }

    const fileSize = stat.size
    const mimeType = MIME_TYPES[song.format] || 'audio/mpeg'

    // Check for Range Request header
    const range = request.headers.get('range')

    if (range) {
      // Parse the range header
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        })
      }

      const chunkSize = end - start + 1

      // Create a file stream for the requested range with optimized chunk size
      const nodeStream = createReadStream(filePath, {
        start,
        end,
        highWaterMark: STREAM_HIGH_WATER_MARK,
      })

      // Convert Node.js stream to Web ReadableStream for true streaming
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mimeType,
        },
      })
    }

    // Full file request - use true streaming to avoid loading entire file into memory
    const nodeStream = createReadStream(filePath, {
      highWaterMark: STREAM_HIGH_WATER_MARK,
    })

    // Convert Node.js stream to Web ReadableStream
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

    return new NextResponse(webStream, {
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    const { id } = await params
    console.error(`Erreur GET /api/audio/${id}:`, error)
    return NextResponse.json({ error: 'Erreur streaming' }, { status: 500 })
  }
}

/**
 * Result type for validateSongAndFile helper
 */
type ValidationSuccess = {
  success: true
  song: Song
  stat: Stats
}
type ValidationError = { success: false; response: NextResponse }
type ValidationResult = ValidationSuccess | ValidationError

/**
 * Helper to validate song and check file accessibility
 * Returns the song if valid and file accessible, or an error response
 */
async function validateSongAndFile(id: string): Promise<ValidationResult> {
  // Validate ID format (12 hex characters)
  if (!/^[a-f0-9]{12}$/.test(id)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Format d'ID invalide" },
        { status: 400 }
      ),
    }
  }

  const songs = await getSongsCache()
  const song = songs.find((s) => s.id === id)

  if (!song) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Chanson non trouvée' },
        { status: 404 }
      ),
    }
  }

  const filePath = song.filePath
  try {
    const stat = statSync(filePath)
    return { success: true, song, stat }
  } catch (error) {
    // Log the error for server-side debugging
    const errorCode =
      error instanceof Error && 'code' in error
        ? (error as NodeJS.ErrnoException).code
        : 'UNKNOWN'
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        context: `HEAD /api/audio/${id}`,
        error: 'FILE_NOT_FOUND',
        message: `Audio file not found at path: ${filePath}`,
        code: errorCode,
      })
    )

    return {
      success: false,
      response: NextResponse.json(
        { error: 'FILE_NOT_FOUND', message: 'Fichier audio introuvable' },
        { status: 404 }
      ),
    }
  }
}

/**
 * HEAD /api/audio/[id]
 * Checks if an audio file is accessible without streaming the content
 * Used to verify file accessibility before loading a song
 */
export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await validateSongAndFile(id)

    // If validation failed, return the error response
    if (!result.success) {
      return result.response
    }

    const { song, stat } = result
    const fileSize = stat.size
    const mimeType = MIME_TYPES[song.format] || 'audio/mpeg'

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    const { id } = await params
    console.error(`Erreur HEAD /api/audio/${id}:`, error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
