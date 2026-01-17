'use client'

import { useEffect, useState } from 'react'
import { MusicalNoteIcon, UserGroupIcon } from '@heroicons/react/24/solid'

interface Stats {
  totalSongs: number
  totalArtists: number
  isLoading: boolean
  error: string | null
}

export function LibraryStats() {
  const [stats, setStats] = useState<Stats>({
    totalSongs: 0,
    totalArtists: 0,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) throw new Error('Erreur chargement stats')
        const data = await res.json()
        setStats({
          totalSongs: data.totalSongs,
          totalArtists: data.totalArtists,
          isLoading: false,
          error: null,
        })
      } catch {
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Impossible de charger les statistiques',
        }))
      }
    }
    fetchStats()
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
