'use client'

import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  avatar?: string | null
  nickname: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * PlayerAvatar - Displays a player's avatar (emoji) or fallback (first letter)
 *
 * Features:
 * - Displays emoji avatar in a styled circle
 * - Falls back to first letter of nickname if no avatar
 * - Three sizes: sm (32px), md (40px), lg (56px)
 * - Gradient background for visual consistency
 */
export function PlayerAvatar({
  avatar,
  nickname,
  size = 'md',
  className,
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-3xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-purple-500/30 to-pink-500/30',
        'flex-shrink-0',
        sizeClasses[size],
        className
      )}
      title={nickname}
    >
      {avatar || nickname.charAt(0).toUpperCase()}
    </div>
  )
}
