import { NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import type { SongsListResponse } from '@/lib/types'

export async function GET() {
  try {
    const songs = await getSongsCache()

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
