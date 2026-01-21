import { NextRequest, NextResponse } from 'next/server'
import { stat, readdir } from 'fs/promises'
import { logError, logInfo } from '@/lib/logger'

// Supported audio file extensions (same as audioScanner.ts)
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']

/**
 * POST /api/admin/test-path
 * Tests if a given path is a valid directory containing audio files
 *
 * Request body: { path: string }
 * Response: { success: boolean, filesFound: number } or { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    // Validate path parameter
    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { error: 'Le chemin est requis' },
        { status: 400 }
      )
    }

    const trimmedPath = path.trim()
    if (trimmedPath.length === 0) {
      return NextResponse.json(
        { error: 'Le chemin ne peut pas être vide' },
        { status: 400 }
      )
    }

    // Check if path exists and is a directory
    let pathStats
    try {
      pathStats = await stat(trimmedPath)
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Chemin introuvable', code: 'PATH_NOT_FOUND' },
          { status: 400 }
        )
      }
      if (nodeError.code === 'EACCES') {
        return NextResponse.json(
          { error: 'Permission refusée', code: 'PERMISSION_DENIED' },
          { status: 400 }
        )
      }
      throw error
    }

    if (!pathStats.isDirectory()) {
      return NextResponse.json(
        { error: "Le chemin n'est pas un dossier", code: 'NOT_A_DIRECTORY' },
        { status: 400 }
      )
    }

    // Read directory contents and count audio files
    const files = await readdir(trimmedPath)
    const audioFiles = files.filter((filename) =>
      SUPPORTED_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
    )

    logInfo('test-path', `Path tested: ${trimmedPath}`, {
      filesFound: audioFiles.length,
      totalFiles: files.length,
    })

    return NextResponse.json({
      success: true,
      filesFound: audioFiles.length,
      path: trimmedPath,
    })
  } catch (error) {
    logError('POST /api/admin/test-path', error)
    return NextResponse.json(
      { error: 'Erreur lors du test du chemin' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/test-path
 * Returns the current audio folder path configuration
 */
export async function GET() {
  const currentPath = process.env.AUDIO_FOLDER_PATH || null

  if (!currentPath) {
    return NextResponse.json({
      configured: false,
      path: null,
      message: 'AUDIO_FOLDER_PATH non configuré',
    })
  }

  // Check if the current path is valid
  try {
    const pathStats = await stat(currentPath)
    const isDirectory = pathStats.isDirectory()

    if (!isDirectory) {
      return NextResponse.json({
        configured: true,
        path: currentPath,
        valid: false,
        error: "Le chemin configuré n'est pas un dossier",
      })
    }

    // Count audio files
    const files = await readdir(currentPath)
    const audioFiles = files.filter((filename) =>
      SUPPORTED_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
    )

    return NextResponse.json({
      configured: true,
      path: currentPath,
      valid: true,
      filesFound: audioFiles.length,
    })
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    let errorMessage = 'Erreur inconnue'
    let errorCode = 'UNKNOWN_ERROR'

    if (nodeError.code === 'ENOENT') {
      errorMessage = 'Chemin introuvable'
      errorCode = 'PATH_NOT_FOUND'
    } else if (nodeError.code === 'EACCES') {
      errorMessage = 'Permission refusée'
      errorCode = 'PERMISSION_DENIED'
    }

    return NextResponse.json({
      configured: true,
      path: currentPath,
      valid: false,
      error: errorMessage,
      code: errorCode,
    })
  }
}
