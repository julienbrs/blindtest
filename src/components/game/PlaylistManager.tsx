'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MusicalNoteIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import type { Playlist, Song } from '@/lib/types'
import { usePlaylists } from '@/hooks/usePlaylists'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface PlaylistManagerProps {
  selectedPlaylistId: string | null
  onSelect: (playlistId: string | null) => void
  onClose?: () => void
}

export function PlaylistManager({
  selectedPlaylistId,
  onSelect,
  onClose,
}: PlaylistManagerProps) {
  const {
    playlists,
    isLoaded,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  } = usePlaylists()

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)

  const handleCreate = useCallback(() => {
    if (newName.trim()) {
      const playlist = createPlaylist(newName.trim())
      setNewName('')
      setIsCreating(false)
      // Open editor for the new playlist
      setEditingPlaylist(playlist)
      setShowEditor(true)
    }
  }, [newName, createPlaylist])

  const handleStartEdit = useCallback((playlist: Playlist) => {
    setEditingId(playlist.id)
    setEditName(playlist.name)
  }, [])

  const handleSaveEdit = useCallback(
    (id: string) => {
      if (editName.trim()) {
        updatePlaylist(id, { name: editName.trim() })
      }
      setEditingId(null)
      setEditName('')
    },
    [editName, updatePlaylist]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditName('')
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      deletePlaylist(id)
      if (selectedPlaylistId === id) {
        onSelect(null)
      }
    },
    [deletePlaylist, selectedPlaylistId, onSelect]
  )

  const handleEditSongs = useCallback((playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setShowEditor(true)
  }, [])

  // Show song editor
  if (showEditor && editingPlaylist) {
    return (
      <PlaylistEditor
        playlist={editingPlaylist}
        onClose={() => {
          setShowEditor(false)
          setEditingPlaylist(null)
        }}
        onUpdate={(songIds) => {
          updatePlaylist(editingPlaylist.id, { songIds })
        }}
      />
    )
  }

  if (!isLoaded) {
    return (
      <div className="p-4 text-center text-purple-300">
        Chargement des playlists...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MusicalNoteIcon className="h-5 w-5 text-purple-400" />
          Mes playlists
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* All songs option */}
      <button
        onClick={() => onSelect(null)}
        className={`flex w-full items-center justify-between rounded-lg p-3 transition-all ${
          selectedPlaylistId === null
            ? 'border-2 border-purple-400 bg-purple-500/30'
            : 'border-2 border-transparent bg-white/5 hover:bg-white/10'
        }`}
      >
        <span className="font-medium">Toute la bibliothèque</span>
        {selectedPlaylistId === null && (
          <CheckIcon className="h-5 w-5 text-purple-400" />
        )}
      </button>

      {/* Playlist list */}
      {playlists.length > 0 && (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`group rounded-lg transition-all ${
                selectedPlaylistId === playlist.id
                  ? 'border-2 border-purple-400 bg-purple-500/30'
                  : 'border-2 border-transparent bg-white/5 hover:bg-white/10'
              }`}
            >
              {editingId === playlist.id ? (
                <div className="flex items-center gap-2 p-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(playlist.id)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-400"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(playlist.id)}
                    className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-500/20"
                    aria-label="Sauvegarder"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
                    aria-label="Annuler"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center p-3">
                  <button
                    onClick={() => onSelect(playlist.id)}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium">{playlist.name}</div>
                      <div className="text-sm text-purple-300">
                        {playlist.songIds.length}{' '}
                        {playlist.songIds.length === 1 ? 'chanson' : 'chansons'}
                      </div>
                    </div>
                    {selectedPlaylistId === playlist.id && (
                      <CheckIcon className="h-5 w-5 text-purple-400" />
                    )}
                  </button>
                  <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSongs(playlist)
                      }}
                      className="rounded-lg p-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Modifier les chansons"
                      title="Modifier les chansons"
                    >
                      <MusicalNoteIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(playlist)
                      }}
                      className="rounded-lg p-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Renommer"
                      title="Renommer"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(playlist.id)
                      }}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
                      aria-label="Supprimer"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new playlist */}
      {isCreating ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewName('')
              }
            }}
            placeholder="Nom de la playlist..."
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white placeholder-purple-300/50 outline-none focus:ring-2 focus:ring-purple-400"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Créer"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setIsCreating(false)
              setNewName('')
            }}
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
            aria-label="Annuler"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center justify-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nouvelle playlist
        </Button>
      )}
    </div>
  )
}

// ============================================
// Playlist Editor Component
// ============================================

interface PlaylistEditorProps {
  playlist: Playlist
  onClose: () => void
  onUpdate: (songIds: string[]) => void
}

function PlaylistEditor({ playlist, onClose, onUpdate }: PlaylistEditorProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(playlist.songIds)
  )
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all songs from the library
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch('/api/songs')
        if (res.ok) {
          const data = await res.json()
          setSongs(data.songs || [])
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchSongs()
  }, [])

  const toggleSong = useCallback((songId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    onUpdate(Array.from(selectedIds))
    onClose()
  }, [selectedIds, onUpdate, onClose])

  const handleSelectAll = useCallback(() => {
    const filteredSongs = songs.filter(
      (song) =>
        searchQuery === '' ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSelectedIds(new Set(filteredSongs.map((s) => s.id)))
  }, [songs, searchQuery])

  const handleSelectNone = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Filter songs by search query
  const filteredSongs = songs.filter(
    (song) =>
      searchQuery === '' ||
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="flex max-h-[70vh] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{playlist.name}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-purple-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher une chanson..."
        className="mb-3 w-full rounded-lg bg-white/10 px-3 py-2 text-white placeholder-purple-300/50 outline-none focus:ring-2 focus:ring-purple-400"
      />

      {/* Selection controls */}
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-purple-300">
          {selectedIds.size} chanson{selectedIds.size !== 1 ? 's' : ''}{' '}
          sélectionnée{selectedIds.size !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-purple-300 transition-colors hover:text-white"
          >
            Tout sélectionner
          </button>
          <span className="text-purple-500">|</span>
          <button
            onClick={handleSelectNone}
            className="text-purple-300 transition-colors hover:text-white"
          >
            Désélectionner tout
          </button>
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center text-purple-300">
            Chargement des chansons...
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="py-8 text-center text-purple-300">
            {searchQuery
              ? 'Aucune chanson ne correspond à la recherche.'
              : 'Aucune chanson disponible.'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSongs.map((song) => (
              <button
                key={song.id}
                onClick={() => toggleSong(song.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 transition-all ${
                  selectedIds.has(song.id)
                    ? 'bg-purple-500/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                    selectedIds.has(song.id)
                      ? 'border-purple-400 bg-purple-400'
                      : 'border-white/50'
                  }`}
                >
                  {selectedIds.has(song.id) && (
                    <CheckIcon className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{song.title}</div>
                  <div className="text-sm text-purple-300">{song.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Enregistrer
        </Button>
      </div>
    </Card>
  )
}
