'use client'

import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePresence } from './usePresence'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabaseClient: vi.fn(),
}))

// Import mocked module
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'

// Create mock presence channel
function createMockSupabase() {
  let presenceHandlers: {
    event: string
    handler: (payload: unknown) => void
  }[] = []
  let subscribeCallback: ((status: string) => void) | null = null
  const trackedState: Record<string, unknown[]> = {}

  const mockChannel = {
    on: vi.fn(
      (
        type: string,
        opts: { event: string },
        handler: (payload: unknown) => void
      ) => {
        if (type === 'presence') {
          presenceHandlers.push({ event: opts.event, handler })
        }
        return mockChannel
      }
    ),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      subscribeCallback = callback || null
      // Simulate immediate subscription success
      setTimeout(() => {
        if (subscribeCallback) {
          subscribeCallback('SUBSCRIBED')
        }
      }, 0)
      return mockChannel
    }),
    unsubscribe: vi.fn(() => {
      presenceHandlers = []
      subscribeCallback = null
    }),
    track: vi.fn((state: unknown) => {
      const key = (state as { playerId: string }).playerId
      trackedState[key] = [state]
      return Promise.resolve()
    }),
    presenceState: vi.fn(() => trackedState),
  }

  // Mock database operations for heartbeat
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  })

  const mockFrom = vi.fn().mockReturnValue({
    update: mockUpdate,
  })

  return {
    channel: vi.fn().mockReturnValue(mockChannel),
    from: mockFrom,
    _mocks: {
      mockChannel,
      mockFrom,
      mockUpdate,
      triggerPresenceEvent: (event: string, payload: unknown) => {
        presenceHandlers.forEach((h) => {
          if (h.event === event) {
            h.handler(payload)
          }
        })
      },
      triggerSubscribe: (status: string) => {
        if (subscribeCallback) {
          subscribeCallback(status)
        }
      },
      getTrackedState: () => trackedState,
      clearTrackedState: () => {
        Object.keys(trackedState).forEach((key) => delete trackedState[key])
      },
    },
  }
}

describe('usePresence', () => {
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
    it('should initialize with empty online status', () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: null,
          playerId: null,
        })
      )

      expect(result.current.onlineStatus.size).toBe(0)
      expect(result.current.isConnected).toBe(false)
    })

    it('should not subscribe without roomId', () => {
      renderHook(() =>
        usePresence({
          roomId: null,
          playerId: 'player-123',
        })
      )

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should not subscribe without playerId', () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: null,
        })
      )

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should not subscribe if Supabase is not configured', () => {
      ;(isSupabaseConfigured as Mock).mockReturnValue(false)

      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })
  })

  describe('subscription', () => {
    it('should create channel with correct name', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-abc',
          playerId: 'player-123',
        })
      )

      // Only advance enough to trigger subscription, not heartbeat
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'room:room-abc:presence',
        {
          config: {
            presence: {
              key: 'player-123',
            },
          },
        }
      )
    })

    it('should subscribe to presence events', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Should have subscribed to sync, join, and leave events
      expect(mockSupabase._mocks.mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'sync' },
        expect.any(Function)
      )
      expect(mockSupabase._mocks.mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'join' },
        expect.any(Function)
      )
      expect(mockSupabase._mocks.mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'leave' },
        expect.any(Function)
      )
    })

    it('should track presence after subscription', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
          nickname: 'TestUser',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(mockSupabase._mocks.mockChannel.track).toHaveBeenCalledWith({
        playerId: 'player-123',
        nickname: 'TestUser',
        joinedAt: expect.any(Number),
      })
    })

    it('should set isConnected to true after successful subscription', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isConnected).toBe(true)
    })

    it('should mark self as online after tracking', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isOnline('player-123')).toBe(true)
    })
  })

  describe('presence events', () => {
    it('should mark player as online on join event', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Simulate another player joining
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })

      expect(result.current.isOnline('player-456')).toBe(true)
    })

    it('should use tombstone pattern on leave event (grace period)', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // First, mark player-456 as online
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })

      expect(result.current.isOnline('player-456')).toBe(true)

      // Now trigger leave - should still be online during grace period
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('leave', { key: 'player-456' })
      })

      // Should still be online during grace period
      expect(result.current.isOnline('player-456')).toBe(true)

      // Advance time past grace period (5 seconds)
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Now should be offline
      expect(result.current.isOnline('player-456')).toBe(false)
    })

    it('should cancel tombstone if player rejoins during grace period', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Join
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })

      // Leave
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('leave', { key: 'player-456' })
      })

      // Advance time partially (3 seconds - within grace period)
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Should still be online
      expect(result.current.isOnline('player-456')).toBe(true)

      // Rejoin before grace period expires
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })

      // Advance time past original grace period
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Should still be online (tombstone was cancelled)
      expect(result.current.isOnline('player-456')).toBe(true)
    })
  })

  describe('isOnline helper', () => {
    it('should return false for unknown players', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isOnline('unknown-player')).toBe(false)
    })

    it('should return true for online players', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })

      expect(result.current.isOnline('player-456')).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const { unmount } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      unmount()

      expect(mockSupabase._mocks.mockChannel.unsubscribe).toHaveBeenCalled()
    })

    it('should clear tombstone timers on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Create a tombstone
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('join', { key: 'player-456' })
      })
      act(() => {
        mockSupabase._mocks.triggerPresenceEvent('leave', { key: 'player-456' })
      })

      // Unmount before grace period expires
      unmount()

      // Advance time past grace period
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Should not have any errors (timers were cleared)
      expect(result.current.isOnline('player-456')).toBe(true) // State frozen at unmount
    })

    it('should resubscribe when roomId changes', async () => {
      const { rerender } = renderHook(
        ({ roomId }) =>
          usePresence({
            roomId,
            playerId: 'player-123',
          }),
        { initialProps: { roomId: 'room-123' } }
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'room:room-123:presence',
        expect.any(Object)
      )

      // Change room
      rerender({ roomId: 'room-456' })

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(mockSupabase._mocks.mockChannel.unsubscribe).toHaveBeenCalled()
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'room:room-456:presence',
        expect.any(Object)
      )
    })
  })

  describe('connection status', () => {
    it('should set isConnected to false on CLOSED status', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isConnected).toBe(true)

      // Simulate connection close
      act(() => {
        mockSupabase._mocks.triggerSubscribe('CLOSED')
      })

      expect(result.current.isConnected).toBe(false)
    })

    it('should set isConnected to false on CHANNEL_ERROR status', async () => {
      const { result } = renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.isConnected).toBe(true)

      // Simulate channel error
      act(() => {
        mockSupabase._mocks.triggerSubscribe('CHANNEL_ERROR')
      })

      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('heartbeat', () => {
    it('should update last_seen_at on subscription', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Should have called from('players')
      expect(mockSupabase.from).toHaveBeenCalledWith('players')
    })

    it('should send heartbeat every 10 seconds', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Initial heartbeat on subscription
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)

      // Advance 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      // Should have called heartbeat again
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)

      // Advance another 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      // Should have called heartbeat again
      expect(mockSupabase.from).toHaveBeenCalledTimes(3)
    })

    it('should stop heartbeat when connection closes', async () => {
      renderHook(() =>
        usePresence({
          roomId: 'room-123',
          playerId: 'player-123',
        })
      )

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      // Initial heartbeat
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)

      // Close connection
      act(() => {
        mockSupabase._mocks.triggerSubscribe('CLOSED')
      })

      // Advance 20 seconds
      await act(async () => {
        vi.advanceTimersByTime(20000)
      })

      // Should not have called more heartbeats
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })
  })
})
