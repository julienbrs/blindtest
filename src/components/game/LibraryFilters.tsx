'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'

export interface LibraryFiltersState {
  selectedArtists: string[]
  yearMin: number | null
  yearMax: number | null
}

interface LibraryFiltersProps {
  filters: LibraryFiltersState
  onChange: (filters: LibraryFiltersState) => void
  filteredCount: number
  totalCount: number
}

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = 1950

export function LibraryFilters({
  filters,
  onChange,
  filteredCount,
  totalCount,
}: LibraryFiltersProps) {
  const [artists, setArtists] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load available artists
  useEffect(() => {
    const loadArtists = async () => {
      try {
        const res = await fetch('/api/artists')
        if (res.ok) {
          const data = await res.json()
          setArtists(data.artists || [])
        }
      } catch {
        // Silently fail - artists list is optional
      } finally {
        setIsLoading(false)
      }
    }
    loadArtists()
  }, [])

  const handleArtistToggle = (artist: string) => {
    const newSelected = filters.selectedArtists.includes(artist)
      ? filters.selectedArtists.filter((a) => a !== artist)
      : [...filters.selectedArtists, artist]
    onChange({ ...filters, selectedArtists: newSelected })
  }

  const handleYearMinChange = (value: string) => {
    const year = value ? parseInt(value, 10) : null
    onChange({ ...filters, yearMin: year })
  }

  const handleYearMaxChange = (value: string) => {
    const year = value ? parseInt(value, 10) : null
    onChange({ ...filters, yearMax: year })
  }

  const clearFilters = () => {
    onChange({
      selectedArtists: [],
      yearMin: null,
      yearMax: null,
    })
  }

  const hasFilters =
    filters.selectedArtists.length > 0 ||
    filters.yearMin !== null ||
    filters.yearMax !== null

  const isFiltered = filteredCount !== totalCount

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors min-h-[44px]"
      >
        <FunnelIcon className="h-5 w-5" />
        <span className="font-medium">Filtrer la bibliothèque</span>
        {isFiltered && (
          <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
            {filteredCount} / {totalCount}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="bg-white/5 rounded-lg p-4 space-y-4 animate-fade-in">
          {/* Artist filter */}
          <div className="space-y-2">
            <label className="block text-sm text-purple-300 font-medium">
              Artistes
            </label>
            {isLoading ? (
              <div className="text-sm text-white/50">Chargement...</div>
            ) : artists.length === 0 ? (
              <div className="text-sm text-white/50">Aucun artiste trouvé</div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {artists.map((artist) => {
                  const isSelected = filters.selectedArtists.includes(artist)
                  return (
                    <button
                      key={artist}
                      type="button"
                      onClick={() => handleArtistToggle(artist)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors min-h-[36px] ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {artist}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Year range filter */}
          <div className="space-y-2">
            <label className="block text-sm text-purple-300 font-medium">
              Période
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min={MIN_YEAR}
                  max={CURRENT_YEAR}
                  placeholder="De"
                  value={filters.yearMin ?? ''}
                  onChange={(e) => handleYearMinChange(e.target.value)}
                  className="w-full bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                />
              </div>
              <span className="text-white/50">à</span>
              <div className="flex-1">
                <input
                  type="number"
                  min={MIN_YEAR}
                  max={CURRENT_YEAR}
                  placeholder="Jusqu'à"
                  value={filters.yearMax ?? ''}
                  onChange={(e) => handleYearMaxChange(e.target.value)}
                  className="w-full bg-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors min-h-[44px]"
            >
              <XMarkIcon className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          )}

          {/* Filtered count display */}
          <div className="text-sm text-white/70 border-t border-white/10 pt-3">
            {isFiltered ? (
              <span>
                <span className="text-purple-300 font-medium">
                  {filteredCount}
                </span>{' '}
                chanson{filteredCount !== 1 ? 's' : ''} sur {totalCount}{' '}
                sélectionnée{filteredCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>
                <span className="text-purple-300 font-medium">
                  {totalCount}
                </span>{' '}
                chanson{totalCount !== 1 ? 's' : ''} disponible
                {totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const defaultFilters: LibraryFiltersState = {
  selectedArtists: [],
  yearMin: null,
  yearMax: null,
}
