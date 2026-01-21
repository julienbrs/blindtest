import { NextResponse } from 'next/server'
import {
  getSongsCache,
  getCacheInfo,
  isCacheInitialized,
} from '@/lib/audioScanner'
import { logError } from '@/lib/logger'

export async function GET() {
  try {
    const cacheInfo = getCacheInfo()

    // Get songs count - only if cache is initialized to avoid blocking
    let songsCount = 0
    if (isCacheInitialized()) {
      const songs = await getSongsCache()
      songsCount = songs.length
    } else {
      // Cache not initialized yet, still return healthy status
      songsCount = cacheInfo.count
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      library: {
        songsCount,
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
      { status: 500 }
    )
  }
}
