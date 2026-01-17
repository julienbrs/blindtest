'use client'

import { useReducer, useEffect, useCallback } from 'react'
import type { GameState, GameAction, GameConfig, Song } from '@/lib/types'

const initialState: GameState = {
  status: 'idle',
  currentSong: null,
  score: 0,
  songsPlayed: 0,
  playedSongIds: [],
  timerRemaining: 5,
  isRevealed: false,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, status: 'loading' }

    case 'LOAD_SONG':
      return {
        ...state,
        status: 'loading',
        currentSong: action.song,
        isRevealed: false,
      }

    case 'PLAY':
      return { ...state, status: 'playing' }

    case 'BUZZ':
      // Only allow buzz when playing
      if (state.status !== 'playing') return state
      return { ...state, status: 'timer', timerRemaining: state.timerRemaining }

    case 'TICK_TIMER':
      const newRemaining = state.timerRemaining - 1
      if (newRemaining <= 0) {
        // Timeout = no points, reveal answer
        return {
          ...state,
          status: 'reveal',
          timerRemaining: 0,
          isRevealed: true,
          songsPlayed: state.songsPlayed + 1,
          playedSongIds: state.currentSong
            ? [...state.playedSongIds, state.currentSong.id]
            : state.playedSongIds,
        }
      }
      return { ...state, timerRemaining: newRemaining }

    case 'VALIDATE':
      return {
        ...state,
        status: 'reveal',
        isRevealed: true,
        score: action.correct ? state.score + 1 : state.score,
        songsPlayed: state.songsPlayed + 1,
        playedSongIds: state.currentSong
          ? [...state.playedSongIds, state.currentSong.id]
          : state.playedSongIds,
      }

    case 'REVEAL':
      return {
        ...state,
        status: 'reveal',
        isRevealed: true,
        // Count song if not already in reveal state
        songsPlayed:
          state.status !== 'reveal' ? state.songsPlayed + 1 : state.songsPlayed,
        playedSongIds:
          state.currentSong &&
          !state.playedSongIds.includes(state.currentSong.id)
            ? [...state.playedSongIds, state.currentSong.id]
            : state.playedSongIds,
      }

    case 'NEXT_SONG':
      return {
        ...state,
        status: 'loading',
        currentSong: null,
        isRevealed: false,
      }

    case 'END_GAME':
      return { ...state, status: 'ended' }

    case 'RESET':
      return initialState

    case 'CLIP_ENDED':
      // Only reveal if currently playing (clip ended without buzz)
      if (state.status !== 'playing') return state
      return {
        ...state,
        status: 'reveal',
        isRevealed: true,
        songsPlayed: state.songsPlayed + 1,
        playedSongIds: state.currentSong
          ? [...state.playedSongIds, state.currentSong.id]
          : state.playedSongIds,
      }

    default:
      return state
  }
}

interface UseGameStateReturn {
  state: GameState
  actions: {
    startGame: () => void
    loadSong: (song: Song) => void
    play: () => void
    pause: () => void
    buzz: () => void
    validate: (correct: boolean) => void
    reveal: () => void
    nextSong: () => void
    quit: () => void
    reset: () => void
    clipEnded: () => void
  }
  dispatch: React.Dispatch<GameAction>
}

export function useGameState(config: GameConfig): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    timerRemaining: config.timerDuration,
  })

  // Timer countdown effect
  useEffect(() => {
    if (state.status !== 'timer') return

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.status])

  // Memoized actions
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])

  const loadSong = useCallback(
    (song: Song) => dispatch({ type: 'LOAD_SONG', song }),
    []
  )

  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])

  const pause = useCallback(() => dispatch({ type: 'PLAY' }), []) // Toggle behavior

  const buzz = useCallback(() => dispatch({ type: 'BUZZ' }), [])

  const validate = useCallback(
    (correct: boolean) => dispatch({ type: 'VALIDATE', correct }),
    []
  )

  const reveal = useCallback(() => dispatch({ type: 'REVEAL' }), [])

  const nextSong = useCallback(() => dispatch({ type: 'NEXT_SONG' }), [])

  const quit = useCallback(() => dispatch({ type: 'END_GAME' }), [])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const clipEnded = useCallback(() => {
    // End of clip without buzz = reveal
    // We dispatch unconditionally and let the reducer decide based on current state
    dispatch({ type: 'CLIP_ENDED' })
  }, [])

  const actions = {
    startGame,
    loadSong,
    play,
    pause,
    buzz,
    validate,
    reveal,
    nextSong,
    quit,
    reset,
    clipEnded,
  }

  return { state, actions, dispatch }
}
