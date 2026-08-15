'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlaylistSummary } from '@/lib/types'

interface PlaylistCatalogResponse {
  playlists: PlaylistSummary[]
  error?: string
}

export function usePlaylistCatalog() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadPlaylists() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/playlists', {
          signal: controller.signal,
        })
        const data = (await response.json()) as PlaylistCatalogResponse
        if (!response.ok) {
          throw new Error(data.error || 'Catalogue de playlists indisponible')
        }

        setPlaylists(Array.isArray(data.playlists) ? data.playlists : [])
        setIsLoaded(true)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') {
          return
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Catalogue de playlists indisponible'
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadPlaylists()
    return () => controller.abort()
  }, [reloadKey])

  return { playlists, isLoading, isLoaded, error, refresh }
}
