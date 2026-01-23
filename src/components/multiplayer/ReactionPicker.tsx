'use client'

import { REACTIONS, type Reaction } from '@/lib/reactions'
import { cn } from '@/lib/utils'

export interface ReactionPickerProps {
  /** Callback when a reaction is selected */
  onReact: (emoji: Reaction) => void
  /** Optional className for styling */
  className?: string
}

/**
 * ReactionPicker - A horizontal bar of emoji reactions for multiplayer games
 *
 * Displays the 8 available reaction emojis in a compact, accessible bar.
 * Each button triggers the onReact callback with the selected emoji.
 *
 * Rate limiting is handled by the useReactions hook, not this component.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const { sendReaction } = useReactions({ roomCode, playerId, nickname });
 *
 *   return <ReactionPicker onReact={sendReaction} />;
 * }
 * ```
 */
export function ReactionPicker({ onReact, className }: ReactionPickerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2',
        className
      )}
      role="toolbar"
      aria-label="Reactions"
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className={cn(
            'w-10 h-10 text-xl rounded-full',
            'transition-transform duration-150',
            'hover:scale-125 hover:bg-white/10',
            'active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent'
          )}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
