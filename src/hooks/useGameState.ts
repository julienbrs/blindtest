// Placeholder - will be implemented in Epic 6
export function useGameState() {
  return {
    status: 'idle' as const,
    currentSong: null,
    score: 0,
  }
}
