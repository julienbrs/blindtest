import { NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import { logError } from '@/lib/logger'

export interface ArtistsResponse {
  artists: string[]
  total: number
}

export async function GET() {
  try {
    const songs = await getSongsCache()

    // Extract unique artists and sort alphabetically
    const artistsSet = new Set<string>()
    for (const song of songs) {
      if (song.artist) {
        artistsSet.add(song.artist)
      }
    }

    const artists = Array.from(artistsSet).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    )

    const response: ArtistsResponse = {
      artists,
      total: artists.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    logError('GET /api/artists', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des artistes' },
      { status: 500 }
    )
  }
}
