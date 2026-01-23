'use client'

import { TrophyIcon } from '@heroicons/react/24/solid'
import { Skeleton } from './Skeleton'

interface LeaderboardSkeletonProps {
  count?: number
  compact?: boolean
  className?: string
}

/**
 * LeaderboardSkeleton - Loading placeholder for in-game leaderboard
 *
 * Matches the layout of Leaderboard component:
 * - Header with trophy icon
 * - Position indicator (medal for top 3)
 * - Player info (online indicator + nickname)
 * - Score
 *
 * Uses glass-morphism style consistent with the app design.
 *
 * @param count - Number of skeleton entries to show (default: 4)
 * @param compact - Whether to use compact styling
 * @param className - Additional CSS classes
 */
export function LeaderboardSkeleton({
  count = 4,
  compact = false,
  className = '',
}: LeaderboardSkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-white/5 backdrop-blur-sm ${
        compact ? 'p-2' : 'p-4'
      } ${className}`}
    >
      {/* Header */}
      <div className={`mb-3 flex items-center gap-2 ${compact ? 'px-1' : ''}`}>
        <TrophyIcon className="h-5 w-5 text-yellow-500" />
        <span className="font-semibold text-white">Classement</span>
        <Skeleton className="h-4 w-6" />
      </div>

      {/* Entries */}
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
        {Array.from({ length: count }).map((_, index) => (
          <LeaderboardEntrySkeleton key={index} position={index + 1} />
        ))}
      </div>
    </div>
  )
}

interface LeaderboardEntrySkeletonProps {
  position: number
}

/**
 * LeaderboardEntrySkeleton - Single leaderboard entry loading placeholder
 */
function LeaderboardEntrySkeleton({ position }: LeaderboardEntrySkeletonProps) {
  const isMedal = position <= 3

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
      {/* Position indicator */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        {isMedal ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <Skeleton className="h-4 w-4" />
        )}
      </div>

      {/* Player info */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Online indicator */}
        <Skeleton className="h-2 w-2 flex-shrink-0 rounded-full" />
        {/* Nickname */}
        <Skeleton className="h-4 w-20 sm:w-28" />
      </div>

      {/* Score */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-3 w-6" />
      </div>
    </div>
  )
}
