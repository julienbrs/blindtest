import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  clearPlaylistCatalogCache,
  getPlaylistCatalog,
  parseM3u,
} from './playlistScanner'
import type { Song } from './types'

function song(id: string, filePath: string): Song {
  return {
    id,
    title: id,
    artist: 'Artiste',
    duration: 180,
    filePath,
    format: filePath.endsWith('.flac') ? 'flac' : 'mp3',
    hasCover: false,
  }
}

describe('playlistScanner', () => {
  let libraryPath: string
  let outsidePath: string
  const previousAudioPath = process.env.AUDIO_FOLDER_PATH

  beforeEach(async () => {
    libraryPath = await mkdtemp(join(tmpdir(), 'blindtest-library-'))
    outsidePath = await mkdtemp(join(tmpdir(), 'blindtest-outside-'))
    process.env.AUDIO_FOLDER_PATH = libraryPath
    clearPlaylistCatalogCache()
  })

  afterEach(async () => {
    clearPlaylistCatalogCache()
    if (previousAudioPath === undefined) {
      delete process.env.AUDIO_FOLDER_PATH
    } else {
      process.env.AUDIO_FOLDER_PATH = previousAudioPath
    }
    await rm(libraryPath, { recursive: true, force: true })
    await rm(outsidePath, { recursive: true, force: true })
  })

  it('parse UTF-8 BOM, CRLF, #PLAYLIST et #EXTINF', () => {
    const parsed = parseM3u(
      '\uFEFF#EXTM3U\r\n#PLAYLIST: Tubes du soir\r\n#EXTINF:123,Artiste - Titre\r\n./titre.mp3\r\n\r\n'
    )

    expect(parsed).toEqual({
      name: 'Tubes du soir',
      entries: ['./titre.mp3'],
    })
  })

  it('résout les chemins relatifs et absolus, déduplique et ignore URLs et traversées', async () => {
    const playlistDirectory = join(libraryPath, 'playlists')
    const artistDirectory = join(libraryPath, 'artist')
    const firstSongPath = join(artistDirectory, 'first.mp3')
    const secondSongPath = join(artistDirectory, 'second.flac')
    const outsideSongPath = join(outsidePath, 'outside.mp3')
    await mkdir(playlistDirectory)
    await mkdir(artistDirectory)
    await writeFile(firstSongPath, 'audio')
    await writeFile(secondSongPath, 'audio')
    await writeFile(outsideSongPath, 'audio')
    await writeFile(
      join(playlistDirectory, 'party.m3u8'),
      [
        '#EXTM3U',
        '#PLAYLIST: Party',
        '../artist/first.mp3',
        '../artist/first.mp3',
        '../artist/missing.mp3',
        secondSongPath,
        'https://example.test/stream.mp3',
        outsideSongPath,
        '../../outside.mp3',
        '../artist/notes.txt',
      ].join('\n')
    )

    const playlists = await getPlaylistCatalog([
      song('first', firstSongPath),
      song('second', secondSongPath),
    ])

    expect(playlists).toHaveLength(1)
    expect(playlists[0]).toMatchObject({
      name: 'Party',
      songIds: ['first', 'second'],
      songCount: 2,
      missingSongCount: 1,
    })
  })

  it('garde une playlist partielle jouable et désactive naturellement une playlist vide', async () => {
    const validSongPath = join(libraryPath, 'valid.mp3')
    await writeFile(validSongPath, 'audio')
    await writeFile(
      join(libraryPath, 'partial.m3u'),
      './valid.mp3\n./missing.mp3\n'
    )
    await writeFile(join(libraryPath, 'empty.m3u'), './lost.mp3\n')

    const playlists = await getPlaylistCatalog([song('valid', validSongPath)])
    const partial = playlists.find((playlist) => playlist.name === 'partial')
    const empty = playlists.find((playlist) => playlist.name === 'empty')

    expect(partial).toMatchObject({ songCount: 1, missingSongCount: 1 })
    expect(empty).toMatchObject({ songCount: 0, missingSongCount: 1 })
  })

  it('conserve l’ID quand le contenu change et détecte automatiquement les ajouts M3U', async () => {
    const audioPath = join(libraryPath, 'track.mp3')
    const firstPlaylistPath = join(libraryPath, 'first.m3u')
    await writeFile(audioPath, 'audio')
    await writeFile(firstPlaylistPath, '#PLAYLIST: First\n./track.mp3\n')
    const songs = [song('track', audioPath)]

    const firstCatalog = await getPlaylistCatalog(songs)
    const stableId = firstCatalog[0].id

    await writeFile(
      firstPlaylistPath,
      '#PLAYLIST: First renamed\n#EXTINF:1,Track\n./track.mp3\n'
    )
    await writeFile(join(libraryPath, 'second.m3u8'), './track.mp3\n')

    const updatedCatalog = await getPlaylistCatalog(songs)
    expect(updatedCatalog).toHaveLength(2)
    expect(
      updatedCatalog.find((playlist) => playlist.relativePath === 'first.m3u')
    ).toMatchObject({ id: stableId, name: 'First renamed' })
  })

  it('reclasse un morceau déplacé comme introuvable après le rescan audio', async () => {
    const originalPath = join(libraryPath, 'original.mp3')
    const movedPath = join(libraryPath, 'moved.mp3')
    await writeFile(originalPath, 'audio')
    await writeFile(join(libraryPath, 'move.m3u'), './original.mp3\n')

    expect(
      (await getPlaylistCatalog([song('original', originalPath)]))[0]
    ).toMatchObject({ songCount: 1, missingSongCount: 0 })

    await rename(originalPath, movedPath)
    const rescannedCatalog = await getPlaylistCatalog([
      song('moved', movedPath),
    ])
    expect(rescannedCatalog[0]).toMatchObject({
      songCount: 0,
      missingSongCount: 1,
    })
  })
})
