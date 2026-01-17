import { NextResponse } from 'next/server'
import { refreshCache, getCacheInfo } from '@/lib/audioScanner'
import type { ApiResponse } from '@/lib/types'

export interface RescanResponse {
  songsCount: number
  lastScan: number
}

/**
 * POST /api/songs/rescan
 * Triggers a rescan of the audio folder and refreshes the metadata cache
 * Returns the number of songs found
 */
export async function POST(): Promise<
  NextResponse<ApiResponse<RescanResponse>>
> {
  try {
    await refreshCache()
    const cacheInfo = getCacheInfo()

    return NextResponse.json({
      success: true,
      data: {
        songsCount: cacheInfo.count,
        lastScan: cacheInfo.lastScan!,
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue lors du rescan'

    console.error('Rescan error:', error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
