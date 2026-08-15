import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import { getPlaylistById } from '@/lib/playlistScanner'
import { logError } from '@/lib/logger'
import type {
  RandomSongResponse,
  SongSelectionErrorResponse,
} from '@/lib/types'

function selectionError(
  status: number,
  code: SongSelectionErrorResponse['code'],
  error: string
) {
  return NextResponse.json<SongSelectionErrorResponse>(
    { error, code },
    { status }
  )
}

export async function GET(request: NextRequest) {
  try {
    let songs = await getSongsCache()

    if (songs.length === 0) {
      return selectionError(404, 'LIBRARY_EMPTY', 'Aucune chanson disponible')
    }

    // Récupérer les paramètres depuis les query params
    const searchParams = request.nextUrl.searchParams
    const excludeParam = searchParams.get('exclude')
    const excludeIds = new Set(
      excludeParam
        ? excludeParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : []
    )

    // Parse filter parameters (same as /api/songs)
    const artistsFilter = searchParams.get('artists')
    const yearMin = searchParams.get('yearMin')
    const yearMax = searchParams.get('yearMax')

    // A server-side playlist takes priority over artist/year filters.
    const playlistId = searchParams.get('playlist')?.trim()
    if (playlistId) {
      const playlist = await getPlaylistById(playlistId, songs)
      if (!playlist) {
        return selectionError(404, 'PLAYLIST_NOT_FOUND', 'Playlist inconnue')
      }
      if (playlist.songCount === 0) {
        return selectionError(422, 'PLAYLIST_EMPTY', 'Playlist vide')
      }

      const playlistSongIds = new Set(playlist.songIds)
      songs = songs.filter((song) => playlistSongIds.has(song.id))
    } else {
      // Apply artist filter (comma-separated list) - only when no playlist
      if (artistsFilter) {
        const artistsList = artistsFilter.split(',').map((a) => a.trim())
        songs = songs.filter((s) => artistsList.includes(s.artist))
      }

      // Apply year range filter - only when no playlist
      if (yearMin || yearMax) {
        const minYear = yearMin ? parseInt(yearMin, 10) : 0
        const maxYear = yearMax ? parseInt(yearMax, 10) : 9999
        songs = songs.filter(
          (s) => s.year !== undefined && s.year >= minYear && s.year <= maxYear
        )
      }
    }

    // Filtrer les chansons déjà jouées
    const availableSongs = songs.filter((song) => !excludeIds.has(song.id))

    if (availableSongs.length === 0) {
      return selectionError(
        409,
        'SELECTION_EXHAUSTED',
        'Toutes les chansons de la sélection ont été jouées'
      )
    }

    // Sélectionner une chanson aléatoire
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const song = availableSongs[randomIndex]

    const response: RandomSongResponse = { song }
    return NextResponse.json(response)
  } catch (error) {
    logError('GET /api/songs/random', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sélection aléatoire' },
      { status: 500 }
    )
  }
}
