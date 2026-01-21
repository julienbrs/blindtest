/**
 * Supabase Database Types
 *
 * These types match the database schema defined in the SQL migration.
 * They represent the raw database row shapes before transformation
 * to the application's domain types (Room, Player, Buzz).
 *
 * Generated based on schema from docs/epics/13-multiplayer.md
 * To regenerate from live database:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          host_id: string
          status: string
          settings: Json
          current_song_id: string | null
          current_song_started_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          host_id: string
          status?: string
          settings?: Json
          current_song_id?: string | null
          current_song_started_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          host_id?: string
          status?: string
          settings?: Json
          current_song_id?: string | null
          current_song_started_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          room_id: string
          nickname: string
          score: number
          is_host: boolean
          joined_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          room_id: string
          nickname: string
          score?: number
          is_host?: boolean
          joined_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          nickname?: string
          score?: number
          is_host?: boolean
          joined_at?: string
          last_seen_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'players_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
        ]
      }
      buzzes: {
        Row: {
          id: string
          room_id: string
          player_id: string
          song_id: string
          buzzed_at: string
          is_winner: boolean
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          song_id: string
          buzzed_at?: string
          is_winner?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          song_id?: string
          buzzed_at?: string
          is_winner?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'buzzes_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'buzzes_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases for table rows
export type DbRoom = Database['public']['Tables']['rooms']['Row']
export type DbRoomInsert = Database['public']['Tables']['rooms']['Insert']
export type DbRoomUpdate = Database['public']['Tables']['rooms']['Update']

export type DbPlayer = Database['public']['Tables']['players']['Row']
export type DbPlayerInsert = Database['public']['Tables']['players']['Insert']
export type DbPlayerUpdate = Database['public']['Tables']['players']['Update']

export type DbBuzz = Database['public']['Tables']['buzzes']['Row']
export type DbBuzzInsert = Database['public']['Tables']['buzzes']['Insert']
export type DbBuzzUpdate = Database['public']['Tables']['buzzes']['Update']
