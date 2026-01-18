'use client'

import { useEffect, useState, useRef } from 'react'
import { MusicalNoteIcon, UserGroupIcon } from '@heroicons/react/24/solid'

interface Stats {
  totalSongs: number
  totalArtists: number
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  audioFolderPath: string | null
}

interface LibraryStatsProps {
  onEmptyLibrary?: (isEmpty: boolean, audioFolderPath: string | null) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export function LibraryStats({
  onEmptyLibrary,
  onLoadingChange,
}: LibraryStatsProps = {}) {
  const [stats, setStats] = useState<Stats>({
    totalSongs: 0,
    totalArtists: 0,
    isLoading: true,
    error: null,
    isEmpty: false,
    audioFolderPath: null,
  })

  // Track if we've already fetched to prevent duplicate calls
  const hasFetched = useRef(false)

  useEffect(() => {
    // Prevent duplicate fetches (React StrictMode, re-mounts, etc.)
    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) {
          // Check if it's an empty library error
          if (res.status === 404) {
            const data = await res.json()
            if (data.error === 'EMPTY_LIBRARY') {
              setStats((prev) => ({
                ...prev,
                isLoading: false,
                isEmpty: true,
                audioFolderPath: data.audioFolderPath || 'Non défini',
              }))
              onEmptyLibrary?.(true, data.audioFolderPath || 'Non défini')
              onLoadingChange?.(false)
              return
            }
          }
          throw new Error('Erreur chargement stats')
        }
        const data = await res.json()
        setStats({
          totalSongs: data.totalSongs,
          totalArtists: data.totalArtists,
          isLoading: false,
          error: null,
          isEmpty: false,
          audioFolderPath: null,
        })
        onEmptyLibrary?.(false, null)
        onLoadingChange?.(false)
      } catch {
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Impossible de charger les statistiques',
        }))
        onLoadingChange?.(false)
      }
    }
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (stats.isLoading) {
    return (
      <p className="mt-8 animate-pulse text-purple-300">
        Chargement de la bibliothèque...
      </p>
    )
  }

  if (stats.error) {
    return <p className="mt-8 text-red-400">{stats.error}</p>
  }

  return (
    <div className="mt-8 text-center text-purple-200">
      <div className="flex items-center justify-center gap-6 text-lg">
        <span className="flex items-center gap-2">
          <MusicalNoteIcon className="h-5 w-5 text-pink-400" />
          <span className="font-bold text-white">{stats.totalSongs}</span>{' '}
          chansons
        </span>
        <span className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-purple-400" />
          <span className="font-bold text-white">
            {stats.totalArtists}
          </span>{' '}
          artistes
        </span>
      </div>
      <p className="mt-1 text-sm">prêtes à vous tester !</p>
    </div>
  )
}
