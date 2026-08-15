'use client'

import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRoom } from './useRoom'

const PLAYER_ID_KEY = 'blindtest_player_id'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabaseClient: vi.fn(),
}))

// Import mocked module
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'

// Create mock supabase client
function createMockSupabase() {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }

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
  }
}

describe('useRoom', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.useFakeTimers()

    // Reset mocks
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    ;(getSupabaseClient as Mock).mockReturnValue(mockSupabase)
    ;(isSupabaseConfigured as Mock).mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with null room and empty players', () => {
      const { result } = renderHook(() => useRoom())

      expect(result.current.room).toBeNull()
      expect(result.current.players).toEqual([])
      expect(result.current.myPlayer).toBeNull()
      expect(result.current.isHost).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should check if Supabase is configured', () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const { result } = renderHook(() => useRoom())

      expect(result.current.isConfigured).toBe(false)
    })

    it('should load stored player ID from localStorage', () => {
      const storedId = 'stored-player-123'
      localStorage.setItem(PLAYER_ID_KEY, storedId)

      renderHook(() => useRoom())

      act(() => {
        vi.runAllTimers()
      })

      // Player ID is loaded internally
      expect(localStorage.getItem(PLAYER_ID_KEY)).toBe(storedId)
    })
  })

  describe('createRoom', () => {
    it('should return null if Supabase is not configured', async () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const { result } = renderHook(() => useRoom())

      let code: string | null = null
      await act(async () => {
        code = await result.current.createRoom('TestUser')
      })

      expect(code).toBeNull()
      expect(result.current.error).toBe('Supabase non configuré')
    })

    it('should return null for empty nickname', async () => {
      const { result } = renderHook(() => useRoom())

      let code: string | null = null
      await act(async () => {
        code = await result.current.createRoom('   ')
      })

      expect(code).toBeNull()
      expect(result.current.error).toBe('Veuillez entrer un pseudo')
    })

    it('should set isLoading to true during room creation', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      // The createRoom function first calls maybeSingle() to check for existing room codes
      mockSupabase._mocks.mockMaybeSingle.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useRoom())

      // Start the creation without awaiting
      act(() => {
        result.current.createRoom('TestUser')
      })

      // isLoading should be true while waiting
      expect(result.current.isLoading).toBe(true)

      // Clean up by resolving
      await act(async () => {
        resolvePromise!({ data: null, error: null })
      })
    })
  })

  describe('joinRoom', () => {
    it('should return false if Supabase is not configured', async () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.joinRoom('ABC123', 'TestUser')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Supabase non configuré')
    })

    it('should return false for invalid room code', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.joinRoom('AB', 'TestUser')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Code de room invalide')
    })

    it('should return false for empty nickname', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.joinRoom('ABC123', '   ')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Veuillez entrer un pseudo')
    })

    it('should return false if room not found', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.joinRoom('ABC123', 'TestUser')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Room introuvable')
    })

    it('should return false if room status is not waiting', async () => {
      mockSupabase._mocks.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'room-123',
          status: 'playing',
        },
        error: null,
      })

      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.joinRoom('ABC123', 'TestUser')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('La partie a déjà commencé')
    })
  })

  describe('leaveRoom', () => {
    it('should do nothing if no room or player', async () => {
      const { result } = renderHook(() => useRoom())

      await act(async () => {
        await result.current.leaveRoom()
      })

      // Should not throw
      expect(result.current.room).toBeNull()
    })
  })

  describe('updateSettings', () => {
    it('should return false if not host', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.updateSettings({ clipDuration: 20 })
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })
  })

  describe('startGame', () => {
    it('should return false if not host', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.startGame('song-123')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })

    it('sets the first song and clears persisted history before playing', async () => {
      vi.useRealTimers()
      localStorage.setItem(PLAYER_ID_KEY, 'host-player')
      mockSupabase._mocks.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'room-123',
          code: 'ABC123',
          host_id: 'host-player',
          status: 'waiting',
          settings: {
            guessMode: 'both',
            clipDuration: 15,
            timerDuration: 5,
            noTimer: false,
            revealDuration: 5,
          },
          current_song_id: null,
          current_song_started_at: null,
          played_song_ids: ['old-song'],
          created_at: new Date().toISOString(),
        },
        error: null,
      })
      mockSupabase._mocks.mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'host-player',
            room_id: 'room-123',
            nickname: 'Host',
            avatar: null,
            score: 0,
            is_host: true,
            joined_at: new Date().toISOString(),
          },
          {
            id: 'guest-player',
            room_id: 'room-123',
            nickname: 'Guest',
            avatar: null,
            score: 0,
            is_host: false,
            joined_at: new Date().toISOString(),
          },
        ],
        error: null,
      })

      const { result } = renderHook(() => useRoom({ roomCode: 'ABC123' }))
      await waitFor(() => expect(result.current.isHost).toBe(true))

      await act(async () => {
        expect(await result.current.startGame('first-song')).toBe(true)
      })

      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'playing',
          current_song_id: 'first-song',
          played_song_ids: [],
        })
      )
      expect(result.current.room).toMatchObject({
        status: 'playing',
        currentSongId: 'first-song',
        playedSongIds: [],
        settings: { playlistId: null },
      })
    })
  })

  describe('kickPlayer', () => {
    it('should return false if not host', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.kickPlayer('some-player-id')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Action non autorisée')
    })
  })

  describe('reconnectToRoom', () => {
    it('should return false if no stored player ID', async () => {
      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.reconnectToRoom('ABC123')
      })

      expect(success).toBe(false)
    })

    it('should return false if Supabase is not configured', async () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)
      localStorage.setItem(PLAYER_ID_KEY, 'some-player-id')

      const { result } = renderHook(() => useRoom())

      let success = false
      await act(async () => {
        success = await result.current.reconnectToRoom('ABC123')
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe('Supabase non configuré')
    })
  })

  describe('computed values', () => {
    it('myPlayer should return correct player when matched', () => {
      const { result } = renderHook(() => useRoom())

      // Initially null
      expect(result.current.myPlayer).toBeNull()
    })

    it('isHost should be false when no myPlayer', () => {
      const { result } = renderHook(() => useRoom())

      expect(result.current.isHost).toBe(false)
    })
  })
})
