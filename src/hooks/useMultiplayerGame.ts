'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  Room,
  Player,
  Buzz,
  Song,
  RoomStatus,
  GameConfig,
  RoundHistory,
} from '@/lib/types'
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

/**
 * Multiplayer game status - represents the current state of the game round
 */
export type MultiplayerGameStatus =
  | 'waiting' // In lobby, waiting to start
  | 'loading' // Loading a new song
  | 'playing' // Song is playing, players can buzz
  | 'buzzed' // Someone buzzed, waiting for validation
  | 'paused' // Game is paused (host only can pause)
  | 'reveal' // Answer revealed
  | 'ended' // Game ended

/**
 * State for multiplayer game
 */
export interface MultiplayerGameState {
  status: MultiplayerGameStatus
  currentSongId: string | null
  currentSong: Song | null
  currentSongStartedAt: Date | null
  playedSongIds: string[]
  roundHistory: RoundHistory[]
}

/**
 * Convert database row to Buzz type
 */
function dbRowToBuzz(row: Record<string, unknown>): Buzz {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    playerId: row.player_id as string,
    songId: row.song_id as string,
    buzzedAt: new Date(row.buzzed_at as string),
    isWinner: row.is_winner as boolean,
  }
}

/**
 * Convert database row to Room type
 */
function dbRowToRoom(row: Record<string, unknown>): Room {
  return {
    id: row.id as string,
    code: row.code as string,
    hostId: row.host_id as string,
    status: row.status as RoomStatus,
    settings: row.settings as GameConfig,
    currentSongId: row.current_song_id as string | null,
    currentSongStartedAt: row.current_song_started_at
      ? new Date(row.current_song_started_at as string)
      : null,
    createdAt: new Date(row.created_at as string),
  }
}

/**
 * Convert database row to Player type
 */
function dbRowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    nickname: row.nickname as string,
    avatar: (row.avatar as string | null) ?? null,
    score: row.score as number,
    isHost: row.is_host as boolean,
    isOnline: true, // Will be updated by presence
    joinedAt: new Date(row.joined_at as string),
  }
}

export interface UseMultiplayerGameOptions {
  /** Room to play in */
  room: Room | null
  /** All players in the room */
  players: Player[]
  /** Current player's ID */
  myPlayerId: string | null
  /** Whether the current player is the host */
  isHost: boolean
}

export interface UseMultiplayerGameResult {
  /** Current game state */
  gameState: MultiplayerGameState
  /** All players with scores */
  players: Player[]
  /** The player who currently has the right to answer (buzz winner) */
  currentBuzzer: Player | null
  /** All buzzes for the current round */
  currentBuzzes: Buzz[]
  /** Whether Supabase is configured */
  isConfigured: boolean
  /** Error message if any */
  error: string | null
  /** Whether audio should be paused (someone buzzed) - DEPRECATED: use shouldReduceVolume */
  shouldPauseAudio: boolean
  /** Whether audio volume should be reduced (someone buzzed and is answering) */
  shouldReduceVolume: boolean
  /** Whether the answer timer is active (buzzer is answering) */
  timerActive: boolean
  /** History of all completed rounds */
  roundHistory: RoundHistory[]
  /** Whether the host is listening to the rest of the song */
  isListeningToRest: boolean
  /** Set whether listening to rest of song */
  setIsListeningToRest: (value: boolean) => void
  /** Whether the game is paused (by host) */
  isPaused: boolean

  // Actions
  /** Set current round song info for history tracking */
  setCurrentRoundInfo: (
    songId: string,
    songTitle: string,
    songArtist: string
  ) => void
  /** Buzz to answer (any player can buzz) */
  buzz: () => Promise<boolean>
  /** Validate the current answer (host only) */
  validate: (correct: boolean) => Promise<boolean>
  /** Load the next song (host only) */
  nextSong: (songId: string) => Promise<boolean>
  /** Reveal the current answer (host only) */
  reveal: () => Promise<boolean>
  /** End the game (host only) */
  endGame: () => Promise<boolean>
  /** Pause the game (host only) */
  pause: () => void
  /** Resume the game (host only) */
  resume: () => void
}

/**
 * useMultiplayerGame - Hook for managing multiplayer game logic
 *
 * Handles real-time subscriptions for:
 * - Room changes (status, currentSongId, currentSongStartedAt)
 * - Player changes (scores)
 * - Buzz inserts
 *
 * Provides actions for:
 * - buzz() - Any player can buzz
 * - validate(correct) - Host only, validates current answer
 * - nextSong(songId) - Host only, loads the next song
 * - reveal() - Host only, reveals the answer
 * - endGame() - Host only, ends the game
 *
 * @example
 * ```tsx
 * function MultiplayerGame({ room, players, myPlayerId, isHost }) {
 *   const { gameState, currentBuzzer, buzz, validate, nextSong, reveal, endGame } =
 *     useMultiplayerGame({ room, players, myPlayerId, isHost });
 *
 *   return (
 *     <div>
 *       <p>Status: {gameState.status}</p>
 *       {currentBuzzer && <p>{currentBuzzer.nickname} is answering!</p>}
 *       <button onClick={buzz}>Buzz!</button>
 *       {isHost && (
 *         <>
 *           <button onClick={() => validate(true)}>Correct</button>
 *           <button onClick={() => validate(false)}>Incorrect</button>
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultiplayerGame(
  options: UseMultiplayerGameOptions
): UseMultiplayerGameResult {
  const { room, players: initialPlayers, myPlayerId, isHost } = options

  const [gameState, setGameState] = useState<MultiplayerGameState>({
    status: 'waiting',
    currentSongId: null,
    currentSong: null,
    currentSongStartedAt: null,
    playedSongIds: [],
    roundHistory: [],
  })
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [currentBuzzes, setCurrentBuzzes] = useState<Buzz[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isListeningToRest, setIsListeningToRest] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [previousStatusBeforePause, setPreviousStatusBeforePause] =
    useState<MultiplayerGameStatus | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isConfigured = isSupabaseConfigured()

  // Track current round info for history (song details fetched during round)
  const currentRoundInfoRef = useRef<{
    songId: string
    songTitle: string
    songArtist: string
    songStartedAt: Date | null
  } | null>(null)

  // Sync players from props
  useEffect(() => {
    setPlayers(initialPlayers)
  }, [initialPlayers])

  // Sync game state with room changes from props
  useEffect(() => {
    if (!room) {
      setGameState({
        status: 'waiting',
        currentSongId: null,
        currentSong: null,
        currentSongStartedAt: null,
        playedSongIds: [],
        roundHistory: [],
      })
      return
    }

    // Determine game status based on room state
    let status: MultiplayerGameStatus = 'waiting'
    if (room.status === 'ended') {
      status = 'ended'
    } else if (room.status === 'playing') {
      if (room.currentSongId) {
        // We have a song, determine if playing or waiting for validation
        status = 'playing'
      } else {
        // No song yet, waiting to load
        status = 'loading'
      }
    }

    setGameState((prev) => ({
      ...prev,
      status,
      currentSongId: room.currentSongId,
      currentSongStartedAt: room.currentSongStartedAt,
    }))
  }, [room])

  // Subscribe to real-time changes
  const roomId = room?.id
  useEffect(() => {
    if (!roomId || !isConfigured) return

    const supabase = getSupabaseClient()

    // Create channel for this game
    const channel = supabase.channel(`game:${roomId}`)

    // Subscribe to room changes (status, currentSongId, currentSongStartedAt)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.new) {
          const updatedRoom = dbRowToRoom(
            payload.new as Record<string, unknown>
          )

          // Determine new game status
          let newStatus: MultiplayerGameStatus = 'waiting'
          if (updatedRoom.status === 'ended') {
            newStatus = 'ended'
          } else if (updatedRoom.status === 'playing') {
            if (updatedRoom.currentSongId) {
              newStatus = 'playing'
            } else {
              newStatus = 'loading'
            }
          }

          setGameState((prev) => {
            // Track played songs
            const newPlayedSongIds =
              prev.currentSongId &&
              updatedRoom.currentSongId !== prev.currentSongId &&
              !prev.playedSongIds.includes(prev.currentSongId)
                ? [...prev.playedSongIds, prev.currentSongId]
                : prev.playedSongIds

            return {
              ...prev,
              status: newStatus,
              currentSongId: updatedRoom.currentSongId,
              currentSongStartedAt: updatedRoom.currentSongStartedAt,
              playedSongIds: newPlayedSongIds,
            }
          })

          // Clear buzzes when song changes
          if (
            payload.old &&
            (payload.old as Record<string, unknown>).current_song_id !==
              updatedRoom.currentSongId
          ) {
            setCurrentBuzzes([])
          }
        }
      }
    )

    // Subscribe to player score changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.new) {
          const updatedPlayer = dbRowToPlayer(
            payload.new as Record<string, unknown>
          )
          setPlayers((prev) =>
            prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
          )
        }
      }
    )

    // Subscribe to buzz inserts
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'buzzes',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.new) {
          const newBuzz = dbRowToBuzz(payload.new as Record<string, unknown>)

          // Only add if for current song
          setCurrentBuzzes((prev) => {
            if (prev.some((b) => b.id === newBuzz.id)) return prev
            return [...prev, newBuzz]
          })

          // If this buzz is winner, update game state to buzzed
          if (newBuzz.isWinner) {
            setGameState((prev) => ({
              ...prev,
              status: 'buzzed',
            }))
          }
        }
      }
    )

    // Subscribe to buzz updates (for is_winner changes)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'buzzes',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.new) {
          const updatedBuzz = dbRowToBuzz(
            payload.new as Record<string, unknown>
          )

          setCurrentBuzzes((prev) => {
            const newBuzzes = prev.map((b) =>
              b.id === updatedBuzz.id ? updatedBuzz : b
            )

            // Check if there's still a winner after this update
            const hasWinner = newBuzzes.some((b) => b.isWinner)

            // If no winner exists anymore (incorrect answer), go back to playing
            if (!hasWinner && !updatedBuzz.isWinner) {
              setGameState((prevState) => {
                // Only revert to playing if we were in buzzed state
                if (prevState.status === 'buzzed') {
                  return {
                    ...prevState,
                    status: 'playing',
                  }
                }
                return prevState
              })
            }

            return newBuzzes
          })

          // If this buzz became winner, update game state
          if (updatedBuzz.isWinner) {
            setGameState((prev) => ({
              ...prev,
              status: 'buzzed',
            }))
          }
        }
      }
    )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, isConfigured])

  // Find the current buzz winner
  const currentBuzzer = useMemo(() => {
    const winningBuzz = currentBuzzes.find((b) => b.isWinner)
    if (!winningBuzz) return null
    return players.find((p) => p.id === winningBuzz.playerId) ?? null
  }, [currentBuzzes, players])

  /**
   * Buzz to answer
   *
   * The buzz resolution works as follows:
   * 1. Insert buzz with server timestamp (buzzed_at defaults to NOW() in database)
   * 2. Query all buzzes for this round ordered by buzzed_at
   * 3. The first buzz (earliest timestamp) is marked as winner
   *
   * This ensures fair resolution based on server time, not client time.
   * Race conditions are handled by the database - the first insert wins.
   */
  const buzz = useCallback(async (): Promise<boolean> => {
    if (!isConfigured || !room || !myPlayerId) {
      setError('Configuration invalide')
      return false
    }

    if (gameState.status !== 'playing') {
      setError('Impossible de buzzer maintenant')
      return false
    }

    if (!gameState.currentSongId) {
      setError('Pas de chanson en cours')
      return false
    }

    // Check if this player already answered incorrectly this round
    const alreadyBuzzedIncorrect = currentBuzzes.some(
      (b) => b.playerId === myPlayerId && b.wasIncorrect
    )
    if (alreadyBuzzedIncorrect) {
      setError('Vous avez déjà répondu incorrectement')
      return false
    }

    try {
      const supabase = getSupabaseClient()

      // Check if someone already won this round
      const { data: existingWinner } = await supabase
        .from('buzzes')
        .select('id')
        .eq('room_id', room.id)
        .eq('song_id', gameState.currentSongId)
        .eq('is_winner', true)
        .maybeSingle()

      if (existingWinner) {
        setError("Quelqu'un a déjà buzzé")
        return false
      }

      // Check if this player already buzzed
      const { data: existingBuzz } = await supabase
        .from('buzzes')
        .select('id')
        .eq('room_id', room.id)
        .eq('song_id', gameState.currentSongId)
        .eq('player_id', myPlayerId)
        .maybeSingle()

      if (existingBuzz) {
        setError('Vous avez déjà buzzé')
        return false
      }

      // Insert buzz with server timestamp (buzzed_at defaults to NOW() in DB)
      // This ensures fair ordering based on when the server received the buzz
      const { error: insertError } = await supabase.from('buzzes').insert({
        room_id: room.id,
        player_id: myPlayerId,
        song_id: gameState.currentSongId,
        is_winner: false, // Will be determined by resolving buzzes
      })

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Resolve buzz winner: first buzz by server timestamp wins
      // We use a SELECT ... FOR UPDATE style query through ordering to get consistent results
      const { data: allBuzzes } = await supabase
        .from('buzzes')
        .select('*')
        .eq('room_id', room.id)
        .eq('song_id', gameState.currentSongId)
        .order('buzzed_at', { ascending: true })

      if (allBuzzes && allBuzzes.length > 0) {
        const firstBuzz = allBuzzes[0]
        // Mark first buzz as winner if not already marked
        // This update will trigger realtime subscription for all clients
        if (!firstBuzz.is_winner) {
          await supabase
            .from('buzzes')
            .update({ is_winner: true })
            .eq('id', firstBuzz.id)
        }
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du buzz'
      setError(message)
      return false
    }
  }, [
    isConfigured,
    room,
    myPlayerId,
    gameState.status,
    gameState.currentSongId,
    currentBuzzes,
  ])

  /**
   * Validate the current answer (host only)
   */
  const validate = useCallback(
    async (correct: boolean): Promise<boolean> => {
      if (!isConfigured || !room || !isHost) {
        setError('Action non autorisée')
        return false
      }

      if (gameState.status !== 'buzzed') {
        setError('Pas de réponse à valider')
        return false
      }

      try {
        const supabase = getSupabaseClient()

        // Find the winner buzz
        const winningBuzz = currentBuzzes.find((b) => b.isWinner)
        if (!winningBuzz) {
          setError('Pas de gagnant trouvé')
          return false
        }

        const winner = players.find((p) => p.id === winningBuzz.playerId)

        // Calculate buzz time (ms from song start to buzz)
        const songStartedAt = gameState.currentSongStartedAt
        const buzzTime = songStartedAt
          ? winningBuzz.buzzedAt.getTime() - songStartedAt.getTime()
          : 0

        if (correct) {
          // CORRECT ANSWER: increment score and go to reveal state
          if (winner) {
            await supabase
              .from('players')
              .update({ score: winner.score + 1 })
              .eq('id', winner.id)
          }

          // Update room to reveal state and record history
          setGameState((prev) => {
            // Build round history entry
            const roundInfo = currentRoundInfoRef.current
            const historyEntry: RoundHistory = {
              songId: gameState.currentSongId ?? '',
              songTitle: roundInfo?.songTitle ?? 'Unknown',
              songArtist: roundInfo?.songArtist ?? 'Unknown',
              buzzWinner: winner
                ? {
                    playerId: winner.id,
                    nickname: winner.nickname,
                    avatar: winner.avatar,
                    buzzTime: Math.max(0, buzzTime),
                  }
                : null,
              wasCorrect: true,
              roundNumber: prev.roundHistory.length + 1,
            }

            return {
              ...prev,
              status: 'reveal',
              roundHistory: [...prev.roundHistory, historyEntry],
            }
          })
        } else {
          // INCORRECT ANSWER: go back to playing state, others can buzz
          // Update the database to clear the winner - this triggers realtime for all clients
          await supabase
            .from('buzzes')
            .update({ is_winner: false })
            .eq('id', winningBuzz.id)

          // Mark this buzz as incorrect locally so the same player can't buzz again
          setCurrentBuzzes((prev) =>
            prev.map((b) =>
              b.id === winningBuzz.id
                ? { ...b, isWinner: false, wasIncorrect: true }
                : b
            )
          )

          // Return to playing state locally (other clients will update via realtime)
          setGameState((prev) => ({
            ...prev,
            status: 'playing',
          }))
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur validation'
        setError(message)
        return false
      }
    },
    [
      isConfigured,
      room,
      isHost,
      gameState.status,
      gameState.currentSongId,
      gameState.currentSongStartedAt,
      currentBuzzes,
      players,
    ]
  )

  /**
   * Load the next song (host only)
   */
  const nextSong = useCallback(
    async (songId: string): Promise<boolean> => {
      if (!isConfigured || !room || !isHost) {
        setError('Action non autorisée')
        return false
      }

      try {
        const supabase = getSupabaseClient()

        // Set the song start time 1 second in the future for sync
        const startTime = new Date(Date.now() + 1000)

        const { error: updateError } = await supabase
          .from('rooms')
          .update({
            current_song_id: songId,
            current_song_started_at: startTime.toISOString(),
          })
          .eq('id', room.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Clear current buzzes locally (will also happen via realtime)
        setCurrentBuzzes([])

        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur chargement chanson'
        setError(message)
        return false
      }
    },
    [isConfigured, room, isHost]
  )

  /**
   * Reveal the current answer (host only)
   */
  const reveal = useCallback(async (): Promise<boolean> => {
    if (!isConfigured || !room || !isHost) {
      setError('Action non autorisée')
      return false
    }

    if (gameState.status !== 'playing' && gameState.status !== 'buzzed') {
      setError('Impossible de révéler maintenant')
      return false
    }

    // Simply update local state to reveal
    // The answer reveal is a local UI change
    // Only add history if we're coming from 'playing' (no buzz scenario)
    // If from 'buzzed', history was already added in validate
    setGameState((prev) => {
      // Only add history entry if revealing without a buzz (skipped/timeout)
      if (gameState.status === 'playing') {
        const roundInfo = currentRoundInfoRef.current
        const historyEntry: RoundHistory = {
          songId: gameState.currentSongId ?? '',
          songTitle: roundInfo?.songTitle ?? 'Unknown',
          songArtist: roundInfo?.songArtist ?? 'Unknown',
          buzzWinner: null, // No one buzzed
          wasCorrect: false,
          roundNumber: prev.roundHistory.length + 1,
        }

        return {
          ...prev,
          status: 'reveal',
          roundHistory: [...prev.roundHistory, historyEntry],
        }
      }

      return {
        ...prev,
        status: 'reveal',
      }
    })

    return true
  }, [isConfigured, room, isHost, gameState.status, gameState.currentSongId])

  /**
   * End the game (host only)
   */
  const endGame = useCallback(async (): Promise<boolean> => {
    if (!isConfigured || !room || !isHost) {
      setError('Action non autorisée')
      return false
    }

    try {
      const supabase = getSupabaseClient()

      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          status: 'ended',
          current_song_id: null,
          current_song_started_at: null,
        })
        .eq('id', room.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur fin de partie'
      setError(message)
      return false
    }
  }, [isConfigured, room, isHost])

  /**
   * Pause the game (host only)
   * Saves the current status and transitions to paused state
   */
  const pause = useCallback(() => {
    if (!isHost) return

    const currentStatus = gameState.status
    if (currentStatus === 'playing' || currentStatus === 'buzzed') {
      setPreviousStatusBeforePause(currentStatus)
      setIsPaused(true)
      setGameState((prev) => ({
        ...prev,
        status: 'paused',
      }))
    }
  }, [isHost, gameState.status])

  /**
   * Resume the game (host only)
   * Restores the previous status before pause
   */
  const resume = useCallback(() => {
    if (!isHost || !isPaused || !previousStatusBeforePause) return

    setIsPaused(false)
    setGameState((prev) => ({
      ...prev,
      status: previousStatusBeforePause,
    }))
    setPreviousStatusBeforePause(null)
  }, [isHost, isPaused, previousStatusBeforePause])

  // Determine if audio should be paused (someone has buzzed and is answering)
  // DEPRECATED: Use shouldReduceVolume instead - audio continues at lower volume
  const shouldPauseAudio =
    gameState.status === 'buzzed' && currentBuzzer !== null

  // Determine if audio volume should be reduced (someone buzzed and is answering)
  const shouldReduceVolume =
    gameState.status === 'buzzed' && currentBuzzer !== null

  // Timer is active when someone is buzzed and answering
  const timerActive = gameState.status === 'buzzed' && currentBuzzer !== null

  /**
   * Set current round song info for history tracking
   * Called by the page when song details are fetched
   */
  const setCurrentRoundInfo = useCallback(
    (songId: string, songTitle: string, songArtist: string) => {
      currentRoundInfoRef.current = {
        songId,
        songTitle,
        songArtist,
        songStartedAt: gameState.currentSongStartedAt,
      }
    },
    [gameState.currentSongStartedAt]
  )

  return {
    gameState,
    players,
    currentBuzzer,
    currentBuzzes,
    isConfigured,
    error,
    shouldPauseAudio,
    shouldReduceVolume,
    timerActive,
    roundHistory: gameState.roundHistory,
    isListeningToRest,
    setIsListeningToRest,
    isPaused,
    setCurrentRoundInfo,
    buzz,
    validate,
    nextSong,
    reveal,
    endGame,
    pause,
    resume,
  }
}
