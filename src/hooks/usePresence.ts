'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Grace period in milliseconds before marking a player as offline.
 * This prevents flickering during network blips or reconnections.
 */
const GRACE_PERIOD_MS = 5000

/**
 * Presence state for a player
 */
interface PresenceState {
  playerId: string
  nickname?: string
  joinedAt: number
}

/**
 * Map of player IDs to their online status
 */
export type OnlineStatus = Map<string, boolean>

export interface UsePresenceOptions {
  /** Room ID to track presence for */
  roomId: string | null
  /** Current player's ID */
  playerId: string | null
  /** Optional nickname for presence payload */
  nickname?: string
}

export interface UsePresenceResult {
  /** Map of player IDs to their online status */
  onlineStatus: OnlineStatus
  /** Check if a specific player is online */
  isOnline: (playerId: string) => boolean
  /** Whether the presence channel is connected */
  isConnected: boolean
}

/**
 * usePresence - Hook for tracking player presence via Supabase Realtime
 *
 * Uses Supabase Presence to track which players are online in a room.
 * Implements a grace period (tombstone pattern) to prevent flickering
 * when players briefly disconnect.
 *
 * @param options - Configuration options
 * @returns Presence state and helper functions
 *
 * @example
 * ```tsx
 * function Lobby({ room, players, myPlayerId }) {
 *   const { isOnline } = usePresence({
 *     roomId: room?.id,
 *     playerId: myPlayerId,
 *     nickname: myPlayer?.nickname,
 *   });
 *
 *   return (
 *     <ul>
 *       {players.map(player => (
 *         <li key={player.id}>
 *           {player.nickname}
 *           <span>{isOnline(player.id) ? '🟢' : '⚫'}</span>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePresence(options: UsePresenceOptions): UsePresenceResult {
  const { roomId, playerId, nickname } = options

  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const tombstonesRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const isConfigured = isSupabaseConfigured()

  /**
   * Check if a specific player is online
   */
  const isOnline = useCallback(
    (id: string): boolean => {
      return onlineStatus.get(id) ?? false
    },
    [onlineStatus]
  )

  /**
   * Clear all tombstone timers (cleanup)
   */
  const clearAllTombstones = useCallback(() => {
    tombstonesRef.current.forEach((timer) => clearTimeout(timer))
    tombstonesRef.current.clear()
  }, [])

  /**
   * Cancel a tombstone timer for a player (they reconnected)
   */
  const cancelTombstone = useCallback((id: string) => {
    const timer = tombstonesRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      tombstonesRef.current.delete(id)
    }
  }, [])

  /**
   * Schedule a player to be marked offline after grace period
   */
  const scheduleTombstone = useCallback((id: string) => {
    // Cancel any existing tombstone for this player
    const existing = tombstonesRef.current.get(id)
    if (existing) {
      clearTimeout(existing)
    }

    // Schedule the tombstone
    const timer = setTimeout(() => {
      setOnlineStatus((prev) => {
        const next = new Map(prev)
        next.set(id, false)
        return next
      })
      tombstonesRef.current.delete(id)
    }, GRACE_PERIOD_MS)

    tombstonesRef.current.set(id, timer)
  }, [])

  useEffect(() => {
    // Don't subscribe if missing required data
    if (!roomId || !playerId || !isConfigured) {
      return
    }

    const supabase = getSupabaseClient()
    const channelName = `room:${roomId}:presence`

    // Create presence channel
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: playerId,
        },
      },
    })

    // Handle sync event (initial state and updates)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>()

      setOnlineStatus((prev) => {
        const next = new Map(prev)

        // Get all currently present player IDs
        const presentIds = new Set<string>()
        Object.keys(state).forEach((key) => {
          presentIds.add(key)
          // Mark as online and cancel any pending tombstone
          next.set(key, true)
          cancelTombstone(key)
        })

        // Mark players not in presence as potentially offline
        // (they'll go through tombstone grace period)
        prev.forEach((_, id) => {
          if (!presentIds.has(id) && prev.get(id) === true) {
            // Player was online but now not in presence - schedule tombstone
            scheduleTombstone(id)
          }
        })

        return next
      })
    })

    // Handle join event
    channel.on('presence', { event: 'join' }, ({ key }) => {
      // Cancel any pending tombstone for this player
      cancelTombstone(key)

      setOnlineStatus((prev) => {
        const next = new Map(prev)
        next.set(key, true)
        return next
      })
    })

    // Handle leave event
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      // Don't immediately mark as offline - use tombstone pattern
      scheduleTombstone(key)
    })

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)

        // Track this player's presence
        const presenceState: PresenceState = {
          playerId,
          nickname,
          joinedAt: Date.now(),
        }

        await channel.track(presenceState)

        // Mark ourselves as online
        setOnlineStatus((prev) => {
          const next = new Map(prev)
          next.set(playerId, true)
          return next
        })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    // Cleanup on unmount or when dependencies change
    return () => {
      clearAllTombstones()
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [
    roomId,
    playerId,
    nickname,
    isConfigured,
    cancelTombstone,
    scheduleTombstone,
    clearAllTombstones,
  ])

  return {
    onlineStatus,
    isOnline,
    isConnected,
  }
}
