// Supabase Edge Function: cleanup-rooms
// Deletes expired rooms to keep the database clean
//
// Cleanup rules:
// - Rooms with no players for 1+ hour
// - Rooms with status='ended' for 24+ hours
//
// Deploy: supabase functions deploy cleanup-rooms
// Invoke manually: supabase functions invoke cleanup-rooms
// Set up cron: Use Supabase Dashboard > Database > Extensions > pg_cron
//
// Example cron setup (run every hour):
// SELECT cron.schedule(
//   'cleanup-expired-rooms',
//   '0 * * * *',
//   $$SELECT net.http_post(
//     url := 'https://your-project.supabase.co/functions/v1/cleanup-rooms',
//     headers := '{"Authorization": "Bearer your-service-role-key"}'::jsonb
//   )$$
// );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  emptyRoomsDeleted: number
  endedRoomsDeleted: number
  totalDeleted: number
  timestamp: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create admin client (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Step 1: Find rooms with no players that were created more than 1 hour ago
    // First, get room IDs that have players
    const { data: roomsWithPlayers, error: playersError } = await supabase
      .from('players')
      .select('room_id')
      .not('room_id', 'is', null)

    if (playersError) {
      throw new Error(`Failed to fetch players: ${playersError.message}`)
    }

    const roomIdsWithPlayers = new Set(
      (roomsWithPlayers || []).map((p) => p.room_id)
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
      const { error: deleteEmptyError, count } = await supabase
        .from('rooms')
        .delete()
        .in('id', emptyRoomIds)
        .select('id', { count: 'exact' })

      if (deleteEmptyError) {
        console.error(
          `Failed to delete empty rooms: ${deleteEmptyError.message}`
        )
      } else {
        emptyRoomsDeleted = count || emptyRoomIds.length
        console.log(
          `Deleted ${emptyRoomsDeleted} empty rooms (no players for 1+ hour)`
        )
      }
    }

    // Step 2: Delete rooms with status='ended' that ended more than 24 hours ago
    const {
      data: endedRooms,
      error: endedError,
      count: endedCount,
    } = await supabase
      .from('rooms')
      .delete()
      .eq('status', 'ended')
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .select('id, code', { count: 'exact' })

    let endedRoomsDeleted = 0
    if (endedError) {
      console.error(`Failed to delete ended rooms: ${endedError.message}`)
    } else {
      endedRoomsDeleted = endedCount || (endedRooms?.length ?? 0)
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

    console.log('Cleanup completed:', JSON.stringify(result))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Cleanup error:', errorMessage)

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
