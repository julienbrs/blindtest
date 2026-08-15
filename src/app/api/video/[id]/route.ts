import { createReadStream, statSync, type Stats } from 'fs'
import { Readable } from 'stream'
import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache, getVideoSidecarPath } from '@/lib/audioScanner'
import { logError } from '@/lib/logger'

const ID_PATTERN = /^[a-f0-9]{12}$/
const MIME_TYPE = 'video/mp4'
const STREAM_HIGH_WATER_MARK = 256 * 1024
const CACHE_CONTROL = 'public, max-age=3600'

type VideoFile = {
  filePath: string
  stat: Stats
}

type VideoLookupResult =
  | { success: true; video: VideoFile }
  | { success: false; response: NextResponse }

type ByteRange = {
  start: number
  end: number
}

function rangeNotSatisfiable(fileSize: number): NextResponse {
  return new NextResponse(null, {
    status: 416,
    headers: {
      'Content-Range': `bytes */${fileSize}`,
      'Accept-Ranges': 'bytes',
    },
  })
}

function parseByteRange(value: string, fileSize: number): ByteRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim())
  if (!match) return null

  const startText = match[1]
  const endText = match[2]
  if (!startText && !endText) return null

  if (!startText) {
    const suffixLength = Number(endText)
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null

    return {
      start: Math.max(0, fileSize - suffixLength),
      end: fileSize - 1,
    }
  }

  const start = Number(startText)
  const requestedEnd = endText ? Number(endText) : fileSize - 1
  const end = Math.min(requestedEnd, fileSize - 1)

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    start >= fileSize ||
    requestedEnd < start
  ) {
    return null
  }

  return { start, end }
}

async function findVideo(
  id: string,
  method: 'GET' | 'HEAD'
): Promise<VideoLookupResult> {
  if (!ID_PATTERN.test(id)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Format d'ID invalide" },
        { status: 400 }
      ),
    }
  }

  const songs = await getSongsCache()
  const song = songs.find((candidate) => candidate.id === id)

  if (!song) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Chanson non trouvée' },
        { status: 404 }
      ),
    }
  }

  const filePath = getVideoSidecarPath(song.filePath)

  try {
    const stat = statSync(filePath)
    if (!stat.isFile()) {
      throw new Error('Video sidecar is not a file')
    }
    return { success: true, video: { filePath, stat } }
  } catch (error) {
    const errorCode =
      error instanceof Error && 'code' in error
        ? (error as NodeJS.ErrnoException).code
        : 'UNKNOWN'
    logError(`${method} /api/video/${id}`, error, {
      errorType: 'VIDEO_NOT_FOUND',
      filePath,
      code: errorCode,
    })

    return {
      success: false,
      response: NextResponse.json(
        { error: 'VIDEO_NOT_FOUND', message: 'Vidéo associée introuvable' },
        { status: 404 }
      ),
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await findVideo(id, 'GET')
    if (!result.success) return result.response

    const { filePath, stat } = result.video
    const fileSize = stat.size
    const rangeHeader = request.headers.get('range')

    if (rangeHeader) {
      const range = parseByteRange(rangeHeader, fileSize)
      if (!range) return rangeNotSatisfiable(fileSize)

      const { start, end } = range
      const nodeStream = createReadStream(filePath, {
        start,
        end,
        highWaterMark: STREAM_HIGH_WATER_MARK,
      })
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Content-Type': MIME_TYPE,
          'Cache-Control': CACHE_CONTROL,
        },
      })
    }

    const nodeStream = createReadStream(filePath, {
      highWaterMark: STREAM_HIGH_WATER_MARK,
    })
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

    return new NextResponse(webStream, {
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Content-Type': MIME_TYPE,
        'Cache-Control': CACHE_CONTROL,
      },
    })
  } catch (error) {
    const { id } = await params
    logError(`GET /api/video/${id}`, error)
    return NextResponse.json(
      { error: 'Erreur streaming vidéo' },
      { status: 500 }
    )
  }
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await findVideo(id, 'HEAD')
    if (!result.success) return result.response

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(result.video.stat.size),
        'Content-Type': MIME_TYPE,
        'Cache-Control': CACHE_CONTROL,
      },
    })
  } catch (error) {
    const { id } = await params
    logError(`HEAD /api/video/${id}`, error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
