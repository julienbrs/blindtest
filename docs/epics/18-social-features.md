# Epic 18: Social Features

Ajouter des fonctionnalités sociales au mode multijoueur : avatars emoji, reactions live, et historique des réponses.

---

## 18.1 Créer le système d'avatars emoji

**Description**: Permettre aux joueurs de choisir un avatar emoji parmi un set prédéfini, unique dans chaque room.

**Acceptance Criteria**:

- [ ] Liste de 15-20 emojis fun définie
- [ ] Composant `AvatarPicker` créé avec grille d'emojis
- [ ] Avatar obligatoire au moment de rejoindre une room
- [ ] Validation côté client : avatar unique dans la room
- [ ] Persistance de l'avatar choisi en localStorage
- [ ] Suggestion de l'avatar précédent au prochain join
- [ ] Type `Player` mis à jour avec champ `avatar`
- [ ] Colonne `avatar` ajoutée à la table `players` dans Supabase

**Files**:

- `src/lib/avatars.ts` (créer)
- `src/components/multiplayer/AvatarPicker.tsx` (créer)
- `src/components/multiplayer/CreateRoomForm.tsx` (modifier)
- `src/components/multiplayer/JoinRoomForm.tsx` (modifier)
- `src/lib/types.ts` (modifier)
- `supabase/migrations/xxx_add_avatar.sql` (créer)

**Implementation Notes**:

```typescript
// src/lib/avatars.ts
export const AVATARS = [
  '🎸',
  '🎤',
  '🎹',
  '🎺',
  '🎷',
  '🥁',
  '🎻',
  '🪗',
  '🎵',
  '🎶',
  '🦄',
  '🌟',
  '⭐',
  '🔥',
  '💎',
  '🎯',
  '🏆',
  '👑',
  '🦋',
  '🌈',
] as const

export type Avatar = (typeof AVATARS)[number]

export function getAvailableAvatars(takenAvatars: Avatar[]): Avatar[] {
  return AVATARS.filter((a) => !takenAvatars.includes(a))
}

export function getSavedAvatar(): Avatar | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('blindtest-avatar') as Avatar | null
}

export function saveAvatar(avatar: Avatar): void {
  localStorage.setItem('blindtest-avatar', avatar)
}
```

```tsx
// AvatarPicker.tsx
interface AvatarPickerProps {
  value: Avatar | null
  onChange: (avatar: Avatar) => void
  takenAvatars: Avatar[]
}

export function AvatarPicker({
  value,
  onChange,
  takenAvatars,
}: AvatarPickerProps) {
  const available = getAvailableAvatars(takenAvatars)

  return (
    <div className="grid grid-cols-5 gap-2">
      {AVATARS.map((emoji) => {
        const isTaken = takenAvatars.includes(emoji)
        const isSelected = value === emoji

        return (
          <button
            key={emoji}
            onClick={() => !isTaken && onChange(emoji)}
            disabled={isTaken}
            className={cn(
              'w-12 h-12 text-2xl rounded-full transition-all',
              isSelected && 'ring-2 ring-purple-400 bg-purple-500/30',
              isTaken && 'opacity-30 cursor-not-allowed',
              !isTaken && !isSelected && 'hover:bg-white/10'
            )}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}
```

**SQL Migration**:

```sql
-- Add avatar column to players table
ALTER TABLE players ADD COLUMN avatar VARCHAR(10);
```

---

## 18.2 Afficher les avatars dans lobby, leaderboard et podium

**Description**: Intégrer les avatars dans tous les endroits où les joueurs sont affichés.

**Acceptance Criteria**:

- [ ] Avatar affiché dans la liste des joueurs du lobby
- [ ] Avatar affiché dans le leaderboard pendant le jeu
- [ ] Avatar affiché sur le podium de fin de partie
- [ ] Style cohérent : emoji dans un cercle avec background coloré
- [ ] Fallback si pas d'avatar (première lettre du pseudo)

**Files**:

- `src/components/multiplayer/Lobby.tsx` (modifier)
- `src/components/multiplayer/Leaderboard.tsx` (modifier)
- `src/components/multiplayer/MultiplayerRecap.tsx` (modifier)
- `src/components/ui/PlayerAvatar.tsx` (créer)

**Implementation Notes**:

```tsx
// PlayerAvatar.tsx
interface PlayerAvatarProps {
  avatar?: string | null
  nickname: string
  size?: 'sm' | 'md' | 'lg'
}

export function PlayerAvatar({
  avatar,
  nickname,
  size = 'md',
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-3xl',
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30',
        'flex items-center justify-center',
        sizeClasses[size]
      )}
    >
      {avatar || nickname.charAt(0).toUpperCase()}
    </div>
  )
}
```

---

## 18.3 Implémenter les reactions live en jeu

**Description**: Permettre aux joueurs d'envoyer des emojis de reaction pendant la partie, style Twitch.

**Acceptance Criteria**:

- [ ] Set de 8 emojis prédéfinis : 👏 🔥 😱 😂 🎉 ❤️ 💀 🤯
- [ ] Barre de reactions accessible pendant le jeu
- [ ] Rate limit : 1 reaction par seconde max par joueur
- [ ] Affichage float-up depuis le bas de l'écran
- [ ] Reactions disparaissent après 2-3 secondes
- [ ] Synchronisation via Supabase Broadcast channel
- [ ] Respecter `prefers-reduced-motion`

**Files**:

- `src/lib/reactions.ts` (créer)
- `src/components/multiplayer/ReactionPicker.tsx` (créer)
- `src/components/multiplayer/ReactionOverlay.tsx` (créer)
- `src/hooks/useReactions.ts` (créer)
- `src/app/multiplayer/[code]/page.tsx` (modifier)

**Implementation Notes**:

```typescript
// src/lib/reactions.ts
export const REACTIONS = [
  '👏',
  '🔥',
  '😱',
  '😂',
  '🎉',
  '❤️',
  '💀',
  '🤯',
] as const
export type Reaction = (typeof REACTIONS)[number]
```

```tsx
// useReactions.ts
export function useReactions(roomCode: string, playerId: string) {
  const [reactions, setReactions] = useState<ReactionEvent[]>([])
  const lastSentRef = useRef<number>(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${roomCode}`)
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        setReactions((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            emoji: payload.emoji,
            playerId: payload.playerId,
            playerNickname: payload.playerNickname,
            timestamp: Date.now(),
          },
        ])

        // Auto-remove after 3s
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== payload.id))
        }, 3000)
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      channel.unsubscribe()
    }
  }, [roomCode])

  const sendReaction = useCallback(
    (emoji: Reaction, nickname: string) => {
      const now = Date.now()
      if (now - lastSentRef.current < 1000) return // Rate limit
      lastSentRef.current = now

      channelRef.current?.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji, playerId, playerNickname: nickname },
      })
    },
    [playerId]
  )

  return { reactions, sendReaction }
}
```

```tsx
// ReactionOverlay.tsx
export function ReactionOverlay({ reactions }: { reactions: ReactionEvent[] }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{
              opacity: 1,
              y: '100vh',
              x: `${Math.random() * 80 + 10}%`,
            }}
            animate={{ opacity: 1, y: '-10vh' }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 3,
              ease: 'linear',
            }}
            className="absolute text-4xl"
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

---

## 18.4 Créer l'historique des réponses en fin de partie

**Description**: Afficher un historique détaillé de toutes les réponses dans le recap de fin de partie multijoueur.

**Acceptance Criteria**:

- [ ] Composant `GameHistory` créé
- [ ] Affiche pour chaque round : chanson, qui a buzzé, temps de réponse, résultat
- [ ] Design timeline ou tableau scrollable
- [ ] Intégré dans `MultiplayerRecap`
- [ ] Données collectées pendant le jeu via `useMultiplayerGame`
- [ ] Style cohérent avec le reste de l'app

**Files**:

- `src/components/multiplayer/GameHistory.tsx` (créer)
- `src/components/multiplayer/MultiplayerRecap.tsx` (modifier)
- `src/hooks/useMultiplayerGame.ts` (modifier)
- `src/lib/types.ts` (modifier - ajouter type RoundHistory)

**Implementation Notes**:

```typescript
// types.ts
export interface RoundHistory {
  songId: string
  songTitle: string
  songArtist: string
  buzzWinner: {
    playerId: string
    nickname: string
    avatar: string | null
    buzzTime: number // ms depuis le début de la chanson
  } | null
  wasCorrect: boolean
  roundNumber: number
}
```

```tsx
// GameHistory.tsx
interface GameHistoryProps {
  history: RoundHistory[]
  players: Player[]
}

export function GameHistory({ history, players }: GameHistoryProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 max-h-64 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Historique</h3>
      <div className="space-y-3">
        {history.map((round, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            <span className="text-purple-300 w-6">#{round.roundNumber}</span>
            <div className="flex-1">
              <div className="font-medium truncate">{round.songTitle}</div>
              <div className="text-purple-300 text-xs">{round.songArtist}</div>
            </div>
            {round.buzzWinner ? (
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  avatar={round.buzzWinner.avatar}
                  nickname={round.buzzWinner.nickname}
                  size="sm"
                />
                <span
                  className={
                    round.wasCorrect ? 'text-green-400' : 'text-red-400'
                  }
                >
                  {round.wasCorrect ? '✓' : '✗'}
                </span>
                <span className="text-purple-300 text-xs">
                  {(round.buzzWinner.buzzTime / 1000).toFixed(1)}s
                </span>
              </div>
            ) : (
              <span className="text-purple-400 text-xs">Pas de buzz</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```
