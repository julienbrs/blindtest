// Placeholder - will be fully implemented in Epic 6
import type { GameConfig, GameState, GameStatus, Song } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface UseGameStateReturn {
  state: GameState
  actions: {
    quit: () => void
    buzz: () => void
    clipEnded: () => void
    validate: (correct: boolean) => void
    reveal: () => void
    nextSong: () => void
    play: () => void
    pause: () => void
  }
}

export function useGameState(_config: GameConfig): UseGameStateReturn {
  const router = useRouter()

  const state: GameState = {
    status: 'idle' as GameStatus,
    currentSong: null as Song | null,
    score: 0,
    songsPlayed: 0,
    playedSongIds: [],
    timerRemaining: 5,
    isRevealed: false,
  }

  const actions = {
    quit: () => router.push('/'),
    buzz: () => {},
    clipEnded: () => {},
    validate: (_correct: boolean) => {},
    reveal: () => {},
    nextSong: () => {},
    play: () => {},
    pause: () => {},
  }

  return { state, actions }
}
