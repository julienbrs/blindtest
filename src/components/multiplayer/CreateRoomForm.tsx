'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { GameConfig } from '@/lib/types'

const PLAYER_ID_KEY = 'blindtest_player_id'
const MAX_NICKNAME_LENGTH = 20

/**
 * Generate a random 6-character room code (uppercase letters + digits)
 * Excludes ambiguous characters: 0, O, I, L, 1
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Default game settings for a new room
 */
const defaultSettings: GameConfig = {
  guessMode: 'both',
  clipDuration: 15,
  timerDuration: 5,
  noTimer: false,
  revealDuration: 5,
}

interface CreateRoomFormProps {
  className?: string
}

/**
 * CreateRoomForm - Form for creating a new multiplayer room
 *
 * Features:
 * - Nickname input (max 20 characters)
 * - Creates room with 6-character code
 * - Creates host player
 * - Stores playerId in localStorage for reconnection
 * - Redirects to /multiplayer/[code]
 */
export function CreateRoomForm({ className = '' }: CreateRoomFormProps) {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNicknameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.slice(0, MAX_NICKNAME_LENGTH)
      setNickname(value)
      setError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmedNickname = nickname.trim()

      if (!trimmedNickname) {
        setError('Veuillez entrer un pseudo')
        return
      }

      if (!isSupabaseConfigured()) {
        setError(
          'Supabase non configuré. Le mode multijoueur est indisponible.'
        )
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Generate a unique room code (retry if collision)
        let code = generateRoomCode()
        let attempts = 0
        const maxAttempts = 5

        while (attempts < maxAttempts) {
          const { data: existingRoom } = await supabase
            .from('rooms')
            .select('id')
            .eq('code', code)
            .single()

          if (!existingRoom) {
            break
          }

          code = generateRoomCode()
          attempts++
        }

        if (attempts >= maxAttempts) {
          throw new Error('Impossible de générer un code de room unique')
        }

        // Create the room
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .insert({
            code,
            host_id: crypto.randomUUID(), // Temporary, will be updated with player ID
            status: 'waiting',
            settings: defaultSettings,
            current_song_id: null,
            current_song_started_at: null,
          })
          .select()
          .single()

        if (roomError) {
          throw new Error(`Erreur création room: ${roomError.message}`)
        }

        if (!room) {
          throw new Error("La room n'a pas été créée")
        }

        // Create the host player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            room_id: room.id,
            nickname: trimmedNickname,
            score: 0,
            is_host: true,
          })
          .select()
          .single()

        if (playerError) {
          // Cleanup: delete the room if player creation failed
          await supabase.from('rooms').delete().eq('id', room.id)
          throw new Error(`Erreur création joueur: ${playerError.message}`)
        }

        if (!player) {
          await supabase.from('rooms').delete().eq('id', room.id)
          throw new Error("Le joueur n'a pas été créé")
        }

        // Update room with the actual host_id
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ host_id: player.id })
          .eq('id', room.id)

        if (updateError) {
          console.warn('Failed to update host_id:', updateError.message)
        }

        // Store player ID in localStorage for reconnection
        localStorage.setItem(PLAYER_ID_KEY, player.id)

        // Redirect to the room lobby
        router.push(`/multiplayer/${code}`)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Une erreur est survenue'
        setError(message)
        setIsLoading(false)
      }
    },
    [nickname, router]
  )

  return (
    <Card variant="elevated" className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">Créer une partie</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="create-nickname" className="text-sm text-purple-200">
            Votre pseudo
          </label>
          <input
            id="create-nickname"
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Entrez votre pseudo..."
            maxLength={MAX_NICKNAME_LENGTH}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-300/50 outline-none transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30"
            disabled={isLoading}
            autoComplete="off"
          />
          <span className="text-right text-xs text-purple-300/70">
            {nickname.length}/{MAX_NICKNAME_LENGTH}
          </span>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading || !nickname.trim()}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Création en cours...
            </span>
          ) : (
            'Créer une partie'
          )}
        </Button>
      </form>
    </Card>
  )
}
