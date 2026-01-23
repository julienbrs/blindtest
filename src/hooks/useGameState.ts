'use client'

import { useReducer, useEffect, useCallback, useMemo } from 'react'
import type { GameState, GameAction, GameConfig, Song } from '@/lib/types'

const initialState: GameState = {
  status: 'idle',
  currentSong: null,
  score: 0,
  songsPlayed: 0,
  playedSongIds: [],
  timerRemaining: 5,
  isRevealed: false,
  previousStatus: null,
  revealCountdown: 5,
  isListeningToRest: false,
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
      return { ...state, status: 'playing', previousStatus: null }

    case 'PAUSE':
      // Only pause from playing, timer, or buzzed states
      if (
        state.status !== 'playing' &&
        state.status !== 'timer' &&
        state.status !== 'buzzed'
      )
        return state
      return {
        ...state,
        status: 'paused',
        previousStatus: action.previousStatus,
      }

    case 'RESUME':
      // Only resume from paused state
      if (state.status !== 'paused' || !state.previousStatus) return state
      return {
        ...state,
        status: state.previousStatus,
        previousStatus: null,
      }

    case 'BUZZ':
      // Only allow buzz when playing - audio will be paused by the component
      // since isPlaying is derived from status === 'playing'
      if (state.status !== 'playing') return state
      // If noTimer is true, go to buzzed state for manual validation only
      if (action.noTimer) {
        return { ...state, status: 'buzzed' }
      }
      return { ...state, status: 'timer', timerRemaining: action.timerDuration }

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
        timerRemaining: action.timerDuration,
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
        revealCountdown: action.revealDuration,
        isListeningToRest: false,
      }

    case 'REPLAY':
      // Replay the same song - go back to PLAYING state
      // Timer is NOT reset - this is intentional per spec
      // Audio reset to beginning is handled by the component
      if (state.status !== 'reveal') return state
      return {
        ...state,
        status: 'playing',
        isListeningToRest: false,
      }

    case 'TICK_REVEAL':
      // Countdown during reveal state (discovery mode)
      if (state.status !== 'reveal' || state.isListeningToRest) return state
      const newRevealRemaining = state.revealCountdown - 1
      if (newRevealRemaining <= 0) {
        // Auto-advance to next song
        return {
          ...state,
          status: 'loading',
          currentSong: null,
          isRevealed: false,
          revealCountdown: action.revealDuration,
          isListeningToRest: false,
        }
      }
      return { ...state, revealCountdown: newRevealRemaining }

    case 'LISTEN_TO_REST':
      // User wants to hear the rest of the song
      if (state.status !== 'reveal') return state
      return {
        ...state,
        isListeningToRest: true,
      }

    case 'QUICK_SCORE':
      // Quick scoring during reveal - doesn't change state, just updates score
      if (state.status !== 'reveal') return state
      return {
        ...state,
        score: action.knew ? state.score + 1 : state.score,
      }

    case 'SONG_ENDED':
      // Full song ended (after "Écouter la suite")
      if (state.status !== 'reveal' || !state.isListeningToRest) return state
      return {
        ...state,
        status: 'loading',
        currentSong: null,
        isRevealed: false,
        revealCountdown: action.revealDuration,
        isListeningToRest: false,
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
    pause: (previousStatus: 'playing' | 'timer' | 'buzzed') => void
    resume: () => void
    buzz: () => void
    validate: (correct: boolean) => void
    reveal: () => void
    nextSong: () => void
    quit: () => void
    reset: () => void
    clipEnded: () => void
    replay: () => void
    listenToRest: () => void
    quickScore: (knew: boolean) => void
    songEnded: () => void
  }
  dispatch: React.Dispatch<GameAction>
}

export function useGameState(config: GameConfig): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    timerRemaining: config.timerDuration,
    revealCountdown: config.revealDuration,
  })

  // Timer countdown effect
  useEffect(() => {
    if (state.status !== 'timer') return

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.status])

  // Reveal countdown effect (discovery mode - auto-advance to next song)
  useEffect(() => {
    // Only countdown if in reveal state and not listening to rest of song
    if (state.status !== 'reveal' || state.isListeningToRest) return

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_REVEAL', revealDuration: config.revealDuration })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.status, state.isListeningToRest, config.revealDuration])

  // Memoized actions
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])

  const loadSong = useCallback(
    (song: Song) => dispatch({ type: 'LOAD_SONG', song }),
    []
  )

  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])

  const pause = useCallback(
    (previousStatus: 'playing' | 'timer' | 'buzzed') =>
      dispatch({ type: 'PAUSE', previousStatus }),
    []
  )

  const resume = useCallback(() => dispatch({ type: 'RESUME' }), [])

  const buzz = useCallback(
    () =>
      dispatch({
        type: 'BUZZ',
        timerDuration: config.timerDuration,
        noTimer: config.noTimer,
      }),
    [config.timerDuration, config.noTimer]
  )

  const validate = useCallback(
    (correct: boolean) => dispatch({ type: 'VALIDATE', correct }),
    []
  )

  const reveal = useCallback(() => dispatch({ type: 'REVEAL' }), [])

  const nextSong = useCallback(
    () => dispatch({ type: 'NEXT_SONG', timerDuration: config.timerDuration }),
    [config.timerDuration]
  )

  const quit = useCallback(() => dispatch({ type: 'END_GAME' }), [])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const clipEnded = useCallback(() => {
    // End of clip = auto-reveal and start countdown (discovery mode)
    dispatch({ type: 'CLIP_ENDED', revealDuration: config.revealDuration })
  }, [config.revealDuration])

  const replay = useCallback(() => {
    // Replay the same song from the beginning
    // Timer is NOT reset - only the audio restarts
    dispatch({ type: 'REPLAY' })
  }, [])

  const listenToRest = useCallback(() => {
    // User wants to hear the rest of the song - stops auto-advance countdown
    dispatch({ type: 'LISTEN_TO_REST' })
  }, [])

  const quickScore = useCallback((knew: boolean) => {
    // Quick scoring during reveal (doesn't block auto-advance)
    dispatch({ type: 'QUICK_SCORE', knew })
  }, [])

  const songEnded = useCallback(() => {
    // Full song ended (after "Écouter la suite") - advance to next
    dispatch({ type: 'SONG_ENDED', revealDuration: config.revealDuration })
  }, [config.revealDuration])

  // Memoize the actions object to prevent unnecessary re-renders
  // Individual actions are already memoized, but the object itself must be stable
  const actions = useMemo(
    () => ({
      startGame,
      loadSong,
      play,
      pause,
      resume,
      buzz,
      validate,
      reveal,
      nextSong,
      quit,
      reset,
      clipEnded,
      replay,
      listenToRest,
      quickScore,
      songEnded,
    }),
    [
      startGame,
      loadSong,
      play,
      pause,
      resume,
      buzz,
      validate,
      reveal,
      nextSong,
      quit,
      reset,
      clipEnded,
      replay,
      listenToRest,
      quickScore,
      songEnded,
    ]
  )

  return { state, actions, dispatch }
}
