-- Migration: Create multiplayer tables for Blindtest
-- Description: Creates rooms, players, and buzzes tables with RLS and realtime enabled
-- Date: 2026-01-21

-- ============================================================================
-- ROOMS TABLE
-- ============================================================================
-- Stores game rooms with their configuration and current state
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'ended')),
  settings JSONB DEFAULT '{}',
  current_song_id VARCHAR(12),
  current_song_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast room lookup by code
CREATE INDEX idx_rooms_code ON rooms(code);

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
-- Stores players in each room with their scores and status
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(20) NOT NULL,
  score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast player lookup by room
CREATE INDEX idx_players_room_id ON players(room_id);

-- ============================================================================
-- BUZZES TABLE
-- ============================================================================
-- Stores buzz events for each song in a room
CREATE TABLE buzzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  song_id VARCHAR(12) NOT NULL,
  buzzed_at TIMESTAMPTZ DEFAULT NOW(),
  is_winner BOOLEAN DEFAULT FALSE
);

-- Composite index for fast buzz lookup by room and song
CREATE INDEX idx_buzzes_room_song ON buzzes(room_id, song_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES (Permissive for MVP - no auth required)
-- ============================================================================

-- Rooms policies
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE USING (true);

-- Players policies
CREATE POLICY "Anyone can read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join rooms" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON players
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can leave rooms" ON players
  FOR DELETE USING (true);

-- Buzzes policies
CREATE POLICY "Anyone can read buzzes" ON buzzes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can buzz" ON buzzes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update buzzes" ON buzzes
  FOR UPDATE USING (true);

-- ============================================================================
-- REALTIME
-- ============================================================================
-- Enable realtime for all multiplayer tables
-- This allows clients to subscribe to changes via Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE buzzes;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE rooms IS 'Game rooms for multiplayer blindtest sessions';
COMMENT ON COLUMN rooms.code IS '6-character unique room code (uppercase letters and numbers)';
COMMENT ON COLUMN rooms.host_id IS 'UUID of the player who is the current host';
COMMENT ON COLUMN rooms.status IS 'Current room status: waiting, playing, or ended';
COMMENT ON COLUMN rooms.settings IS 'JSON object with game settings (guessMode, clipDuration, etc.)';
COMMENT ON COLUMN rooms.current_song_id IS 'ID of the currently playing song (12-char hex)';
COMMENT ON COLUMN rooms.current_song_started_at IS 'Timestamp when the current song started playing (for sync)';

COMMENT ON TABLE players IS 'Players participating in game rooms';
COMMENT ON COLUMN players.room_id IS 'Reference to the room this player is in';
COMMENT ON COLUMN players.nickname IS 'Display name (max 20 characters)';
COMMENT ON COLUMN players.score IS 'Current score in the game';
COMMENT ON COLUMN players.is_host IS 'Whether this player is the room host';
COMMENT ON COLUMN players.last_seen_at IS 'Last activity timestamp for presence tracking';

COMMENT ON TABLE buzzes IS 'Buzz events when players press the buzzer';
COMMENT ON COLUMN buzzes.room_id IS 'Reference to the room';
COMMENT ON COLUMN buzzes.player_id IS 'Reference to the player who buzzed';
COMMENT ON COLUMN buzzes.song_id IS 'ID of the song when buzz occurred';
COMMENT ON COLUMN buzzes.buzzed_at IS 'Server timestamp of the buzz (used to determine winner)';
COMMENT ON COLUMN buzzes.is_winner IS 'Whether this buzz won the round (first valid buzz)';
