'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Room, Player, RoomStatus, GameConfig } from '@/lib/types'
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

const PLAYER_ID_KEY = 'blindtest_player_id'
const MAX_PLAYERS_PER_ROOM = 10

/**
 * Generate a random 6-character room code (uppercase letters + digits)
 * Excludes ambiguous characters: 0, O, I, L, 1
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Default game settings for a new room
 */
const defaultSettings: GameConfig = {
  guessMode: 'both',
  clipDuration: 15,
  timerDuration: 5,
  noTimer: false,
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
    score: row.score as number,
    isHost: row.is_host as boolean,
    isOnline: true, // Will be updated by presence later
    joinedAt: new Date(row.joined_at as string),
  }
}

export interface UseRoomOptions {
  /** Room code to connect to (if joining existing room) */
  roomCode?: string
}

export interface UseRoomResult {
  /** Current room state */
  room: Room | null
  /** All players in the room */
  players: Player[]
  /** Current player's data */
  myPlayer: Player | null
  /** Whether the current player is the host */
  isHost: boolean
  /** Loading state */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Whether Supabase is configured */
  isConfigured: boolean

  // Actions
  /** Create a new room and become host */
  createRoom: (nickname: string) => Promise<string | null>
  /** Join an existing room by code */
  joinRoom: (code: string, nickname: string) => Promise<boolean>
  /** Leave the current room */
  leaveRoom: () => Promise<void>
  /** Update room settings (host only) */
  updateSettings: (settings: Partial<GameConfig>) => Promise<boolean>
  /** Start the game (host only, requires >= 2 players) */
  startGame: () => Promise<boolean>
  /** Kick a player from the room (host only) */
  kickPlayer: (playerId: string) => Promise<boolean>
  /** Reconnect to a room using stored player ID */
  reconnectToRoom: (roomCode: string) => Promise<boolean>
  /** Restart the game (host only) - resets scores and room status to waiting */
  restartGame: () => Promise<boolean>
}

/**
 * useRoom - Hook for managing multiplayer room operations
 *
 * Provides CRUD operations for rooms and real-time subscriptions
 * for room and player changes.
 *
 * @example
 * ```tsx
 * function Lobby() {
 *   const { room, players, myPlayer, isHost, createRoom, joinRoom } = useRoom();
 *
 *   // Create a new room
 *   const handleCreate = async () => {
 *     const code = await createRoom('MyNickname');
 *     if (code) router.push(`/multiplayer/${code}`);
 *   };
 *
 *   // Join existing room
 *   const handleJoin = async (code: string) => {
 *     const success = await joinRoom(code, 'MyNickname');
 *     if (success) router.push(`/multiplayer/${code}`);
 *   };
 * }
 * ```
 */
export function useRoom(options: UseRoomOptions = {}): UseRoomResult {
  const { roomCode } = options

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isConfigured = isSupabaseConfigured()

  // Computed values
  const myPlayer = players.find((p) => p.id === myPlayerId) ?? null
  const isHost = myPlayer?.isHost ?? false

  // Load player ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(PLAYER_ID_KEY)
      if (storedId) {
        setMyPlayerId(storedId)
      }
    }
  }, [])

  // Subscribe to room changes when we have a room
  // We extract roomId to avoid re-subscribing on every room state change
  const roomId = room?.id
  useEffect(() => {
    if (!roomId || !isConfigured) return

    const supabase = getSupabaseClient()

    // Create a channel for this room
    const channel = supabase.channel(`room:${roomId}`)

    // Subscribe to room changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setRoom(dbRowToRoom(payload.new as Record<string, unknown>))
        } else if (payload.eventType === 'DELETE') {
          // Room was deleted
          setRoom(null)
          setPlayers([])
        }
      }
    )

    // Subscribe to player changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newPlayer = dbRowToPlayer(
            payload.new as Record<string, unknown>
          )
          setPlayers((prev) => {
            // Avoid duplicates
            if (prev.some((p) => p.id === newPlayer.id)) {
              return prev
            }
            return [...prev, newPlayer]
          })
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedPlayer = dbRowToPlayer(
            payload.new as Record<string, unknown>
          )
          setPlayers((prev) =>
            prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
          )
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = (payload.old as Record<string, unknown>)
            .id as string
          setPlayers((prev) => prev.filter((p) => p.id !== deletedId))
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

  // Fetch room and players when roomCode changes
  useEffect(() => {
    if (!roomCode || !isConfigured) return

    const fetchRoomData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Fetch room by code
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', roomCode)
          .single()

        if (roomError || !roomData) {
          setError('Room introuvable')
          setIsLoading(false)
          return
        }

        const fetchedRoom = dbRowToRoom(roomData)
        setRoom(fetchedRoom)

        // Fetch all players in the room
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', fetchedRoom.id)
          .order('joined_at', { ascending: true })

        if (playersError) {
          console.error('Error fetching players:', playersError)
        } else if (playersData) {
          setPlayers(playersData.map(dbRowToPlayer))
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur de connexion'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoomData()
  }, [roomCode, isConfigured])

  /**
   * Create a new room and become the host
   */
  const createRoom = useCallback(
    async (nickname: string): Promise<string | null> => {
      if (!isConfigured) {
        setError('Supabase non configuré')
        return null
      }

      const trimmedNickname = nickname.trim()
      if (!trimmedNickname) {
        setError('Veuillez entrer un pseudo')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Generate a unique room code
        let code = generateRoomCode()
        let attempts = 0
        const maxAttempts = 5

        while (attempts < maxAttempts) {
          const { data: existingRoom } = await supabase
            .from('rooms')
            .select('id')
            .eq('code', code)
            .maybeSingle()

          if (!existingRoom) break
          code = generateRoomCode()
          attempts++
        }

        if (attempts >= maxAttempts) {
          throw new Error('Impossible de générer un code unique')
        }

        // Create the room
        const { data: newRoom, error: roomError } = await supabase
          .from('rooms')
          .insert({
            code,
            host_id: crypto.randomUUID(), // Temporary
            status: 'waiting',
            settings: defaultSettings,
            current_song_id: null,
            current_song_started_at: null,
          })
          .select()
          .single()

        if (roomError || !newRoom) {
          throw new Error(roomError?.message || 'Erreur création room')
        }

        // Create the host player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            room_id: newRoom.id,
            nickname: trimmedNickname,
            score: 0,
            is_host: true,
          })
          .select()
          .single()

        if (playerError || !player) {
          // Cleanup
          await supabase.from('rooms').delete().eq('id', newRoom.id)
          throw new Error(playerError?.message || 'Erreur création joueur')
        }

        // Update room with actual host_id
        await supabase
          .from('rooms')
          .update({ host_id: player.id })
          .eq('id', newRoom.id)

        // Store player ID
        localStorage.setItem(PLAYER_ID_KEY, player.id)
        setMyPlayerId(player.id)

        // Set local state
        const createdRoom = dbRowToRoom({ ...newRoom, host_id: player.id })
        setRoom(createdRoom)
        setPlayers([dbRowToPlayer(player)])

        return code
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors de la création'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isConfigured]
  )

  /**
   * Join an existing room by code
   */
  const joinRoom = useCallback(
    async (code: string, nickname: string): Promise<boolean> => {
      if (!isConfigured) {
        setError('Supabase non configuré')
        return false
      }

      const trimmedCode = code.trim().toUpperCase()
      const trimmedNickname = nickname.trim()

      if (!trimmedCode || trimmedCode.length !== 6) {
        setError('Code de room invalide')
        return false
      }

      if (!trimmedNickname) {
        setError('Veuillez entrer un pseudo')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Check if room exists
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', trimmedCode)
          .single()

        if (roomError || !roomData) {
          setError('Room introuvable')
          return false
        }

        // Check room status
        if (roomData.status !== 'waiting') {
          setError(
            roomData.status === 'playing'
              ? 'La partie a déjà commencé'
              : 'Cette partie est terminée'
          )
          return false
        }

        // Check player count
        const { count } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomData.id)

        if (count !== null && count >= MAX_PLAYERS_PER_ROOM) {
          setError(`Room pleine (max ${MAX_PLAYERS_PER_ROOM} joueurs)`)
          return false
        }

        // Create player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            room_id: roomData.id,
            nickname: trimmedNickname,
            score: 0,
            is_host: false,
          })
          .select()
          .single()

        if (playerError || !player) {
          throw new Error(playerError?.message || 'Erreur création joueur')
        }

        // Store player ID
        localStorage.setItem(PLAYER_ID_KEY, player.id)
        setMyPlayerId(player.id)

        // Set local state
        setRoom(dbRowToRoom(roomData))

        // Fetch all players
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('joined_at', { ascending: true })

        if (playersData) {
          setPlayers(playersData.map(dbRowToPlayer))
        }

        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors de la connexion'
        setError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isConfigured]
  )

  /**
   * Leave the current room
   */
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!room || !myPlayerId || !isConfigured) return

    try {
      const supabase = getSupabaseClient()

      // Unsubscribe from realtime
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }

      // Delete player
      await supabase.from('players').delete().eq('id', myPlayerId)

      // Clear stored player ID
      localStorage.removeItem(PLAYER_ID_KEY)

      // Clear local state
      setRoom(null)
      setPlayers([])
      setMyPlayerId(null)
    } catch (err) {
      console.error('Error leaving room:', err)
    }
  }, [room, myPlayerId, isConfigured])

  /**
   * Update room settings (host only)
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<GameConfig>): Promise<boolean> => {
      if (!room || !isHost || !isConfigured) {
        setError('Action non autorisée')
        return false
      }

      try {
        const supabase = getSupabaseClient()

        const mergedSettings = { ...room.settings, ...newSettings }

        const { error: updateError } = await supabase
          .from('rooms')
          .update({ settings: mergedSettings })
          .eq('id', room.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update local state (will also be updated by realtime)
        setRoom((prev) => (prev ? { ...prev, settings: mergedSettings } : null))

        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur mise à jour'
        setError(message)
        return false
      }
    },
    [room, isHost, isConfigured]
  )

  /**
   * Start the game (host only, requires >= 2 players)
   */
  const startGame = useCallback(async (): Promise<boolean> => {
    if (!room || !isHost || !isConfigured) {
      setError('Action non autorisée')
      return false
    }

    if (players.length < 2) {
      setError('Il faut au moins 2 joueurs pour démarrer')
      return false
    }

    try {
      const supabase = getSupabaseClient()

      const { error: updateError } = await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', room.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur démarrage'
      setError(message)
      return false
    }
  }, [room, isHost, players.length, isConfigured])

  /**
   * Kick a player from the room (host only)
   */
  const kickPlayer = useCallback(
    async (playerId: string): Promise<boolean> => {
      if (!room || !isHost || !isConfigured) {
        setError('Action non autorisée')
        return false
      }

      if (playerId === myPlayerId) {
        setError('Vous ne pouvez pas vous exclure vous-même')
        return false
      }

      try {
        const supabase = getSupabaseClient()

        const { error: deleteError } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId)
          .eq('room_id', room.id)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur exclusion'
        setError(message)
        return false
      }
    },
    [room, isHost, myPlayerId, isConfigured]
  )

  /**
   * Reconnect to a room using stored player ID
   *
   * This function handles player reconnection when they return to a game:
   * 1. Checks if the room still exists and is active
   * 2. Verifies the stored player ID exists in this room
   * 3. Updates last_seen_at to mark the player as active again
   * 4. Synchronizes the current game state (room status, song, scores)
   */
  const reconnectToRoom = useCallback(
    async (code: string): Promise<boolean> => {
      if (!isConfigured) {
        setError('Supabase non configuré')
        return false
      }

      const storedPlayerId = localStorage.getItem(PLAYER_ID_KEY)
      if (!storedPlayerId) {
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Check if room exists and is not ended
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', code.toUpperCase())
          .maybeSingle()

        if (roomError || !roomData) {
          return false
        }

        // Room exists but game ended - cannot reconnect
        if (roomData.status === 'ended') {
          return false
        }

        // Check if player exists in this room
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', storedPlayerId)
          .eq('room_id', roomData.id)
          .maybeSingle()

        if (playerError || !playerData) {
          return false
        }

        // Update last_seen_at to mark the player as active again
        // This is crucial for the grace period mechanism - it resets the
        // player's presence timer so they won't be removed during the grace period
        await supabase
          .from('players')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', storedPlayerId)

        // Success - set state
        setMyPlayerId(storedPlayerId)
        setRoom(dbRowToRoom(roomData))

        // Fetch all players with current scores (sync game state)
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('joined_at', { ascending: true })

        if (playersData) {
          setPlayers(playersData.map(dbRowToPlayer))
        }

        return true
      } catch (err) {
        console.error('Reconnect error:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isConfigured]
  )

  /**
   * Restart the game (host only)
   *
   * Resets all player scores to 0 and sets room status back to 'waiting'
   * so a new game can be started from the lobby.
   */
  const restartGame = useCallback(async (): Promise<boolean> => {
    if (!room || !isHost || !isConfigured) {
      setError('Action non autorisée')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // Reset all player scores to 0
      const { error: playersError } = await supabase
        .from('players')
        .update({ score: 0 })
        .eq('room_id', room.id)

      if (playersError) {
        throw new Error(playersError.message)
      }

      // Reset room status to waiting
      const { error: roomError } = await supabase
        .from('rooms')
        .update({
          status: 'waiting',
          current_song_id: null,
          current_song_started_at: null,
        })
        .eq('id', room.id)

      if (roomError) {
        throw new Error(roomError.message)
      }

      // Delete all buzzes for this room to clean up
      await supabase.from('buzzes').delete().eq('room_id', room.id)

      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du redémarrage'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [room, isHost, isConfigured])

  return {
    room,
    players,
    myPlayer,
    isHost,
    isLoading,
    error,
    isConfigured,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    startGame,
    kickPlayer,
    reconnectToRoom,
    restartGame,
  }
}
