// Placeholder - will be fully implemented in Epic 5
import type { Song, GuessMode } from '@/lib/types'

interface SongRevealProps {
  song: Song | null
  isRevealed: boolean
  guessMode: GuessMode
}

export function SongReveal({ song, isRevealed, guessMode }: SongRevealProps) {
  if (!song) {
    return (
      <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/10">
        <p className="text-purple-300">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pochette placeholder */}
      <div className="relative h-64 w-64 overflow-hidden rounded-2xl bg-white/10 shadow-2xl">
        <div className="flex h-full items-center justify-center">
          <span className="text-6xl">🎵</span>
        </div>
      </div>

      {/* Informations - shown when revealed */}
      {isRevealed && (
        <div className="animate-fade-in text-center">
          {(guessMode === 'title' || guessMode === 'both') && (
            <h2 className="text-2xl font-bold">{song.title}</h2>
          )}
          {(guessMode === 'artist' || guessMode === 'both') && (
            <p className="text-xl text-purple-200">{song.artist}</p>
          )}
          {song.album && (
            <p className="mt-1 text-sm text-purple-400">{song.album}</p>
          )}
        </div>
      )}
    </div>
  )
}
