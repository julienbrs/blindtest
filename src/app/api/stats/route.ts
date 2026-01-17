import { NextResponse } from 'next/server'
import { getSongsCache, getCacheInfo } from '@/lib/audioScanner'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}min`
}

export async function GET() {
  try {
    const songs = await getSongsCache()
    const cacheInfo = getCacheInfo()

    // Calculate stats
    const artists = new Set(songs.map((s) => s.artist))
    const albums = new Set(songs.filter((s) => s.album).map((s) => s.album))
    const formats = songs.reduce(
      (acc, s) => {
        acc[s.format] = (acc[s.format] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const totalDuration = songs.reduce((sum, s) => sum + s.duration, 0)

    return NextResponse.json({
      totalSongs: songs.length,
      totalArtists: artists.size,
      totalAlbums: albums.size,
      totalDuration: Math.round(totalDuration),
      totalDurationFormatted: formatDuration(totalDuration),
      formats,
      songsWithCover: songs.filter((s) => s.hasCover).length,
      lastScan: cacheInfo.lastScan,
    })
  } catch (error) {
    console.error('Erreur GET /api/stats:', error)
    return NextResponse.json({ error: 'Erreur stats' }, { status: 500 })
  }
}
