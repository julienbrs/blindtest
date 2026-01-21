-- Migration: Setup cron job for cleaning up expired rooms
-- Description: Creates a scheduled job to clean up inactive and ended rooms
-- Date: 2026-01-21
--
-- Prerequisites:
-- 1. Enable pg_cron extension in Supabase Dashboard > Database > Extensions
-- 2. Enable pg_net extension for HTTP calls (or use direct SQL cleanup)
--
-- This migration provides TWO options:
-- Option A: Direct SQL cleanup (preferred, no external dependencies)
-- Option B: Call Edge Function via HTTP (requires pg_net)

-- ============================================================================
-- OPTION A: Direct SQL Cleanup Function (Recommended)
-- ============================================================================
-- This is more reliable as it doesn't depend on HTTP calls

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  one_hour_ago TIMESTAMPTZ := NOW() - INTERVAL '1 hour';
  twenty_four_hours_ago TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
  empty_rooms_deleted INTEGER := 0;
  ended_rooms_deleted INTEGER := 0;
  result jsonb;
BEGIN
  -- Delete rooms with no players that are older than 1 hour
  WITH rooms_with_players AS (
    SELECT DISTINCT room_id FROM players WHERE room_id IS NOT NULL
  ),
  deleted_empty AS (
    DELETE FROM rooms
    WHERE created_at < one_hour_ago
      AND id NOT IN (SELECT room_id FROM rooms_with_players)
    RETURNING id
  )
  SELECT COUNT(*) INTO empty_rooms_deleted FROM deleted_empty;

  -- Delete rooms with status='ended' that are older than 24 hours
  WITH deleted_ended AS (
    DELETE FROM rooms
    WHERE status = 'ended'
      AND created_at < twenty_four_hours_ago
    RETURNING id
  )
  SELECT COUNT(*) INTO ended_rooms_deleted FROM deleted_ended;

  -- Build result JSON
  result := jsonb_build_object(
    'empty_rooms_deleted', empty_rooms_deleted,
    'ended_rooms_deleted', ended_rooms_deleted,
    'total_deleted', empty_rooms_deleted + ended_rooms_deleted,
    'timestamp', NOW()
  );

  -- Log the result
  RAISE NOTICE 'Room cleanup completed: %', result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_rooms() TO service_role;

-- Add comment
COMMENT ON FUNCTION cleanup_expired_rooms() IS
  'Cleans up expired rooms: empty rooms (no players for 1h) and ended rooms (24h+)';

-- ============================================================================
-- CRON JOB SETUP (Run this manually after enabling pg_cron extension)
-- ============================================================================
--
-- To enable pg_cron:
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Search for "pg_cron" and enable it
--
-- Then run this SQL in the SQL Editor:
--
-- SELECT cron.schedule(
--   'cleanup-expired-rooms',          -- job name
--   '0 * * * *',                      -- every hour at minute 0
--   'SELECT cleanup_expired_rooms()'   -- the function to call
-- );
--
-- To view scheduled jobs:
-- SELECT * FROM cron.job;
--
-- To unschedule:
-- SELECT cron.unschedule('cleanup-expired-rooms');
--
-- To run manually:
-- SELECT cleanup_expired_rooms();

-- ============================================================================
-- OPTION B: Edge Function via HTTP (Alternative)
-- ============================================================================
-- If you prefer to use the Edge Function instead of direct SQL,
-- you can set up pg_net to call it:
--
-- 1. Enable pg_net extension in Dashboard
-- 2. Run:
--
-- SELECT cron.schedule(
--   'cleanup-rooms-edge',
--   '0 * * * *',
--   $$SELECT net.http_post(
--     url := 'https://your-project-ref.supabase.co/functions/v1/cleanup-rooms',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
--       'Content-Type', 'application/json'
--     )
--   )$$
-- );
