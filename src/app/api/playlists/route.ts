import { NextResponse } from 'next/server'
import { getSongsCache, AudioPathError } from '@/lib/audioScanner'
import { getPlaylistCatalog } from '@/lib/playlistScanner'
import { logError } from '@/lib/logger'
import type { PlaylistSummary } from '@/lib/types'

export interface PlaylistsResponse {
  playlists: PlaylistSummary[]
}

export const dynamic = 'force-dynamic'

export async function GET(): Promise<
  NextResponse<PlaylistsResponse | { error: string }>
> {
  try {
    const songs = await getSongsCache()
    const catalog = await getPlaylistCatalog(songs)
    const playlists = catalog.map(
      ({ id, name, songCount, missingSongCount }) => ({
        id,
        name,
        songCount,
        missingSongCount,
      })
    )

    return NextResponse.json(
      { playlists },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    logError('GET /api/playlists', error)
    return NextResponse.json(
      { error: 'Catalogue de playlists indisponible' },
      { status: error instanceof AudioPathError ? 503 : 500 }
    )
  }
}
