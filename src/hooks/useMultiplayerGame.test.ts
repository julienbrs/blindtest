'use client'

import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useMultiplayerGame,
  UseMultiplayerGameOptions,
} from './useMultiplayerGame'
import type { Room, Player, GameConfig, RoomStatus } from '@/lib/types'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabaseClient: vi.fn(),
}))

// Import mocked module
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'

// Create mock supabase client
function createMockSupabase() {
  const subscribeCallback: Record<string, ((payload: unknown) => void)[]> = {
    room: [],
    players: [],
    buzzes: [],
    buzzUpdates: [],
  }

  // Define mockChannel with explicit type to avoid circular reference issues
  const mockChannel: {
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
  } = {
    on: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }

  // Configure on() to store callbacks and return self
  mockChannel.on.mockImplementation(
    (
      type: string,
      config: { event: string; table?: string },
      callback: (payload: unknown) => void
    ) => {
      if (type === 'postgres_changes') {
        if (config.table === 'rooms') {
          subscribeCallback.room.push(callback)
        } else if (config.table === 'players') {
          subscribeCallback.players.push(callback)
        } else if (config.table === 'buzzes') {
          if (config.event === 'INSERT') {
            subscribeCallback.buzzes.push(callback)
          } else if (config.event === 'UPDATE') {
            subscribeCallback.buzzUpdates.push(callback)
          }
        }
      }
      return mockChannel
    }
  )

  // Configure subscribe to return self
  mockChannel.subscribe.mockReturnValue(mockChannel)

  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockOrder = vi.fn()

  // Chain methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  })
  mockInsert.mockReturnValue({
    select: mockSelect,
    eq: mockEq,
  })
  mockUpdate.mockReturnValue({
    eq: mockEq,
  })
  mockDelete.mockReturnValue({
    eq: mockEq,
  })
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
  })
  mockOrder.mockReturnValue({
    eq: mockEq,
  })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })

  return {
    channel: vi.fn().mockReturnValue(mockChannel),
    from: mockFrom,
    _mocks: {
      mockChannel,
      mockFrom,
      mockSelect,
      mockInsert,
      mockUpdate,
      mockDelete,
      mockEq,
      mockSingle,
      mockMaybeSingle,
      mockOrder,
    },
    _callbacks: subscribeCallback,
  }
}

// Test helpers
const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'room-123',
  code: 'ABC123',
  hostId: 'player-host',
  status: 'playing' as RoomStatus,
  settings: {
    guessMode: 'both',
    clipDuration: 15,
    timerDuration: 5,
    noTimer: false,
  } as GameConfig,
  currentSongId: 'song-123',
  currentSongStartedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
})

const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-123',
  roomId: 'room-123',
  nickname: 'TestPlayer',
  score: 0,
  isHost: false,
  isOnline: true,
  joinedAt: new Date(),
  ...overrides,
})

describe('useMultiplayerGame', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    ;(getSupabaseClient as Mock).mockReturnValue(mockSupabase)
    ;(isSupabaseConfigured as Mock).mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with waiting status when no room', () => {
      const options: UseMultiplayerGameOptions = {
        room: null,
        players: [],
        myPlayerId: null,
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.gameState.status).toBe('waiting')
      expect(result.current.gameState.currentSongId).toBeNull()
      expect(result.current.gameState.currentSong).toBeNull()
      expect(result.current.currentBuzzer).toBeNull()
      expect(result.current.currentBuzzes).toEqual([])
    })

    it('should initialize with playing status when room has currentSongId', () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: 'song-abc',
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [createMockPlayer()],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.gameState.status).toBe('playing')
      expect(result.current.gameState.currentSongId).toBe('song-abc')
    })

    it('should initialize with loading status when room is playing but no song', () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: null,
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.gameState.status).toBe('loading')
    })

    it('should initialize with ended status when room status is ended', () => {
      const room = createMockRoom({
        status: 'ended',
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.gameState.status).toBe('ended')
    })

    it('should check if Supabase is configured', () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const options: UseMultiplayerGameOptions = {
        room: null,
        players: [],
        myPlayerId: null,
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.isConfigured).toBe(false)
    })

    it('should sync players from props', () => {
      const players = [
        createMockPlayer({ id: 'p1', nickname: 'Player1' }),
        createMockPlayer({ id: 'p2', nickname: 'Player2' }),
      ]

      const options: UseMultiplayerGameOptions = {
        room: createMockRoom(),
        players,
        myPlayerId: 'p1',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.players).toHaveLength(2)
      expect(result.current.players[0].nickname).toBe('Player1')
    })
  })

  describe('buzz action', () => {
    it('should return false if Supabase is not configured', async () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const options: UseMultiplayerGameOptions = {
        room: createMockRoom(),
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Configuration invalide')
    })

    it('should return false if no room', async () => {
      const options: UseMultiplayerGameOptions = {
        room: null,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Configuration invalide')
    })

    it('should return false if no player ID', async () => {
      const options: UseMultiplayerGameOptions = {
        room: createMockRoom(),
        players: [],
        myPlayerId: null,
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Configuration invalide')
    })

    it('should return false if game status is not playing', async () => {
      const room = createMockRoom({
        status: 'waiting',
        currentSongId: null,
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Impossible de buzzer maintenant')
    })

    it('should return false if no current song', async () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: null,
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      // Override the initial state to be playing
      await act(async () => {
        // Force state to playing with no song
      })

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
    })

    it('should attempt to insert buzz when buzzing', async () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: 'song-123',
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [createMockPlayer()],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      // The buzz will fail due to mock setup, but we verify it attempts the right calls
      await act(async () => {
        await result.current.buzz()
      })

      // Verify that it tried to query the buzzes table
      expect(mockSupabase.from).toHaveBeenCalledWith('buzzes')
    })

    it('should return false if someone already won the round', async () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: 'song-123',
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [createMockPlayer()],
        myPlayerId: 'player-123',
        isHost: false,
      }

      // Mock existing winner (uses maybeSingle)
      mockSupabase._mocks.mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'existing-buzz' },
        error: null,
      })

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.buzz()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe("Quelqu'un a déjà buzzé")
    })
  })

  describe('validate action', () => {
    it('should return false if not host', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.validate(true)
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })

    it('should return false if game status is not buzzed', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.validate(true)
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Pas de réponse à valider')
    })
  })

  describe('nextSong action', () => {
    it('should return false if not host', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.nextSong('new-song-id')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })

    it('should update room with new song when host calls nextSong', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      mockSupabase._mocks.mockEq.mockResolvedValueOnce({ error: null })

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.nextSong('new-song-id')
      })

      expect(success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('rooms')
      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalled()
    })

    it('should clear current buzzes when loading next song', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      mockSupabase._mocks.mockEq.mockResolvedValueOnce({ error: null })

      const { result } = renderHook(() => useMultiplayerGame(options))

      await act(async () => {
        await result.current.nextSong('new-song-id')
      })

      expect(result.current.currentBuzzes).toEqual([])
    })
  })

  describe('reveal action', () => {
    it('should return false if not host', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.reveal()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })

    it('should update local state to reveal when host calls reveal', async () => {
      const room = createMockRoom({
        status: 'playing',
        currentSongId: 'song-123',
      })

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.reveal()
      })

      expect(success).toBe(true)
      expect(result.current.gameState.status).toBe('reveal')
    })
  })

  describe('endGame action', () => {
    it('should return false if not host', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.endGame()
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })

    it('should update room status to ended when host calls endGame', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      mockSupabase._mocks.mockEq.mockResolvedValueOnce({ error: null })

      const { result } = renderHook(() => useMultiplayerGame(options))

      let success = false
      await act(async () => {
        success = await result.current.endGame()
      })

      expect(success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('rooms')
      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalled()
    })
  })

  describe('realtime subscriptions', () => {
    it('should subscribe to room:id channel when room is provided', () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      renderHook(() => useMultiplayerGame(options))

      expect(mockSupabase.channel).toHaveBeenCalledWith(`game:${room.id}`)
      expect(mockSupabase._mocks.mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should not subscribe when room is null', () => {
      const options: UseMultiplayerGameOptions = {
        room: null,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      renderHook(() => useMultiplayerGame(options))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should not subscribe when Supabase is not configured', () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      renderHook(() => useMultiplayerGame(options))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should unsubscribe on unmount', () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { unmount } = renderHook(() => useMultiplayerGame(options))

      unmount()

      expect(mockSupabase._mocks.mockChannel.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('currentBuzzer', () => {
    it('should return null when no winning buzz', () => {
      const room = createMockRoom()
      const players = [createMockPlayer()]

      const options: UseMultiplayerGameOptions = {
        room,
        players,
        myPlayerId: 'player-123',
        isHost: false,
      }

      const { result } = renderHook(() => useMultiplayerGame(options))

      expect(result.current.currentBuzzer).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should set error when nextSong fails', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      mockSupabase._mocks.mockEq.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      })

      const { result } = renderHook(() => useMultiplayerGame(options))

      await act(async () => {
        await result.current.nextSong('new-song')
      })

      expect(result.current.error).toBe('Update failed')
    })

    it('should set error when endGame fails', async () => {
      const room = createMockRoom()

      const options: UseMultiplayerGameOptions = {
        room,
        players: [],
        myPlayerId: 'player-host',
        isHost: true,
      }

      mockSupabase._mocks.mockEq.mockResolvedValueOnce({
        error: { message: 'End game failed' },
      })

      const { result } = renderHook(() => useMultiplayerGame(options))

      await act(async () => {
        await result.current.endGame()
      })

      expect(result.current.error).toBe('End game failed')
    })
  })
})
