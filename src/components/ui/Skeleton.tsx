'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Base Skeleton component with glass-morphism style
 *
 * Features:
 * - Glass-morphism style (backdrop-blur + bg-white/10)
 * - Pulse animation (respects prefers-reduced-motion via globals.css)
 * - Customizable dimensions via className
 *
 * Usage:
 * <Skeleton className="w-32 h-6" /> // Text placeholder
 * <Skeleton className="w-48 h-48 rounded-xl" /> // Image placeholder
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/10 backdrop-blur-sm',
        className
      )}
    />
  )
}
