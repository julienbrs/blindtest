import { NextResponse } from 'next/server'
import { refreshCache, getCacheInfo } from '@/lib/audioScanner'
import { logError } from '@/lib/logger'

export interface RescanResponse {
  success: boolean
  songsFound: number
  scanDuration: number
  message: string
}

/**
 * POST /api/songs/rescan
 * Triggers a rescan of the audio folder and refreshes the metadata cache
 * Returns the number of songs found and scan duration
 */
export async function POST(): Promise<
  NextResponse<RescanResponse | { error: string }>
> {
  try {
    const startTime = Date.now()
    await refreshCache()
    const duration = Date.now() - startTime
    const info = getCacheInfo()

    return NextResponse.json({
      success: true,
      songsFound: info.count,
      scanDuration: duration,
      message: `Scan terminé: ${info.count} chansons trouvées en ${duration}ms`,
    })
  } catch (error) {
    logError('POST /api/songs/rescan', error)
    return NextResponse.json(
      { error: 'Erreur lors du rescan' },
      { status: 500 }
    )
  }
}
