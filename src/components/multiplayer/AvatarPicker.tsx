'use client'

import { AVATARS, getAvailableAvatars, type Avatar } from '@/lib/avatars'
import { cn } from '@/lib/utils'

interface AvatarPickerProps {
  value: Avatar | null
  onChange: (avatar: Avatar) => void
  takenAvatars: Avatar[]
  className?: string
}

/**
 * AvatarPicker - Grid of emoji avatars for player selection
 *
 * Features:
 * - Displays all available avatars in a grid
 * - Shows which avatars are already taken (greyed out, disabled)
 * - Highlights the currently selected avatar
 * - Calls onChange when a new avatar is selected
 */
export function AvatarPicker({
  value,
  onChange,
  takenAvatars,
  className = '',
}: AvatarPickerProps) {
  const availableAvatars = getAvailableAvatars(takenAvatars)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm text-purple-200">Choisissez votre avatar</label>
      <div className="grid grid-cols-5 gap-2">
        {AVATARS.map((emoji) => {
          const isTaken = takenAvatars.includes(emoji)
          const isSelected = value === emoji

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => !isTaken && onChange(emoji)}
              disabled={isTaken}
              aria-label={`Avatar ${emoji}${isTaken ? ' (pris)' : ''}${isSelected ? ' (sélectionné)' : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all',
                isSelected &&
                  'ring-2 ring-pink-400 bg-gradient-to-br from-purple-500/30 to-pink-500/30 scale-110',
                isTaken && 'opacity-30 cursor-not-allowed',
                !isTaken &&
                  !isSelected &&
                  'hover:bg-white/10 hover:scale-105 active:scale-95'
              )}
            >
              {emoji}
            </button>
          )
        })}
      </div>
      {availableAvatars.length === 0 && (
        <p className="text-sm text-red-300">
          Tous les avatars sont pris. Attendez qu&apos;un joueur quitte.
        </p>
      )}
    </div>
  )
}
