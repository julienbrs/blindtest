import { createHash } from 'crypto'
import { readFile, readdir, realpath, stat } from 'fs/promises'
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'path'
import {
  AudioPathError,
  getAudioFolderPath,
  getSongsCache,
} from './audioScanner'
import type { PlaylistSummary, Song } from './types'

const PLAYLIST_EXTENSIONS = new Set(['.m3u', '.m3u8'])
const IGNORED_DIRECTORIES = new Set(['@eaDir', '__MACOSX'])
const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.m4a',
  '.aac',
])
const URL_PATTERN = /^[a-z][a-z\d+.-]*:/i

interface PlaylistFileInfo {
  path: string
  relativePath: string
  size: number
  mtimeMs: number
}

export interface ParsedM3u {
  name: string | null
  entries: string[]
}

export interface ResolvedPlaylist extends PlaylistSummary {
  relativePath: string
  songIds: string[]
}

interface PlaylistCatalogCache {
  rootPath: string
  filesSignature: string
  songsSignature: string
  playlists: ResolvedPlaylist[]
}

let catalogCache: PlaylistCatalogCache | null = null

/** Parse le contenu texte d'un fichier M3U/M3U8. */
export function parseM3u(content: string): ParsedM3u {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)
  const entries: string[] = []
  let name: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const playlistName = line.match(/^#PLAYLIST\s*:\s*(.+)$/i)
    if (playlistName && !name) {
      const value = playlistName[1].trim()
      if (value) name = value
      continue
    }

    // Inclut notamment #EXTM3U et #EXTINF.
    if (line.startsWith('#')) continue
    entries.push(line)
  }

  return { name, entries }
}

function normalizeRelativePath(path: string): string {
  return path.split(sep).join('/')
}

function isInside(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath)
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  )
}

function generatePlaylistId(relativePath: string): string {
  const hash = createHash('sha256')
    .update(normalizeRelativePath(relativePath))
    .digest('hex')
    .slice(0, 16)
  return `m3u_${hash}`
}

async function discoverPlaylistFiles(
  rootPath: string
): Promise<PlaylistFileInfo[]> {
  const files: PlaylistFileInfo[] = []

  async function scanDirectory(directoryPath: string): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = resolve(directoryPath, entry.name)
      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          !IGNORED_DIRECTORIES.has(entry.name)
        ) {
          await scanDirectory(fullPath)
        }
        continue
      }

      if (
        !entry.isFile() ||
        !PLAYLIST_EXTENSIONS.has(extname(entry.name).toLowerCase())
      ) {
        continue
      }

      const fileStat = await stat(fullPath)
      files.push({
        path: fullPath,
        relativePath: normalizeRelativePath(relative(rootPath, fullPath)),
        size: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
      })
    }
  }

  await scanDirectory(rootPath)
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

function getFilesSignature(files: PlaylistFileInfo[]): string {
  return files
    .map((file) => `${file.relativePath}\0${file.size}\0${file.mtimeMs}`)
    .join('\n')
}

function getSongsSignature(songs: Song[]): string {
  return createHash('sha256')
    .update(
      songs
        .map((song) => `${song.id}\0${resolve(song.filePath)}`)
        .sort()
        .join('\n')
    )
    .digest('hex')
}

async function resolvePlaylist(
  file: PlaylistFileInfo,
  rootPath: string,
  canonicalRootPath: string,
  songsByPath: ReadonlyMap<string, Song>
): Promise<ResolvedPlaylist> {
  const content = await readFile(file.path, 'utf8')
  const parsed = parseM3u(content)
  const songIds: string[] = []
  const seenPaths = new Set<string>()
  const seenSongIds = new Set<string>()
  let missingSongCount = 0

  for (const rawEntry of parsed.entries) {
    // Les URLs (http:, https:, file:, etc.) ne font jamais partie du catalogue local.
    if (URL_PATTERN.test(rawEntry)) continue

    const normalizedEntry = rawEntry.replace(/\\/g, sep)
    const candidatePath = isAbsolute(normalizedEntry)
      ? resolve(normalizedEntry)
      : resolve(dirname(file.path), normalizedEntry)

    if (
      !isInside(rootPath, candidatePath) ||
      !AUDIO_EXTENSIONS.has(extname(candidatePath).toLowerCase()) ||
      seenPaths.has(candidatePath)
    ) {
      continue
    }
    seenPaths.add(candidatePath)

    try {
      const candidateStat = await stat(candidatePath)
      if (!candidateStat.isFile()) {
        missingSongCount += 1
        continue
      }

      // Empêche aussi un lien symbolique situé dans la bibliothèque de pointer dehors.
      const canonicalCandidatePath = await realpath(candidatePath)
      if (!isInside(canonicalRootPath, canonicalCandidatePath)) continue

      const song =
        songsByPath.get(candidatePath) ||
        songsByPath.get(canonicalCandidatePath)
      if (song && !seenSongIds.has(song.id)) {
        seenSongIds.add(song.id)
        songIds.push(song.id)
      } else if (!song) {
        missingSongCount += 1
      }
    } catch {
      missingSongCount += 1
    }
  }

  return {
    id: generatePlaylistId(file.relativePath),
    name: parsed.name || basename(file.path, extname(file.path)),
    relativePath: file.relativePath,
    songIds,
    songCount: songIds.length,
    missingSongCount,
  }
}

/**
 * Retourne le catalogue M3U courant. La liste des fichiers est vérifiée à
 * chaque appel ; le contenu n'est reparsé que si chemin, taille ou mtime change.
 */
export async function getPlaylistCatalog(
  providedSongs?: Song[]
): Promise<ResolvedPlaylist[]> {
  const configuredPath = getAudioFolderPath()
  if (!configuredPath) {
    throw new AudioPathError(
      "Variable d'environnement AUDIO_FOLDER_PATH non définie.",
      'NOT_CONFIGURED'
    )
  }

  const rootPath = resolve(configuredPath)
  const songs = providedSongs || (await getSongsCache())
  let files: PlaylistFileInfo[]
  try {
    files = await discoverPlaylistFiles(rootPath)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      throw new AudioPathError(
        `Dossier audio introuvable: ${rootPath}`,
        'PATH_NOT_FOUND',
        rootPath
      )
    }
    if (code === 'EACCES') {
      throw new AudioPathError(
        `Permission refusée pour le dossier: ${rootPath}`,
        'PERMISSION_DENIED',
        rootPath
      )
    }
    throw error
  }
  const filesSignature = getFilesSignature(files)
  const songsSignature = getSongsSignature(songs)

  if (
    catalogCache?.rootPath === rootPath &&
    catalogCache.filesSignature === filesSignature &&
    catalogCache.songsSignature === songsSignature
  ) {
    return catalogCache.playlists
  }

  const canonicalRootPath = await realpath(rootPath)
  const songsByPath = new Map<string, Song>()
  for (const song of songs) {
    songsByPath.set(resolve(song.filePath), song)
    try {
      songsByPath.set(await realpath(song.filePath), song)
    } catch {
      // Un morceau retiré entre le scan audio et ce scan sera simplement absent.
    }
  }

  const playlists: ResolvedPlaylist[] = []
  for (const file of files) {
    try {
      playlists.push(
        await resolvePlaylist(file, rootPath, canonicalRootPath, songsByPath)
      )
    } catch (error) {
      console.warn(`Playlist M3U illisible: ${file.path}`, error)
      playlists.push({
        id: generatePlaylistId(file.relativePath),
        name: basename(file.path, extname(file.path)),
        relativePath: file.relativePath,
        songIds: [],
        songCount: 0,
        missingSongCount: 0,
      })
    }
  }

  playlists.sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'fr') ||
      a.relativePath.localeCompare(b.relativePath)
  )
  catalogCache = { rootPath, filesSignature, songsSignature, playlists }
  return playlists
}

export async function getPlaylistById(
  playlistId: string,
  providedSongs?: Song[]
): Promise<ResolvedPlaylist | null> {
  const playlists = await getPlaylistCatalog(providedSongs)
  return playlists.find((playlist) => playlist.id === playlistId) || null
}

export function clearPlaylistCatalogCache(): void {
  catalogCache = null
}
