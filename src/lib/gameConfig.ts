import type { GameConfig, GuessMode } from './types'

export const DEFAULT_MULTIPLAYER_GAME_CONFIG: GameConfig = {
  guessMode: 'both',
  clipDuration: 15,
  timerDuration: 5,
  noTimer: false,
  revealDuration: 5,
  playlistId: null,
}

const GUESS_MODES = new Set<GuessMode>(['title', 'artist', 'both'])

/** Normalise aussi les anciennes configurations JSON qui n'ont pas playlistId. */
export function normalizeGameConfig(
  value: unknown,
  fallback: GameConfig = DEFAULT_MULTIPLAYER_GAME_CONFIG
): GameConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback, playlistId: null }
  }

  const config = value as Record<string, unknown>
  return {
    guessMode: GUESS_MODES.has(config.guessMode as GuessMode)
      ? (config.guessMode as GuessMode)
      : fallback.guessMode,
    clipDuration:
      typeof config.clipDuration === 'number'
        ? config.clipDuration
        : fallback.clipDuration,
    timerDuration:
      typeof config.timerDuration === 'number'
        ? config.timerDuration
        : fallback.timerDuration,
    noTimer:
      typeof config.noTimer === 'boolean' ? config.noTimer : fallback.noTimer,
    revealDuration:
      typeof config.revealDuration === 'number'
        ? config.revealDuration
        : fallback.revealDuration,
    playlistId:
      typeof config.playlistId === 'string' && config.playlistId.trim()
        ? config.playlistId.trim()
        : null,
  }
}
