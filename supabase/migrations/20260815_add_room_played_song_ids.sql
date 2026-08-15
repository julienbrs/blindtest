-- Persist the multiplayer selection history so reconnecting players and a new
-- host keep excluding every song already played in the current game.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS played_song_ids text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.rooms.played_song_ids IS
  'Song IDs completed before the current multiplayer round';
