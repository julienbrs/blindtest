# Supabase Database Setup

This document explains how to set up the Supabase database for the Blindtest multiplayer feature.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project URL and anon key configured in `.env.local`

## Running the Migration

### Option 1: Supabase Dashboard (Recommended for beginners)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20260121_create_multiplayer_tables.sql`
6. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project (one-time setup)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Direct psql Connection

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20260121_create_multiplayer_tables.sql
```

## Database Schema

### Tables

#### `rooms`

Stores game rooms with their configuration and current state.

| Column                    | Type        | Description                                   |
| ------------------------- | ----------- | --------------------------------------------- |
| `id`                      | UUID        | Primary key                                   |
| `code`                    | VARCHAR(6)  | Unique 6-character room code                  |
| `host_id`                 | UUID        | Player ID of the room host                    |
| `status`                  | VARCHAR(20) | Room status: `waiting`, `playing`, `ended`    |
| `settings`                | JSONB       | Game settings (guessMode, clipDuration, etc.) |
| `current_song_id`         | VARCHAR(12) | ID of currently playing song                  |
| `current_song_started_at` | TIMESTAMPTZ | Sync timestamp for audio playback             |
| `created_at`              | TIMESTAMPTZ | Room creation timestamp                       |

#### `players`

Stores players participating in game rooms.

| Column         | Type        | Description                  |
| -------------- | ----------- | ---------------------------- |
| `id`           | UUID        | Primary key                  |
| `room_id`      | UUID        | Foreign key to rooms         |
| `nickname`     | VARCHAR(20) | Player display name          |
| `score`        | INTEGER     | Current game score           |
| `is_host`      | BOOLEAN     | Whether player is room host  |
| `joined_at`    | TIMESTAMPTZ | When player joined           |
| `last_seen_at` | TIMESTAMPTZ | Last activity (for presence) |

#### `buzzes`

Stores buzz events for determining who answered first.

| Column      | Type        | Description              |
| ----------- | ----------- | ------------------------ |
| `id`        | UUID        | Primary key              |
| `room_id`   | UUID        | Foreign key to rooms     |
| `player_id` | UUID        | Foreign key to players   |
| `song_id`   | VARCHAR(12) | Song ID when buzzed      |
| `buzzed_at` | TIMESTAMPTZ | Server timestamp of buzz |
| `is_winner` | BOOLEAN     | Whether this buzz won    |

### Indexes

- `idx_rooms_code` - Fast room lookup by code
- `idx_players_room_id` - Fast player lookup by room
- `idx_buzzes_room_song` - Fast buzz lookup by room and song

### Row Level Security (RLS)

RLS is enabled on all tables with permissive policies for the MVP:

- **Rooms**: Anyone can read, create, update, delete
- **Players**: Anyone can read, join, update, leave
- **Buzzes**: Anyone can read, create, update

> **Note**: These policies are intentionally permissive for the MVP. In production, you would want to add authentication and more restrictive policies.

### Realtime

All three tables are added to the `supabase_realtime` publication, enabling real-time subscriptions for:

- Room status changes
- Player join/leave events
- Buzz events

## Verifying the Setup

After running the migration, verify the tables exist:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('rooms', 'players', 'buzzes');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('rooms', 'players', 'buzzes');

-- Check realtime is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

## Troubleshooting

### "relation already exists" error

If you see this error, the tables already exist. You can either:

1. Drop the existing tables first (careful in production!)
2. Skip the migration if tables are already correct

### Realtime not working

1. Ensure the tables are in the `supabase_realtime` publication
2. Check that your Supabase plan supports Realtime
3. Verify your client is subscribing correctly

### RLS blocking access

If you're getting permission errors:

1. Verify RLS policies are created correctly
2. Check you're using the correct Supabase client (anon vs service role)
