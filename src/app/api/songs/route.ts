import { NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import type { SongsListResponse } from '@/lib/types'

export async function GET() {
  try {
    const songs = await getSongsCache()

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

    const response: SongsListResponse = {
      songs,
      total: songs.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur GET /api/songs:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des chansons' },
      { status: 500 }
    )
  }
}
