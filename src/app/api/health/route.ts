import { NextResponse } from 'next/server'
import {
  getSongsCache,
  getCacheInfo,
  getAudioFolderPath,
  scanAudioFolder,
} from '@/lib/audioScanner'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    const audioPath = getAudioFolderPath()
    if (!audioPath) {
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Bibliothèque audio non configurée',
        },
        { status: 503 }
      )
    }

    // Vérifie le montage à chaque appel, même si le cache métadonnées existe.
    const audioFiles = await scanAudioFolder(audioPath)
    if (audioFiles.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Bibliothèque audio absente, illisible ou vide',
        },
        { status: 503 }
      )
    }

    const songs = await getSongsCache()
    const cacheInfo = getCacheInfo()
    if (songs.length === 0) {
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Aucun morceau audio exploitable',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      library: {
        songsCount: songs.length,
        audioFilesCount: audioFiles.length,
        lastScan: cacheInfo.lastScan,
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    })
  } catch (error) {
    logError('GET /api/health', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
