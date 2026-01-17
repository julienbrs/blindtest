import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'

/**
 * GET /api/songs/[id]
 * Returns the details of a specific song by its ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format (12 hex characters)
    if (!/^[a-f0-9]{12}$/.test(id)) {
      return NextResponse.json(
        { error: "Format d'ID invalide" },
        { status: 400 }
      )
    }

    const songs = await getSongsCache()
    const song = songs.find((s) => s.id === id)

    if (!song) {
      return NextResponse.json(
        { error: 'Chanson non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ song })
  } catch (error) {
    const { id } = await params
    console.error(`Erreur GET /api/songs/${id}:`, error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
