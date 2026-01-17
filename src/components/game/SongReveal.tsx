'use client'

import Image from 'next/image'
import type { Song, GuessMode } from '@/lib/types'

interface SongRevealProps {
  song: Song | null
  isRevealed: boolean
  guessMode: GuessMode
}

export function SongReveal({ song, isRevealed, guessMode }: SongRevealProps) {
  if (!song) {
    return (
      <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-sm">
        <p className="text-purple-300">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pochette */}
      <div className="relative h-64 w-64 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <Image
          src={`/api/cover/${song.id}`}
          alt="Pochette album"
          fill
          className={`object-cover transition-all duration-500 ${
            isRevealed ? '' : 'scale-110 blur-xl'
          }`}
        />
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🎵</span>
          </div>
        )}
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
