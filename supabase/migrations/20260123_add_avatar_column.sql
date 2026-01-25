-- Add avatar column to players table
-- Stores the emoji avatar chosen by the player (unique within each room)
ALTER TABLE players ADD COLUMN avatar VARCHAR(10);
