'use client'

import { Skeleton } from './Skeleton'

interface PlayerListSkeletonProps {
  count?: number
}

/**
 * PlayerListSkeleton - Loading placeholder for player list in lobby
 *
 * Matches the layout of PlayerCard component:
 * - Online indicator dot
 * - Player nickname
 * - Host badge placeholder
 *
 * Uses glass-morphism style consistent with the app design.
 *
 * @param count - Number of skeleton items to show (default: 3)
 */
export function PlayerListSkeleton({ count = 3 }: PlayerListSkeletonProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <PlayerCardSkeleton key={index} showHostBadge={index === 0} />
      ))}
    </div>
  )
}

interface PlayerCardSkeletonProps {
  showHostBadge?: boolean
}

/**
 * PlayerCardSkeleton - Single player card loading placeholder
 */
function PlayerCardSkeleton({ showHostBadge = false }: PlayerCardSkeletonProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        {/* Online indicator placeholder */}
        <Skeleton className="h-3 w-3 rounded-full" />

        {/* Player name placeholder */}
        <Skeleton className="h-5 w-24 sm:w-32" />
      </div>

      <div className="flex items-center gap-2">
        {/* Host badge placeholder */}
        {showHostBadge && <Skeleton className="h-6 w-14 rounded-full" />}
      </div>
    </div>
  )
}
