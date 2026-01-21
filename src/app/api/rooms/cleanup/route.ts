import { NextResponse } from 'next/server'
import { getSupabaseClientSafe } from '@/lib/supabase'

/**
 * POST /api/rooms/cleanup
 *
 * App-level alternative to the Supabase Edge Function for cleaning up expired rooms.
 * This can be called by an external cron service (e.g., cron-job.org, GitHub Actions)
 * if you don't have access to Supabase pg_cron.
 *
 * Cleanup rules:
 * - Rooms with no players that were created more than 1 hour ago
 * - Rooms with status='ended' that were created more than 24 hours ago
 *
 * Security: This endpoint is public but only performs cleanup operations.
 * For production, consider adding an API key check.
 */

interface CleanupResult {
  emptyRoomsDeleted: number
  endedRoomsDeleted: number
  totalDeleted: number
  timestamp: string
}

export async function POST(): Promise<NextResponse> {
  const supabase = getSupabaseClientSafe()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Step 1: Find rooms with no players that were created more than 1 hour ago
    // First, get room IDs that have players
    const { data: roomsWithPlayers, error: playersError } = await supabase
      .from('players')
      .select('room_id')

    if (playersError) {
      throw new Error(`Failed to fetch players: ${playersError.message}`)
    }

    const roomIdsWithPlayers = new Set(
      (roomsWithPlayers || [])
        .map((p) => p.room_id)
        .filter((id): id is string => id !== null)
    )

    // Get all rooms created more than 1 hour ago
    const { data: oldRooms, error: oldRoomsError } = await supabase
      .from('rooms')
      .select('id, code, status, created_at')
      .lt('created_at', oneHourAgo.toISOString())

    if (oldRoomsError) {
      throw new Error(`Failed to fetch old rooms: ${oldRoomsError.message}`)
    }

    // Filter to rooms with no players
    const emptyRoomIds = (oldRooms || [])
      .filter((room) => !roomIdsWithPlayers.has(room.id))
      .map((room) => room.id)

    // Delete empty rooms
    let emptyRoomsDeleted = 0
    if (emptyRoomIds.length > 0) {
      const { error: deleteEmptyError } = await supabase
        .from('rooms')
        .delete()
        .in('id', emptyRoomIds)

      if (deleteEmptyError) {
        console.error(
          `Failed to delete empty rooms: ${deleteEmptyError.message}`
        )
      } else {
        emptyRoomsDeleted = emptyRoomIds.length
        console.log(
          `Deleted ${emptyRoomsDeleted} empty rooms (no players for 1+ hour)`
        )
      }
    }

    // Step 2: Delete rooms with status='ended' that ended more than 24 hours ago
    const { data: endedRooms, error: endedError } = await supabase
      .from('rooms')
      .delete()
      .eq('status', 'ended')
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .select('id')

    let endedRoomsDeleted = 0
    if (endedError) {
      console.error(`Failed to delete ended rooms: ${endedError.message}`)
    } else {
      endedRoomsDeleted = endedRooms?.length ?? 0
      if (endedRoomsDeleted > 0) {
        console.log(
          `Deleted ${endedRoomsDeleted} ended rooms (ended 24+ hours ago)`
        )
      }
    }

    const result: CleanupResult = {
      emptyRoomsDeleted,
      endedRoomsDeleted,
      totalDeleted: emptyRoomsDeleted + endedRoomsDeleted,
      timestamp: now.toISOString(),
    }

    console.log('Room cleanup completed:', JSON.stringify(result))

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Cleanup error:', errorMessage)

    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple cron services that only support GET
export async function GET(): Promise<NextResponse> {
  return POST()
}
