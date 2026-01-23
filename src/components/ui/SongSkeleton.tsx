'use client'

import { Skeleton } from './Skeleton'

/**
 * SongSkeleton - Loading placeholder for song info display
 *
 * Matches the layout of SongReveal component:
 * - Album cover placeholder (square, responsive sizes)
 * - Title placeholder
 * - Artist placeholder
 *
 * Uses glass-morphism style consistent with the app design.
 */
export function SongSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 landscape:gap-2 sm:gap-4">
      {/* Album cover skeleton - matches SongReveal dimensions */}
      <Skeleton className="h-48 w-48 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] landscape:h-36 landscape:w-36 sm:h-56 sm:w-56 md:h-64 md:w-64 landscape:md:h-48 landscape:md:w-48" />

      {/* Song info skeleton */}
      <div className="flex flex-col items-center gap-2">
        {/* Title placeholder */}
        <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
        {/* Artist placeholder */}
        <Skeleton className="h-5 w-28 sm:h-6 sm:w-32" />
        {/* Album placeholder */}
        <Skeleton className="h-3 w-24 sm:h-4 sm:w-28" />
      </div>
    </div>
  )
}
