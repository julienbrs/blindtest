'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Reaction, ReactionEvent } from '@/lib/reactions'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Rate limit for sending reactions (milliseconds)
 * Players can send at most 1 reaction per second
 */
const RATE_LIMIT_MS = 1000

/**
 * Duration to display reactions before they disappear (milliseconds)
 */
const REACTION_DURATION_MS = 3000

export interface UseReactionsOptions {
  /** Room code to join the reactions channel */
  roomCode: string
  /** Current player's ID */
  playerId: string | null
  /** Current player's nickname */
  nickname: string | null
}

export interface UseReactionsResult {
  /** Active reactions to display */
  reactions: ReactionEvent[]
  /** Send a reaction (rate limited to 1 per second) */
  sendReaction: (emoji: Reaction) => void
  /** Whether reactions are available (Supabase configured) */
  isAvailable: boolean
}

/**
 * useReactions - Hook for live emoji reactions in multiplayer games
 *
 * Uses Supabase Broadcast channel for real-time reaction synchronization.
 * Reactions float up from the bottom of the screen and disappear after 3 seconds.
 *
 * @example
 * ```tsx
 * function MultiplayerGame({ roomCode, playerId, nickname }) {
 *   const { reactions, sendReaction } = useReactions({
 *     roomCode,
 *     playerId,
 *     nickname,
 *   });
 *
 *   return (
 *     <>
 *       <ReactionOverlay reactions={reactions} />
 *       <ReactionPicker onReact={sendReaction} />
 *     </>
 *   );
 * }
 * ```
 */
export function useReactions(options: UseReactionsOptions): UseReactionsResult {
  const { roomCode, playerId, nickname } = options

  const [reactions, setReactions] = useState<ReactionEvent[]>([])
  const lastSentRef = useRef<number>(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isConfigured = isSupabaseConfigured()

  // Subscribe to broadcast channel for reactions
  useEffect(() => {
    if (!isConfigured || !roomCode) return

    const supabase = getSupabaseClient()
    const channel = supabase.channel(`reactions:${roomCode}`)

    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const reactionId = payload.id || crypto.randomUUID()
        const newReaction: ReactionEvent = {
          id: reactionId,
          emoji: payload.emoji as Reaction,
          playerId: payload.playerId as string,
          playerNickname: payload.playerNickname as string,
          timestamp: Date.now(),
        }

        setReactions((prev) => [...prev, newReaction])

        // Auto-remove after REACTION_DURATION_MS
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reactionId))
        }, REACTION_DURATION_MS)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomCode, isConfigured])

  // Send a reaction with rate limiting
  const sendReaction = useCallback(
    (emoji: Reaction) => {
      if (!isConfigured || !playerId || !nickname || !channelRef.current) {
        return
      }

      const now = Date.now()
      if (now - lastSentRef.current < RATE_LIMIT_MS) {
        return // Rate limited
      }
      lastSentRef.current = now

      const reactionId = crypto.randomUUID()

      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: {
          id: reactionId,
          emoji,
          playerId,
          playerNickname: nickname,
        },
      })
    },
    [isConfigured, playerId, nickname]
  )

  return {
    reactions,
    sendReaction,
    isAvailable: isConfigured && !!roomCode,
  }
}
