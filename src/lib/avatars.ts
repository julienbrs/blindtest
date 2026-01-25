/**
 * Avatar system for multiplayer game
 *
 * Provides a predefined set of fun emoji avatars that players can choose from.
 * Each avatar must be unique within a room.
 */

export const AVATARS = [
  '🎸',
  '🎤',
  '🎹',
  '🎺',
  '🎷',
  '🥁',
  '🎻',
  '🪗',
  '🎵',
  '🎶',
  '🦄',
  '🌟',
  '⭐',
  '🔥',
  '💎',
  '🎯',
  '🏆',
  '👑',
  '🦋',
  '🌈',
] as const

export type Avatar = (typeof AVATARS)[number]

const AVATAR_STORAGE_KEY = 'blindtest-avatar'

/**
 * Get available avatars (excluding those already taken in the room)
 */
export function getAvailableAvatars(takenAvatars: Avatar[]): Avatar[] {
  return AVATARS.filter((a) => !takenAvatars.includes(a))
}

/**
 * Get the user's previously saved avatar from localStorage
 */
export function getSavedAvatar(): Avatar | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(AVATAR_STORAGE_KEY)
  if (saved && AVATARS.includes(saved as Avatar)) {
    return saved as Avatar
  }
  return null
}

/**
 * Save the user's avatar choice to localStorage
 */
export function saveAvatar(avatar: Avatar): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AVATAR_STORAGE_KEY, avatar)
}

/**
 * Check if an avatar is valid (part of the predefined set)
 */
export function isValidAvatar(avatar: string): avatar is Avatar {
  return AVATARS.includes(avatar as Avatar)
}

/**
 * Get the first available avatar, preferring the saved one if available
 */
export function getDefaultAvatar(takenAvatars: Avatar[]): Avatar | null {
  const saved = getSavedAvatar()
  if (saved && !takenAvatars.includes(saved)) {
    return saved
  }
  const available = getAvailableAvatars(takenAvatars)
  return available.length > 0 ? available[0] : null
}
