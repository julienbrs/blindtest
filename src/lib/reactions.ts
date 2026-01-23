/**
 * Live reactions system for multiplayer games
 *
 * Allows players to send emoji reactions during gameplay,
 * Twitch-style, that float up from the bottom of the screen.
 */

export const REACTIONS = [
  '👏',
  '🔥',
  '😱',
  '😂',
  '🎉',
  '❤️',
  '💀',
  '🤯',
] as const

export type Reaction = (typeof REACTIONS)[number]

/**
 * A reaction event from a player
 */
export interface ReactionEvent {
  id: string
  emoji: Reaction
  playerId: string
  playerNickname: string
  timestamp: number
}
