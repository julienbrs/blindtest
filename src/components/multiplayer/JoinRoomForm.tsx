'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AvatarPicker } from './AvatarPicker'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import {
  type Avatar,
  getSavedAvatar,
  saveAvatar,
  getDefaultAvatar,
} from '@/lib/avatars'

const PLAYER_ID_KEY = 'blindtest_player_id'
const MAX_NICKNAME_LENGTH = 20
const ROOM_CODE_LENGTH = 6
const MAX_PLAYERS_PER_ROOM = 10

interface JoinRoomFormProps {
  className?: string
}

/**
 * JoinRoomForm - Form for joining an existing multiplayer room
 *
 * Features:
 * - Room code input (6 characters, auto-uppercase)
 * - Nickname input (max 20 characters)
 * - Validates room exists, is in waiting status, and not full
 * - Creates player with is_host=false
 * - Stores playerId in localStorage for reconnection
 * - Redirects to /multiplayer/[code]
 * - Error messages for: room not found, room full, game already started
 */
export function JoinRoomForm({ className = '' }: JoinRoomFormProps) {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [takenAvatars, setTakenAvatars] = useState<Avatar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingAvatars, setIsFetchingAvatars] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved avatar on mount
  useEffect(() => {
    const saved = getSavedAvatar()
    if (saved) {
      setAvatar(saved)
    }
  }, [])

  // Fetch taken avatars when room code changes
  useEffect(() => {
    async function fetchTakenAvatars() {
      if (roomCode.length !== ROOM_CODE_LENGTH) {
        setTakenAvatars([])
        return
      }

      if (!isSupabaseConfigured()) {
        return
      }

      setIsFetchingAvatars(true)
      try {
        const supabase = getSupabaseClient()

        // Get the room
        const { data: room } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', roomCode)
          .single()

        if (!room) {
          setTakenAvatars([])
          setIsFetchingAvatars(false)
          return
        }

        // Get avatars of existing players
        const { data: players } = await supabase
          .from('players')
          .select('avatar')
          .eq('room_id', room.id)

        const taken = (players || [])
          .map((p) => p.avatar)
          .filter((a): a is Avatar => a !== null)

        setTakenAvatars(taken)

        // If current avatar is taken, select a new default
        if (avatar && taken.includes(avatar)) {
          const newDefault = getDefaultAvatar(taken)
          setAvatar(newDefault)
        } else if (!avatar) {
          // If no avatar selected, pick a default
          const defaultAvatar = getDefaultAvatar(taken)
          setAvatar(defaultAvatar)
        }
      } catch {
        // Ignore errors, avatars will be validated on submit
      } finally {
        setIsFetchingAvatars(false)
      }
    }

    fetchTakenAvatars()
  }, [roomCode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Auto-uppercase and limit to 6 characters
      const value = e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH)
      // Only allow valid characters (A-Z except O,I,L and 2-9)
      const filtered = value.replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, '')
      setRoomCode(filtered)
      setError(null)
    },
    []
  )

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

      const trimmedCode = roomCode.trim().toUpperCase()
      const trimmedNickname = nickname.trim()

      if (!trimmedCode || trimmedCode.length !== ROOM_CODE_LENGTH) {
        setError('Veuillez entrer un code de 6 caractères')
        return
      }

      if (!trimmedNickname) {
        setError('Veuillez entrer un pseudo')
        return
      }

      if (!avatar) {
        setError('Veuillez choisir un avatar')
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

        // Check if room exists
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id, status')
          .eq('code', trimmedCode)
          .single()

        if (roomError || !room) {
          setError('Room introuvable. Vérifiez le code et réessayez.')
          setIsLoading(false)
          return
        }

        // Check room status
        if (room.status !== 'waiting') {
          if (room.status === 'playing') {
            setError('La partie a déjà commencé.')
          } else if (room.status === 'ended') {
            setError('Cette partie est terminée.')
          } else {
            setError("Cette room n'est plus disponible.")
          }
          setIsLoading(false)
          return
        }

        // Count current players in the room
        const { count: playerCount, error: countError } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)

        if (countError) {
          throw new Error(`Erreur vérification joueurs: ${countError.message}`)
        }

        if (playerCount !== null && playerCount >= MAX_PLAYERS_PER_ROOM) {
          setError(`La room est pleine (max ${MAX_PLAYERS_PER_ROOM} joueurs).`)
          setIsLoading(false)
          return
        }

        // Check if avatar is already taken (double-check at submit time)
        const { data: existingPlayers } = await supabase
          .from('players')
          .select('avatar')
          .eq('room_id', room.id)
          .eq('avatar', avatar)

        if (existingPlayers && existingPlayers.length > 0) {
          setError('Cet avatar est déjà pris. Choisissez-en un autre.')
          setIsLoading(false)
          return
        }

        // Create the player
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            room_id: room.id,
            nickname: trimmedNickname,
            avatar: avatar,
            score: 0,
            is_host: false,
          })
          .select()
          .single()

        if (playerError) {
          throw new Error(`Erreur création joueur: ${playerError.message}`)
        }

        if (!player) {
          throw new Error("Le joueur n'a pas été créé")
        }

        // Store player ID in localStorage for reconnection
        localStorage.setItem(PLAYER_ID_KEY, player.id)

        // Save avatar choice for future use
        saveAvatar(avatar)

        // Redirect to the room lobby
        router.push(`/multiplayer/${trimmedCode}`)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Une erreur est survenue'
        setError(message)
        setIsLoading(false)
      }
    },
    [roomCode, nickname, avatar, router]
  )

  return (
    <Card variant="elevated" className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">Rejoindre une partie</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="join-code" className="text-sm text-purple-200">
            Code de la room
          </label>
          <input
            id="join-code"
            data-testid="room-code-input"
            type="text"
            value={roomCode}
            onChange={handleCodeChange}
            placeholder="ABCD12"
            maxLength={ROOM_CODE_LENGTH}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-mono text-2xl uppercase tracking-widest text-white placeholder-purple-300/50 outline-none transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30"
            disabled={isLoading}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="join-nickname" className="text-sm text-purple-200">
            Votre pseudo
          </label>
          <input
            id="join-nickname"
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

        <div className="relative">
          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            takenAvatars={takenAvatars}
          />
          {isFetchingAvatars && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <svg
                className="h-5 w-5 animate-spin text-white"
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
            </div>
          )}
        </div>

        {error && (
          <div
            data-testid="error-message"
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="secondary"
          fullWidth
          disabled={
            isLoading ||
            isFetchingAvatars ||
            roomCode.length !== ROOM_CODE_LENGTH ||
            !nickname.trim() ||
            !avatar
          }
          data-testid="join-button"
        >
          {isLoading ? (
            <span
              className="flex items-center justify-center gap-2"
              data-testid="loading-spinner"
            >
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
              Connexion en cours...
            </span>
          ) : (
            'Rejoindre'
          )}
        </Button>
      </form>
    </Card>
  )
}
