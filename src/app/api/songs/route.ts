import { NextResponse } from 'next/server'

export async function GET() {
  const audioFolderPath = process.env.AUDIO_FOLDER_PATH

  if (!audioFolderPath) {
    return NextResponse.json(
      { error: 'AUDIO_FOLDER_PATH not configured' },
      { status: 500 }
    )
  }

  // Placeholder - will be fully implemented in Epic 3
  return NextResponse.json({
    songs: [],
    total: 0,
    audioFolderPath,
  })
}
