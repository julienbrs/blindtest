# Epic 6 : Logique de jeu (State Machine)

## Objectif
Implémenter la machine d'état qui gère le flux du jeu : transitions entre les états, gestion du timer, validation des réponses, etc.

## Dépendances
- Epic 1 terminé (types définis)
- Compréhension du flux de jeu

---

## Diagramme d'état

```
                    ┌──────────┐
                    │   IDLE   │ ← État initial / Fin de partie
                    └────┬─────┘
                         │ START_GAME
                         ▼
                    ┌──────────┐
         ┌─────────│ LOADING  │←─────────────────────┐
         │         └────┬─────┘                      │
         │              │ Song loaded                │
         │              ▼                            │
         │         ┌──────────┐                      │
         │         │ PLAYING  │                      │
         │         └────┬─────┘                      │
         │              │ BUZZ                       │
         │              ▼                            │
         │         ┌──────────┐                      │
         │         │  BUZZED  │                      │
         │         └────┬─────┘                      │
         │              │ (immédiat)                 │
         │              ▼                            │
         │         ┌──────────┐                      │
         │         │  TIMER   │──── VALIDATE(true) ──┤
         │         └────┬─────┘                      │
         │              │ Timeout ou VALIDATE(false) │
         │              ▼                            │
         │         ┌──────────┐                      │
         └─────────│  REVEAL  │                      │
           QUIT    └────┬─────┘                      │
                        │ NEXT_SONG                  │
                        └────────────────────────────┘
```

---

## Issues

### 6.1 Créer le hook useGameState
**Priorité** : P0 (Critique)

**Description**
Hook React personnalisé qui encapsule toute la logique de la machine d'état du jeu.

**Fichier** : `src/hooks/useGameState.ts`

**Implémentation**
```typescript
'use client'

import { useReducer, useEffect, useCallback } from 'react'
import type { GameState, GameAction, GameConfig, Song } from '@/lib/types'

const initialState: GameState = {
  status: 'idle',
  currentSong: null,
  score: 0,
  songsPlayed: 0,
  playedSongIds: [],
  timerRemaining: 5,
  isRevealed: false,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, status: 'loading' }

    case 'LOAD_SONG':
      return {
        ...state,
        status: 'loading',
        currentSong: action.song,
        isRevealed: false,
      }

    case 'PLAY':
      return { ...state, status: 'playing' }

    case 'BUZZ':
      return { ...state, status: 'timer', timerRemaining: 5 }

    case 'TICK_TIMER':
      const newRemaining = state.timerRemaining - 1
      if (newRemaining <= 0) {
        return { ...state, status: 'reveal', timerRemaining: 0, isRevealed: true }
      }
      return { ...state, timerRemaining: newRemaining }

    case 'VALIDATE':
      return {
        ...state,
        status: 'reveal',
        isRevealed: true,
        score: action.correct ? state.score + 1 : state.score,
        songsPlayed: state.songsPlayed + 1,
        playedSongIds: state.currentSong
          ? [...state.playedSongIds, state.currentSong.id]
          : state.playedSongIds,
      }

    case 'REVEAL':
      return {
        ...state,
        status: 'reveal',
        isRevealed: true,
        songsPlayed: state.songsPlayed + (state.status !== 'reveal' ? 1 : 0),
        playedSongIds: state.currentSong && !state.playedSongIds.includes(state.currentSong.id)
          ? [...state.playedSongIds, state.currentSong.id]
          : state.playedSongIds,
      }

    case 'NEXT_SONG':
      return { ...state, status: 'loading', isRevealed: false }

    case 'END_GAME':
      return { ...state, status: 'ended' }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useGameState(config: GameConfig) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    timerRemaining: config.timerDuration,
  })

  // Timer countdown
  useEffect(() => {
    if (state.status !== 'timer') return

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.status])

  // Actions exposées
  const actions = {
    startGame: useCallback(() => dispatch({ type: 'START_GAME' }), []),
    loadSong: useCallback((song: Song) => dispatch({ type: 'LOAD_SONG', song }), []),
    play: useCallback(() => dispatch({ type: 'PLAY' }), []),
    pause: useCallback(() => dispatch({ type: 'PLAY' }), []), // Toggle
    buzz: useCallback(() => dispatch({ type: 'BUZZ' }), []),
    validate: useCallback((correct: boolean) => dispatch({ type: 'VALIDATE', correct }), []),
    reveal: useCallback(() => dispatch({ type: 'REVEAL' }), []),
    nextSong: useCallback(() => dispatch({ type: 'NEXT_SONG' }), []),
    quit: useCallback(() => dispatch({ type: 'END_GAME' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    clipEnded: useCallback(() => {
      // Fin de l'extrait sans buzz = révéler
      if (state.status === 'playing') {
        dispatch({ type: 'REVEAL' })
      }
    }, [state.status]),
  }

  return { state, actions, dispatch }
}
```

**Critères d'acceptation**
- [ ] Hook utilisable dans les composants
- [ ] State immutable
- [ ] Actions typées
- [ ] Timer fonctionnel

---

### 6.2 Définir les états du jeu
**Priorité** : P0 (Critique)

**Description**
Documenter et typer tous les états possibles du jeu.

**États**
| État | Description | Actions possibles |
|------|-------------|-------------------|
| `idle` | En attente, avant de démarrer | START_GAME |
| `loading` | Chargement d'une chanson | - (automatique) |
| `playing` | Musique en lecture | BUZZ, REVEAL, PAUSE |
| `buzzed` | Transition après buzz | - (immédiat vers timer) |
| `timer` | Countdown pour répondre | VALIDATE, REVEAL |
| `reveal` | Réponse affichée | NEXT_SONG, END_GAME |
| `ended` | Partie terminée | RESET |

**Type** (déjà dans types.ts)
```typescript
export type GameStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'buzzed'
  | 'timer'
  | 'reveal'
  | 'ended'
```

**Critères d'acceptation**
- [ ] Tous les états définis
- [ ] Transitions documentées
- [ ] Type exporté

---

### 6.3 Implémenter la transition IDLE → LOADING
**Priorité** : P0 (Critique)

**Description**
Quand l'utilisateur démarre une partie, charger la première chanson.

**Implémentation**
```typescript
// Dans la page /game
useEffect(() => {
  if (state.status === 'idle') {
    game.actions.startGame()
    loadRandomSong()
  }
}, [])

async function loadRandomSong() {
  const exclude = state.playedSongIds.join(',')
  const res = await fetch(`/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`)
  const data = await res.json()

  if (data.song) {
    game.actions.loadSong(data.song)
  } else {
    // Plus de chansons disponibles
    game.actions.quit()
  }
}
```

**Critères d'acceptation**
- [ ] Démarrage automatique au chargement de la page
- [ ] Chanson chargée depuis l'API
- [ ] Gestion du cas "plus de chansons"

---

### 6.4 Implémenter la transition LOADING → PLAYING
**Priorité** : P0 (Critique)

**Description**
Une fois la chanson chargée et l'audio prêt, démarrer la lecture.

**Implémentation**
```typescript
// Dans AudioPlayer
const handleCanPlay = () => {
  setIsLoaded(true)
  // Notifier que le chargement est terminé
  onReady?.()
}

// Dans la page
useEffect(() => {
  if (state.status === 'loading' && state.currentSong && audioReady) {
    game.actions.play()
  }
}, [state.status, state.currentSong, audioReady])
```

**Critères d'acceptation**
- [ ] Transition automatique quand audio prêt
- [ ] Lecture démarre immédiatement

---

### 6.5 Implémenter la transition PLAYING → BUZZED
**Priorité** : P0 (Critique)

**Description**
Réagir au clic sur le buzzer.

**Implémentation**
```typescript
// Dans le hook
case 'BUZZ':
  if (state.status !== 'playing') return state // Ignorer si pas en lecture
  return {
    ...state,
    status: 'timer',
    timerRemaining: config.timerDuration,
  }
```

**Critères d'acceptation**
- [ ] Buzz ignoré si pas en état PLAYING
- [ ] Transition immédiate vers TIMER
- [ ] Audio pausé

---

### 6.6 Implémenter la transition BUZZED → TIMER
**Priorité** : P0 (Critique)

**Description**
L'état BUZZED est transitoire, passe immédiatement à TIMER.

**Note** : Dans l'implémentation actuelle, BUZZ va directement à TIMER. L'état BUZZED peut être utilisé pour une animation intermédiaire si nécessaire.

**Critères d'acceptation**
- [ ] Timer démarre immédiatement après buzz
- [ ] Countdown visible

---

### 6.7 Implémenter la fin du timer
**Priorité** : P0 (Critique)

**Description**
Quand le timer atteint 0 ou qu'une validation arrive.

**Cas de fin**
1. **Timeout** : Timer à 0 → REVEAL (réponse incorrecte implicite)
2. **Validation correcte** : → REVEAL avec +1 point
3. **Validation incorrecte** : → REVEAL sans point

**Implémentation**
```typescript
case 'TICK_TIMER':
  const newRemaining = state.timerRemaining - 1
  if (newRemaining <= 0) {
    // Timeout = pas de points
    return {
      ...state,
      status: 'reveal',
      timerRemaining: 0,
      isRevealed: true,
      songsPlayed: state.songsPlayed + 1,
      playedSongIds: state.currentSong
        ? [...state.playedSongIds, state.currentSong.id]
        : state.playedSongIds,
    }
  }
  return { ...state, timerRemaining: newRemaining }
```

**Critères d'acceptation**
- [ ] Timeout déclenche REVEAL
- [ ] Timer s'arrête
- [ ] Stats mises à jour

---

### 6.8 Implémenter la validation de réponse
**Priorité** : P0 (Critique)

**Description**
Gérer les boutons "Correct" et "Incorrect" du MJ.

**Implémentation**
```typescript
case 'VALIDATE':
  return {
    ...state,
    status: 'reveal',
    isRevealed: true,
    score: action.correct ? state.score + 1 : state.score,
    songsPlayed: state.songsPlayed + 1,
    playedSongIds: state.currentSong
      ? [...state.playedSongIds, state.currentSong.id]
      : state.playedSongIds,
  }
```

**Critères d'acceptation**
- [ ] Score incrémenté si correct
- [ ] Pas d'incrément si incorrect
- [ ] Chanson ajoutée aux jouées

---

### 6.9 Implémenter la transition vers REVEAL
**Priorité** : P0 (Critique)

**Description**
L'état REVEAL affiche la réponse (titre, artiste, pochette nette).

**Implémentation**
```typescript
case 'REVEAL':
  return {
    ...state,
    status: 'reveal',
    isRevealed: true,
    // Compter la chanson si pas déjà comptée
    songsPlayed: state.status !== 'reveal' ? state.songsPlayed + 1 : state.songsPlayed,
  }
```

**Critères d'acceptation**
- [ ] isRevealed = true
- [ ] Pochette nette
- [ ] Infos affichées

---

### 6.10 Implémenter la transition REVEAL → LOADING
**Priorité** : P0 (Critique)

**Description**
Quand on clique "Chanson suivante", charger une nouvelle chanson.

**Implémentation**
```typescript
case 'NEXT_SONG':
  return {
    ...state,
    status: 'loading',
    currentSong: null,
    isRevealed: false,
    timerRemaining: config.timerDuration,
  }
```

```typescript
// Dans la page
useEffect(() => {
  if (state.status === 'loading' && !state.currentSong) {
    loadRandomSong()
  }
}, [state.status, state.currentSong])
```

**Critères d'acceptation**
- [ ] Nouvelle chanson chargée
- [ ] État réinitialisé pour la nouvelle manche

---

### 6.11 Gérer la liste des chansons déjà jouées
**Priorité** : P0 (Critique)

**Description**
Éviter de jouer la même chanson deux fois dans une session.

**Implémentation**
- Stocker les IDs dans `state.playedSongIds`
- Passer à l'API dans le paramètre `exclude`

```typescript
async function loadRandomSong() {
  const exclude = state.playedSongIds.join(',')
  const url = `/api/songs/random${exclude ? `?exclude=${exclude}` : ''}`
  // ...
}
```

**Critères d'acceptation**
- [ ] Pas de répétition dans une session
- [ ] Liste mise à jour après chaque chanson
- [ ] Paramètre exclude envoyé à l'API

---

### 6.12 Détecter la fin de la bibliothèque
**Priorité** : P1 (Important)

**Description**
Quand toutes les chansons ont été jouées, informer l'utilisateur.

**Implémentation**
```typescript
async function loadRandomSong() {
  const res = await fetch(...)
  if (!res.ok) {
    if (res.status === 404) {
      // Plus de chansons
      setAllSongsPlayed(true)
      game.actions.quit()
    }
    return
  }
  // ...
}
```

**UI**
```tsx
{allSongsPlayed && (
  <div className="text-center p-6">
    <h2 className="text-2xl font-bold">Félicitations !</h2>
    <p>Vous avez écouté toute la bibliothèque !</p>
  </div>
)}
```

**Critères d'acceptation**
- [ ] Détection quand plus de chansons
- [ ] Message à l'utilisateur
- [ ] Option de rejouer depuis le début

---

### 6.13 Créer le hook useAudioPlayer
**Priorité** : P0 (Critique)

**Description**
Hook dédié à la gestion du lecteur audio.

**Fichier** : `src/hooks/useAudioPlayer.ts`

**Implémentation**
```typescript
'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface UseAudioPlayerOptions {
  maxDuration: number
  onEnded?: () => void
  onReady?: () => void
}

export function useAudioPlayer({ maxDuration, onEnded, onReady }: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Créer l'élément audio
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('canplay', handleCanPlay)
    audioRef.current.addEventListener('ended', handleEnded)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('canplay', handleCanPlay)
        audioRef.current.removeEventListener('ended', handleEnded)
      }
    }
  }, [])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      if (time >= maxDuration) {
        audioRef.current.pause()
        onEnded?.()
      }
    }
  }

  const handleCanPlay = () => {
    setIsLoaded(true)
    onReady?.()
  }

  const handleEnded = () => {
    onEnded?.()
  }

  const loadSong = useCallback((songId: string) => {
    if (audioRef.current) {
      setIsLoaded(false)
      setCurrentTime(0)
      audioRef.current.src = `/api/audio/${songId}`
      audioRef.current.load()
    }
  }, [])

  const play = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  return {
    isPlaying,
    currentTime,
    isLoaded,
    loadSong,
    play,
    pause,
    toggle,
    progress: (currentTime / maxDuration) * 100,
  }
}
```

**Critères d'acceptation**
- [ ] Chargement des chansons
- [ ] Play/pause/toggle
- [ ] Progress tracking
- [ ] Callbacks onEnded et onReady

---

### 6.14 Gérer le preloading de la chanson suivante
**Priorité** : P2 (Nice-to-have)

**Description**
Précharger la prochaine chanson pendant qu'on est en état REVEAL pour éviter les temps de chargement.

**Implémentation**
```typescript
const [nextSong, setNextSong] = useState<Song | null>(null)

// Pendant REVEAL, précharger la suivante
useEffect(() => {
  if (state.status === 'reveal' && !nextSong) {
    prefetchNextSong()
  }
}, [state.status])

async function prefetchNextSong() {
  const exclude = [...state.playedSongIds, state.currentSong?.id].filter(Boolean).join(',')
  const res = await fetch(`/api/songs/random?exclude=${exclude}`)
  const data = await res.json()
  if (data.song) {
    setNextSong(data.song)
    // Optionnel : précharger l'audio
    const audio = new Audio(`/api/audio/${data.song.id}`)
    audio.preload = 'auto'
  }
}
```

**Critères d'acceptation**
- [ ] Chanson suivante préchargée
- [ ] Transition instantanée
- [ ] Pas de doublon

---

### 6.15 Ajouter un mode "rejouer la même chanson"
**Priorité** : P2 (Nice-to-have)

**Description**
Option pour réécouter l'extrait actuel (ex: si personne n'a trouvé).

**Implémentation**
```typescript
const replay = useCallback(() => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0
    audioRef.current.play()
  }
  dispatch({ type: 'PLAY' })
}, [])
```

**UI**
```tsx
<button onClick={replay}>Rejouer l'extrait</button>
```

**Critères d'acceptation**
- [ ] Audio repart du début
- [ ] Timer pas réinitialisé
- [ ] Visible en état approprié

---

## Checklist de l'Epic

- [ ] 6.1 Hook useGameState créé
- [ ] 6.2 États définis
- [ ] 6.3 IDLE → LOADING
- [ ] 6.4 LOADING → PLAYING
- [ ] 6.5 PLAYING → BUZZED
- [ ] 6.6 BUZZED → TIMER
- [ ] 6.7 Fin du timer
- [ ] 6.8 Validation
- [ ] 6.9 Transition REVEAL
- [ ] 6.10 REVEAL → LOADING
- [ ] 6.11 Liste des jouées
- [ ] 6.12 Fin de bibliothèque
- [ ] 6.13 Hook useAudioPlayer
- [ ] 6.14 Preloading
- [ ] 6.15 Replay

## Estimation
~4-5 heures de travail
