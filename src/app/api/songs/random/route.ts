import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import type { RandomSongResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const songs = await getSongsCache()

    if (songs.length === 0) {
      return NextResponse.json(
        { error: 'Aucune chanson disponible' },
        { status: 404 }
      )
    }

    // Récupérer les IDs à exclure depuis les query params
    const searchParams = request.nextUrl.searchParams
    const excludeParam = searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',') : []

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
    console.error('Erreur GET /api/songs/random:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sélection aléatoire' },
      { status: 500 }
    )
  }
}
