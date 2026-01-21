import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import { logError } from '@/lib/logger'
import type { RandomSongResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    let songs = await getSongsCache()

    if (songs.length === 0) {
      return NextResponse.json(
        { error: 'Aucune chanson disponible' },
        { status: 404 }
      )
    }

    // Récupérer les paramètres depuis les query params
    const searchParams = request.nextUrl.searchParams
    const excludeParam = searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',') : []

    // Parse filter parameters (same as /api/songs)
    const artistsFilter = searchParams.get('artists')
    const yearMin = searchParams.get('yearMin')
    const yearMax = searchParams.get('yearMax')

    // Parse include parameter for playlist filtering
    // When provided, only songs with these IDs are considered
    const includeParam = searchParams.get('include')
    const includeIds = includeParam
      ? includeParam.split(',').map((id) => id.trim())
      : null

    // Apply include filter first (playlist songs)
    // This takes priority over other filters when a playlist is selected
    if (includeIds && includeIds.length > 0) {
      songs = songs.filter((s) => includeIds.includes(s.id))
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
    const availableSongs = songs.filter((song) => !excludeIds.includes(song.id))

    if (availableSongs.length === 0) {
      return NextResponse.json(
        { error: 'Toutes les chansons ont été jouées' },
        { status: 404 }
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
