'use client'

import Image from 'next/image'
import { MusicalNoteIcon } from '@heroicons/react/24/solid'
import type { Song, GuessMode } from '@/lib/types'

// Base64 1x1 purple blur placeholder for instant loading
const PLACEHOLDER_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOUl5NaAwABfgDfMlTqNgAAAABJRU5ErkJggg=='

interface SongRevealProps {
  song: Song | null
  isRevealed: boolean
  guessMode: GuessMode
}

export function SongReveal({ song, isRevealed, guessMode }: SongRevealProps) {
  if (!song) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-sm sm:h-56 sm:w-56 md:h-64 md:w-64">
        <p className="text-sm text-purple-300 sm:text-base">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      {/* Pochette - Responsive size: smaller on mobile, larger on desktop */}
      <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:h-56 sm:w-56 md:h-64 md:w-64">
        <Image
          src={`/api/cover/${song.id}`}
          alt="Pochette album"
          fill
          sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
          quality={75}
          placeholder="blur"
          blurDataURL={PLACEHOLDER_BLUR}
          priority
          className={`object-cover transition-all duration-500 ${
            isRevealed ? '' : 'scale-110 blur-xl'
          }`}
        />
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <MusicalNoteIcon className="h-12 w-12 text-white/80 sm:h-14 sm:w-14 md:h-16 md:w-16" />
          </div>
        )}
      </div>

      {/* Informations - shown when revealed */}
      {isRevealed && (
        <div className="animate-fade-in max-w-xs px-2 text-center sm:max-w-sm sm:px-0">
          {(guessMode === 'title' || guessMode === 'both') && (
            <h2 className="text-xl font-bold sm:text-2xl">{song.title}</h2>
          )}
          {(guessMode === 'artist' || guessMode === 'both') && (
            <p className="text-lg text-purple-200 sm:text-xl">{song.artist}</p>
          )}
          {song.album && (
            <p className="mt-1 text-xs text-purple-400 sm:text-sm">
              {song.album}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
