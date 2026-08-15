'use client'

import {
  CheckIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
} from '@heroicons/react/24/solid'
import type { PlaylistSummary } from '@/lib/types'

interface PlaylistSelectorProps {
  playlists: PlaylistSummary[]
  selectedPlaylistId: string | null
  onSelect?: (playlistId: string | null) => void
  isLoading?: boolean
  error?: string | null
  readOnly?: boolean
}

function songLabel(count: number): string {
  return `${count} ${count === 1 ? 'morceau' : 'morceaux'}`
}

function missingSongLabel(count: number): string {
  return `${songLabel(count)} ${count === 1 ? 'introuvable' : 'introuvables'}`
}

export function PlaylistSelector({
  playlists,
  selectedPlaylistId,
  onSelect,
  isLoading = false,
  error = null,
  readOnly = false,
}: PlaylistSelectorProps) {
  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId
  )

  if (readOnly) {
    const selectedName = selectedPlaylistId
      ? isLoading
        ? 'Chargement de la playlist…'
        : selectedPlaylist?.name || 'Playlist indisponible'
      : 'Toute la bibliothèque'

    return (
      <div className="rounded-lg bg-white/5 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-white">
          <QueueListIcon className="h-5 w-5 text-purple-400" />
          {selectedName}
        </div>
        {selectedPlaylist && (
          <div className="mt-1 text-purple-300">
            {songLabel(selectedPlaylist.songCount)}
          </div>
        )}
        {selectedPlaylist && selectedPlaylist.missingSongCount > 0 && (
          <div className="mt-2 flex gap-2 text-amber-300">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
            {missingSongLabel(selectedPlaylist.missingSongCount)}
          </div>
        )}
        {error && <div className="mt-2 text-red-300">{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid="playlist-selector">
      <button
        type="button"
        onClick={() => onSelect?.(null)}
        aria-pressed={selectedPlaylistId === null}
        className={`flex min-h-[48px] w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
          selectedPlaylistId === null
            ? 'border-purple-400 bg-purple-500/30'
            : 'border-transparent bg-white/5 hover:bg-white/10'
        }`}
      >
        <span className="font-medium">Toute la bibliothèque</span>
        {selectedPlaylistId === null && (
          <CheckIcon className="h-5 w-5 text-purple-400" />
        )}
      </button>

      {isLoading && (
        <div className="p-3 text-center text-sm text-purple-300">
          Chargement des playlists…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-500/15 p-3 text-red-200">
          {error}
        </div>
      )}

      {!isLoading && !error && playlists.length === 0 && (
        <p className="px-1 text-sm text-purple-300">
          Aucune playlist M3U n'est disponible.
        </p>
      )}

      {playlists.map((playlist) => {
        const isSelected = selectedPlaylistId === playlist.id
        const isEmpty = playlist.songCount === 0
        return (
          <button
            key={playlist.id}
            type="button"
            onClick={() => onSelect?.(playlist.id)}
            disabled={isEmpty}
            aria-pressed={isSelected}
            className={`flex min-h-[56px] w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
              isSelected
                ? 'border-purple-400 bg-purple-500/30'
                : 'border-transparent bg-white/5 hover:bg-white/10'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span>
              <span className="block font-medium">{playlist.name}</span>
              <span className="block text-sm text-purple-300">
                {isEmpty ? 'Playlist vide' : songLabel(playlist.songCount)}
              </span>
              {playlist.missingSongCount > 0 && (
                <span className="mt-1 flex items-center gap-1 text-xs text-amber-300">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {missingSongLabel(playlist.missingSongCount)}
                </span>
              )}
            </span>
            {isSelected && <CheckIcon className="h-5 w-5 text-purple-400" />}
          </button>
        )
      })}
    </div>
  )
}
