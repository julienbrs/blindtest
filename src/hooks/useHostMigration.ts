'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Room, Player } from '@/lib/types'

/**
 * Grace period in milliseconds before triggering host migration.
 * We wait 10 seconds after the host goes offline before migrating.
 */
const HOST_OFFLINE_GRACE_PERIOD_MS = 10000

export interface UseHostMigrationOptions {
  /** Current room */
  room: Room | null
  /** All players in the room */
  players: Player[]
  /** Current player's ID */
  myPlayerId: string | null
  /** Whether current player is the host */
  isHost: boolean
  /** Map of player IDs to their online status */
  onlineStatus: Map<string, boolean>
  /** Function to check if a player is online */
  isOnline: (playerId: string) => boolean
}

export interface UseHostMigrationResult {
  /** Whether host migration is in progress */
  isMigrating: boolean
  /** Nickname of the new host (when migration just happened) */
  newHostNickname: string | null
  /** Clear the new host notification */
  clearNotification: () => void
}

/**
 * useHostMigration - Hook for handling automatic host migration
 *
 * When the host goes offline for more than 10 seconds, this hook will:
 * 1. Detect the host is offline
 * 2. Select a new host (player with oldest joined_at)
 * 3. Update host_id in room and is_host in players table
 *
 * Only non-host players perform the migration check to avoid race conditions.
 * The player with the oldest joined_at (first to join) will perform the migration.
 *
 * @example
 * ```tsx
 * function MultiplayerRoom({ room, players, myPlayerId, isHost }) {
 *   const { isOnline, onlineStatus } = usePresence({ ... });
 *
 *   const { newHostNickname, clearNotification } = useHostMigration({
 *     room,
 *     players,
 *     myPlayerId,
 *     isHost,
 *     onlineStatus,
 *     isOnline,
 *   });
 *
 *   // Show notification when host changes
 *   if (newHostNickname) {
 *     return <div>{newHostNickname} est maintenant l'hôte</div>;
 *   }
 * }
 * ```
 */
export function useHostMigration(
  options: UseHostMigrationOptions
): UseHostMigrationResult {
  const { room, players, myPlayerId, isHost, onlineStatus, isOnline } = options

  const [isMigrating, setIsMigrating] = useState(false)
  const [newHostNickname, setNewHostNickname] = useState<string | null>(null)

  const migrationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isConfigured = isSupabaseConfigured()

  /**
   * Clear the new host notification
   */
  const clearNotification = useCallback(() => {
    setNewHostNickname(null)
  }, [])

  /**
   * Cancel any pending migration timer
   */
  const cancelMigrationTimer = useCallback(() => {
    if (migrationTimerRef.current) {
      clearTimeout(migrationTimerRef.current)
      migrationTimerRef.current = null
    }
  }, [])

  /**
   * Perform host migration
   * Updates the room's host_id and the players' is_host flags
   */
  const performMigration = useCallback(
    async (newHostPlayer: Player) => {
      if (!room || !isConfigured || isMigrating) return

      setIsMigrating(true)

      try {
        const supabase = getSupabaseClient()

        // Update room with new host_id
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ host_id: newHostPlayer.id })
          .eq('id', room.id)

        if (roomError) {
          console.error('Error updating room host:', roomError)
          setIsMigrating(false)
          return
        }

        // Update old host's is_host to false
        const { error: oldHostError } = await supabase
          .from('players')
          .update({ is_host: false })
          .eq('room_id', room.id)
          .eq('is_host', true)

        if (oldHostError) {
          console.error('Error updating old host:', oldHostError)
        }

        // Update new host's is_host to true
        const { error: newHostError } = await supabase
          .from('players')
          .update({ is_host: true })
          .eq('id', newHostPlayer.id)

        if (newHostError) {
          console.error('Error updating new host:', newHostError)
        }

        // Show notification
        setNewHostNickname(newHostPlayer.nickname)

        // Auto-clear notification after 5 seconds
        setTimeout(() => {
          setNewHostNickname(null)
        }, 5000)
      } catch (err) {
        console.error('Host migration failed:', err)
      } finally {
        setIsMigrating(false)
      }
    },
    [room, isConfigured, isMigrating]
  )

  /**
   * Check if host migration should occur and schedule it
   */
  useEffect(() => {
    // Don't check if:
    // - No room or not configured
    // - Current player is the host (host doesn't migrate themselves)
    // - No players or my player doesn't exist
    // - Room is not in a valid state
    if (!room || !isConfigured || !myPlayerId || isHost || players.length < 2) {
      cancelMigrationTimer()
      return
    }

    // Find the current host
    const currentHost = players.find((p) => p.isHost)
    if (!currentHost) {
      cancelMigrationTimer()
      return
    }

    // Check if host is online
    const hostIsOnline = isOnline(currentHost.id)

    if (hostIsOnline) {
      // Host is online, cancel any pending migration
      cancelMigrationTimer()
      return
    }

    // Host is offline - check if we should be the one to perform migration
    // Only the online player with the oldest joined_at should perform migration
    // This prevents race conditions where multiple players try to migrate simultaneously
    const onlinePlayers = players.filter((p) => {
      // Exclude the offline host
      if (p.id === currentHost.id) return false
      // Check if player is online
      return isOnline(p.id)
    })

    if (onlinePlayers.length === 0) {
      // No online players (other than potentially ourselves who might not be tracked yet)
      cancelMigrationTimer()
      return
    }

    // Sort by joined_at to find the oldest (first to join)
    const sortedOnlinePlayers = [...onlinePlayers].sort((a, b) => {
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    })

    const eldestOnlinePlayer = sortedOnlinePlayers[0]

    // Only the eldest online player should trigger migration
    if (eldestOnlinePlayer.id !== myPlayerId) {
      cancelMigrationTimer()
      return
    }

    // We are the eldest online player - schedule migration if not already scheduled
    if (migrationTimerRef.current) {
      // Timer already running
      return
    }

    // Schedule migration after grace period
    migrationTimerRef.current = setTimeout(() => {
      // Re-check that host is still offline before migrating
      // (use the onlineStatus map directly for the most current state)
      const currentHostStillOffline = onlineStatus.get(currentHost.id) === false

      if (currentHostStillOffline) {
        // Find the new host (eldest online player, excluding current host)
        const newHost = sortedOnlinePlayers[0]
        if (newHost) {
          performMigration(newHost)
        }
      }

      migrationTimerRef.current = null
    }, HOST_OFFLINE_GRACE_PERIOD_MS)

    return () => {
      cancelMigrationTimer()
    }
  }, [
    room,
    players,
    myPlayerId,
    isHost,
    isConfigured,
    onlineStatus,
    isOnline,
    cancelMigrationTimer,
    performMigration,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelMigrationTimer()
    }
  }, [cancelMigrationTimer])

  return {
    isMigrating,
    newHostNickname,
    clearNotification,
  }
}
