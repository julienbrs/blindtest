import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import { logError } from '@/lib/logger'
import type { SongsListResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    let songs = await getSongsCache()
    const totalInLibrary = songs.length

    // Return EMPTY_LIBRARY error if no songs found
    if (songs.length === 0) {
      return NextResponse.json(
        {
          error: 'EMPTY_LIBRARY',
          message: 'Aucune chanson trouvée',
          audioFolderPath: process.env.AUDIO_FOLDER_PATH || 'Non défini',
        },
        { status: 404 }
      )
    }

    // Parse filter parameters
    const { searchParams } = request.nextUrl
    const artistsFilter = searchParams.get('artists')
    const yearMin = searchParams.get('yearMin')
    const yearMax = searchParams.get('yearMax')

    // Apply artist filter (comma-separated list)
    if (artistsFilter) {
      const artistsList = artistsFilter.split(',').map((a) => a.trim())
      songs = songs.filter((s) => artistsList.includes(s.artist))
    }

    // Apply year range filter
    if (yearMin || yearMax) {
      const minYear = yearMin ? parseInt(yearMin, 10) : 0
      const maxYear = yearMax ? parseInt(yearMax, 10) : 9999
      songs = songs.filter(
        (s) => s.year !== undefined && s.year >= minYear && s.year <= maxYear
      )
    }

    const response: SongsListResponse = {
      songs,
      total: songs.length,
      totalInLibrary,
    }

    return NextResponse.json(response)
  } catch (error) {
    logError('GET /api/songs', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des chansons' },
      { status: 500 }
    )
  }
}
