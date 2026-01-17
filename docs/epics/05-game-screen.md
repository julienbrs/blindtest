# Epic 5 : Frontend - Écran de jeu principal

## Objectif
Créer l'interface de jeu complète : lecteur audio, buzzer, timer, zone de révélation, contrôles du maître de jeu. C'est le coeur de l'expérience utilisateur.

## Dépendances
- Epic 1-4 terminés
- API routes fonctionnelles

---

## Issues

### 5.1 Créer la page /game
**Priorité** : P0 (Critique)

**Description**
Page principale du jeu qui orchestre tous les composants.

**Fichier** : `src/app/game/page.tsx`

**Implémentation**
```tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { AudioPlayer } from '@/components/game/AudioPlayer'
import { BuzzerButton } from '@/components/game/BuzzerButton'
import { Timer } from '@/components/game/Timer'
import { ScoreDisplay } from '@/components/game/ScoreDisplay'
import { SongReveal } from '@/components/game/SongReveal'
import { GameControls } from '@/components/game/GameControls'
import type { GameConfig, GuessMode } from '@/lib/types'

function GameContent() {
  const searchParams = useSearchParams()

  const config: GameConfig = {
    guessMode: (searchParams.get('mode') as GuessMode) || 'both',
    clipDuration: Number(searchParams.get('duration')) || 20,
    timerDuration: 5,
  }

  const game = useGameState(config)

  return (
    <main className="min-h-screen flex flex-col p-4">
      {/* Header avec score */}
      <header className="flex justify-between items-center mb-6">
        <ScoreDisplay score={game.state.score} songsPlayed={game.state.songsPlayed} />
        <button
          onClick={game.actions.quit}
          className="text-purple-300 hover:text-white"
        >
          Quitter
        </button>
      </header>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Pochette / Révélation */}
        <SongReveal
          song={game.state.currentSong}
          isRevealed={game.state.isRevealed}
          guessMode={config.guessMode}
        />

        {/* Lecteur audio */}
        <AudioPlayer
          songId={game.state.currentSong?.id}
          isPlaying={game.state.status === 'playing'}
          maxDuration={config.clipDuration}
          onEnded={game.actions.clipEnded}
        />

        {/* Buzzer */}
        {game.state.status === 'playing' && (
          <BuzzerButton onBuzz={game.actions.buzz} />
        )}

        {/* Timer */}
        {game.state.status === 'timer' && (
          <Timer
            duration={config.timerDuration}
            remaining={game.state.timerRemaining}
          />
        )}
      </div>

      {/* Contrôles du MJ */}
      <GameControls
        status={game.state.status}
        onValidate={game.actions.validate}
        onReveal={game.actions.reveal}
        onNext={game.actions.nextSong}
        onPlay={game.actions.play}
        onPause={game.actions.pause}
      />
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <GameContent />
    </Suspense>
  )
}
```

**Critères d'acceptation**
- [ ] Page accessible à /game
- [ ] Paramètres récupérés depuis URL
- [ ] Tous les composants intégrés
- [ ] Layout responsive

---

### 5.2 Implémenter le layout de jeu
**Priorité** : P0 (Critique)

**Description**
Organiser les zones de l'écran de jeu de manière claire et ergonomique.

**Layout Mobile (portrait)**
```
┌──────────────────────┐
│ Score      [Quitter] │  <- Header
├──────────────────────┤
│                      │
│     [Pochette]       │  <- Zone centrale
│                      │
│   ═══════════════    │  <- Barre audio
│                      │
│     [BUZZER]         │  <- Buzzer / Timer
│                      │
├──────────────────────┤
│ [Play] [Reveal] [OK] │  <- Contrôles
└──────────────────────┘
```

**Layout Desktop**
```
┌───────────────────────────────────────────────┐
│ Score                               [Quitter] │
├──────────────────────┬────────────────────────┤
│                      │                        │
│     [Pochette]       │    [Contrôles MJ]      │
│     grande           │                        │
│                      │    [BUZZER]            │
│   ═══════════════    │                        │
│                      │    [Timer]             │
│                      │                        │
└──────────────────────┴────────────────────────┘
```

**Critères d'acceptation**
- [ ] Layout mobile fonctionnel
- [ ] Layout desktop optimisé
- [ ] Transitions fluides entre breakpoints

---

### 5.3 Créer le composant AudioPlayer
**Priorité** : P0 (Critique)

**Description**
Lecteur audio HTML5 avec contrôles custom, pas les contrôles natifs du navigateur.

**Fichier** : `src/components/game/AudioPlayer.tsx`

**Implémentation**
```tsx
'use client'

import { useRef, useEffect, useState } from 'react'

interface AudioPlayerProps {
  songId: string | undefined
  isPlaying: boolean
  maxDuration: number
  onEnded: () => void
}

export function AudioPlayer({ songId, isPlaying, maxDuration, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger la chanson
  useEffect(() => {
    if (songId && audioRef.current) {
      audioRef.current.src = `/api/audio/${songId}`
      audioRef.current.load()
      setCurrentTime(0)
      setIsLoaded(false)
    }
  }, [songId])

  // Play/Pause
  useEffect(() => {
    if (!audioRef.current || !isLoaded) return

    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, isLoaded])

  // Limiter la durée
  useEffect(() => {
    if (currentTime >= maxDuration) {
      audioRef.current?.pause()
      onEnded()
    }
  }, [currentTime, maxDuration, onEnded])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleCanPlay = () => {
    setIsLoaded(true)
  }

  const progress = (currentTime / maxDuration) * 100

  return (
    <div className="w-full max-w-md">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onEnded={onEnded}
      />

      {/* Barre de progression */}
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-200"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Temps */}
      <div className="flex justify-between text-sm text-purple-300 mt-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(maxDuration)}</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

**Critères d'acceptation**
- [ ] Audio se charge depuis l'API
- [ ] Play/pause fonctionnel
- [ ] Barre de progression visuelle
- [ ] Arrêt automatique après maxDuration

---

### 5.4 Ajouter les contrôles play/pause
**Priorité** : P0 (Critique)

**Description**
Boutons stylisés pour contrôler la lecture audio, intégrés dans GameControls.

**Implémentation**
```tsx
// Dans GameControls.tsx
<button
  onClick={isPlaying ? onPause : onPlay}
  className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
>
  {isPlaying ? (
    <PauseIcon className="w-8 h-8" />
  ) : (
    <PlayIcon className="w-8 h-8" />
  )}
</button>
```

**Icônes**
```tsx
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}
```

**Critères d'acceptation**
- [ ] Boutons visuellement distincts
- [ ] État play/pause reflété
- [ ] Accessible au clavier

---

### 5.5 Afficher la barre de progression audio
**Priorité** : P1 (Important)

**Description**
Visualiser l'avancement de l'extrait avec une barre de progression animée.

**Déjà inclus dans 5.3**, mais peut être amélioré avec :
- Animation de pulsation
- Changement de couleur proche de la fin
- Indicateur de position cliquable (seeking)

**Critères d'acceptation**
- [ ] Barre se remplit en temps réel
- [ ] Temps affiché en format mm:ss
- [ ] Visuel agréable

---

### 5.6 Limiter la lecture à la durée configurée
**Priorité** : P0 (Critique)

**Description**
L'extrait doit s'arrêter automatiquement après la durée configurée (ex: 20 secondes), même si la chanson est plus longue.

**Déjà implémenté dans 5.3** via :
```tsx
useEffect(() => {
  if (currentTime >= maxDuration) {
    audioRef.current?.pause()
    onEnded()
  }
}, [currentTime, maxDuration, onEnded])
```

**Critères d'acceptation**
- [ ] Arrêt automatique à maxDuration
- [ ] Callback onEnded appelé
- [ ] Pas de dépassement

---

### 5.7 Créer le composant BuzzerButton
**Priorité** : P0 (Critique)

**Description**
Gros bouton central pour buzzer. Doit être très visible et satisfaisant à presser.

**Fichier** : `src/components/game/BuzzerButton.tsx`

**Implémentation**
```tsx
'use client'

interface BuzzerButtonProps {
  onBuzz: () => void
  disabled?: boolean
}

export function BuzzerButton({ onBuzz, disabled = false }: BuzzerButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      // Vibration mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
      onBuzz()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-40 h-40 md:w-48 md:h-48
        rounded-full
        bg-gradient-to-br from-red-500 to-red-700
        shadow-[0_0_60px_rgba(239,68,68,0.5)]
        border-4 border-red-400
        text-white font-bold text-2xl
        transform transition-all duration-150
        hover:scale-105 hover:shadow-[0_0_80px_rgba(239,68,68,0.7)]
        active:scale-95 active:shadow-[0_0_40px_rgba(239,68,68,0.3)]
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-red-400/50
      `}
    >
      BUZZ!
    </button>
  )
}
```

**Design**
- Gros bouton rond rouge
- Effet de glow
- Animation au press (scale down)
- Texte "BUZZ!" ou icône

**Critères d'acceptation**
- [ ] Bouton de grande taille (tactile friendly)
- [ ] Effet visuel au clic
- [ ] Vibration sur mobile
- [ ] Accessible (focus visible)

---

### 5.8 Ajouter l'animation du buzzer
**Priorité** : P1 (Important)

**Description**
Effets visuels supplémentaires quand quelqu'un buzze.

**Effets suggérés**
- Flash de l'écran
- Onde de choc depuis le bouton
- Son de buzzer (voir Epic 8)

**Avec Framer Motion**
```tsx
import { motion } from 'framer-motion'

<motion.button
  whileTap={{ scale: 0.9 }}
  whileHover={{ scale: 1.05 }}
  animate={justBuzzed ? {
    boxShadow: ['0 0 60px rgba(239,68,68,0.5)', '0 0 100px rgba(239,68,68,0.8)', '0 0 60px rgba(239,68,68,0.5)']
  } : {}}
  // ...
>
```

**Critères d'acceptation**
- [ ] Animation fluide
- [ ] Feedback immédiat
- [ ] Pas de lag perceptible

---

### 5.9 Créer le composant Timer
**Priorité** : P0 (Critique)

**Description**
Afficher le countdown de 5 secondes après un buzz.

**Fichier** : `src/components/game/Timer.tsx`

**Implémentation**
```tsx
'use client'

interface TimerProps {
  duration: number
  remaining: number
}

export function Timer({ duration, remaining }: TimerProps) {
  const progress = (remaining / duration) * 100
  const isUrgent = remaining <= 2

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cercle de progression */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          {/* Fond */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/20"
          />
          {/* Progression */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * progress) / 100}
            strokeLinecap="round"
            className={`transition-all duration-200 ${
              isUrgent ? 'text-red-500' : 'text-yellow-400'
            }`}
          />
        </svg>
        {/* Nombre */}
        <div className={`absolute inset-0 flex items-center justify-center text-5xl font-bold ${
          isUrgent ? 'text-red-500 animate-pulse' : 'text-white'
        }`}>
          {remaining}
        </div>
      </div>

      <p className="text-lg text-purple-200">
        Temps pour répondre...
      </p>
    </div>
  )
}
```

**Critères d'acceptation**
- [ ] Countdown visuel de 5 à 0
- [ ] Cercle qui se vide
- [ ] Indicateur d'urgence (rouge, clignotant)

---

### 5.10 Ajouter l'animation du timer
**Priorité** : P1 (Important)

**Description**
Rendre le timer plus dramatique avec des animations.

**Effets**
- Cercle qui se vide progressivement
- Pulsation dans les dernières secondes
- Changement de couleur (vert → jaune → rouge)
- Son tick-tock (voir Epic 8)

**Critères d'acceptation**
- [ ] Animation fluide du cercle
- [ ] Effet d'urgence visible
- [ ] Pas de saccade

---

### 5.11 Créer le composant ScoreDisplay
**Priorité** : P0 (Critique)

**Description**
Afficher le score actuel et le nombre de chansons jouées.

**Fichier** : `src/components/game/ScoreDisplay.tsx`

**Implémentation**
```tsx
interface ScoreDisplayProps {
  score: number
  songsPlayed: number
}

export function ScoreDisplay({ score, songsPlayed }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-white/10 rounded-lg px-4 py-2">
        <div className="text-sm text-purple-300">Score</div>
        <div className="text-2xl font-bold">{score}</div>
      </div>
      <div className="text-purple-300">
        {songsPlayed} chanson{songsPlayed > 1 ? 's' : ''} jouée{songsPlayed > 1 ? 's' : ''}
      </div>
    </div>
  )
}
```

**Critères d'acceptation**
- [ ] Score affiché clairement
- [ ] Nombre de chansons jouées
- [ ] Design intégré au header

---

### 5.12 Créer le composant SongReveal
**Priorité** : P0 (Critique)

**Description**
Zone affichant la pochette (floue ou nette) et les informations de la chanson après révélation.

**Fichier** : `src/components/game/SongReveal.tsx`

**Implémentation**
```tsx
'use client'

import Image from 'next/image'
import type { Song, GuessMode } from '@/lib/types'

interface SongRevealProps {
  song: Song | null
  isRevealed: boolean
  guessMode: GuessMode
}

export function SongReveal({ song, isRevealed, guessMode }: SongRevealProps) {
  if (!song) {
    return (
      <div className="w-64 h-64 bg-white/10 rounded-2xl flex items-center justify-center">
        <p className="text-purple-300">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pochette */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl">
        <Image
          src={`/api/cover/${song.id}`}
          alt="Pochette album"
          fill
          className={`object-cover transition-all duration-500 ${
            isRevealed ? '' : 'blur-xl scale-110'
          }`}
        />
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🎵</span>
          </div>
        )}
      </div>

      {/* Informations */}
      {isRevealed && (
        <div className="text-center animate-fade-in">
          {(guessMode === 'title' || guessMode === 'both') && (
            <h2 className="text-2xl font-bold">{song.title}</h2>
          )}
          {(guessMode === 'artist' || guessMode === 'both') && (
            <p className="text-xl text-purple-200">{song.artist}</p>
          )}
          {song.album && (
            <p className="text-sm text-purple-400 mt-1">{song.album}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

**Critères d'acceptation**
- [ ] Pochette affichée
- [ ] Effet blur quand non révélé
- [ ] Titre/artiste selon le mode
- [ ] Animation de révélation

---

### 5.13 Implémenter le blur de la pochette
**Priorité** : P1 (Important)

**Description**
Flouter la pochette pendant le jeu pour ne pas donner d'indices visuels.

**CSS**
```css
.blur-xl {
  filter: blur(24px);
}
```

**Transition**
```tsx
className={`transition-all duration-500 ${isRevealed ? '' : 'blur-xl scale-110'}`}
```

**Critères d'acceptation**
- [ ] Pochette illisible quand floue
- [ ] Transition fluide vers net
- [ ] Performance OK (pas de lag)

---

### 5.14 Créer les boutons de validation
**Priorité** : P0 (Critique)

**Description**
Boutons pour que le MJ valide (correct) ou invalide (incorrect) la réponse orale.

**Implémentation**
```tsx
// Dans GameControls.tsx
{(status === 'buzzed' || status === 'timer') && (
  <div className="flex gap-4">
    <button
      onClick={() => onValidate(true)}
      className="flex-1 py-4 px-6 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
    >
      <CheckIcon className="w-6 h-6" />
      Correct
    </button>
    <button
      onClick={() => onValidate(false)}
      className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
    >
      <XIcon className="w-6 h-6" />
      Incorrect
    </button>
  </div>
)}
```

**Critères d'acceptation**
- [ ] Bouton vert pour correct
- [ ] Bouton rouge pour incorrect
- [ ] Visibles uniquement après buzz
- [ ] Déclenchent la logique appropriée

---

### 5.15 Créer le bouton "Chanson suivante"
**Priorité** : P0 (Critique)

**Description**
Passer à la chanson suivante, visible après révélation.

**Implémentation**
```tsx
{status === 'reveal' && (
  <button
    onClick={onNext}
    className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-lg"
  >
    Chanson suivante →
  </button>
)}
```

**Critères d'acceptation**
- [ ] Visible uniquement en état REVEAL
- [ ] Charge une nouvelle chanson
- [ ] Design attractif

---

### 5.16 Créer le bouton "Révéler la réponse"
**Priorité** : P0 (Critique)

**Description**
Permettre de révéler la réponse manuellement sans passer par le système de buzz/validation.

**Implémentation**
```tsx
{(status === 'playing' || status === 'buzzed' || status === 'timer') && !isRevealed && (
  <button
    onClick={onReveal}
    className="py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-purple-200"
  >
    Révéler la réponse
  </button>
)}
```

**Critères d'acceptation**
- [ ] Visible pendant le jeu
- [ ] Révèle sans donner de points
- [ ] Permet de passer à la suite

---

### 5.17 Ajouter un bouton "Quitter la partie"
**Priorité** : P1 (Important)

**Description**
Permettre de revenir à l'accueil avec une confirmation.

**Implémentation**
```tsx
const [showQuitConfirm, setShowQuitConfirm] = useState(false)

<button onClick={() => setShowQuitConfirm(true)}>
  Quitter
</button>

{showQuitConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-purple-900 p-6 rounded-xl max-w-sm">
      <h3 className="text-xl font-bold mb-4">Quitter la partie ?</h3>
      <p className="text-purple-200 mb-6">Votre score ne sera pas sauvegardé.</p>
      <div className="flex gap-4">
        <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-2 bg-white/10 rounded-lg">
          Annuler
        </button>
        <button onClick={() => router.push('/')} className="flex-1 py-2 bg-red-600 rounded-lg">
          Quitter
        </button>
      </div>
    </div>
  </div>
)}
```

**Critères d'acceptation**
- [ ] Confirmation avant de quitter
- [ ] Retour à l'accueil
- [ ] Modal stylisé

---

### 5.18 Afficher le numéro de la chanson
**Priorité** : P2 (Nice-to-have)

**Description**
Indiquer quelle chanson on joue (ex: "Chanson 5").

**Déjà inclus dans ScoreDisplay** : `{songsPlayed} chansons jouées`

**Critères d'acceptation**
- [ ] Numéro visible
- [ ] Mise à jour à chaque chanson

---

### 5.19 Créer le récap de fin de partie
**Priorité** : P2 (Nice-to-have)

**Description**
Écran final avec les statistiques de la partie quand on quitte.

**Contenu**
- Score final
- Nombre de bonnes réponses
- Nombre de chansons jouées
- Taux de réussite
- Bouton "Nouvelle partie"

**Critères d'acceptation**
- [ ] Stats complètes affichées
- [ ] Option de rejouer
- [ ] Design festif (confettis si bon score)

---

## Checklist de l'Epic

- [ ] 5.1 Page /game créée
- [ ] 5.2 Layout de jeu implémenté
- [ ] 5.3 AudioPlayer fonctionnel
- [ ] 5.4 Contrôles play/pause
- [ ] 5.5 Barre de progression
- [ ] 5.6 Limite de durée
- [ ] 5.7 BuzzerButton créé
- [ ] 5.8 Animation buzzer
- [ ] 5.9 Timer créé
- [ ] 5.10 Animation timer
- [ ] 5.11 ScoreDisplay créé
- [ ] 5.12 SongReveal créé
- [ ] 5.13 Blur pochette
- [ ] 5.14 Boutons validation
- [ ] 5.15 Bouton chanson suivante
- [ ] 5.16 Bouton révéler
- [ ] 5.17 Bouton quitter
- [ ] 5.18 Numéro de chanson
- [ ] 5.19 Récap fin de partie

## Estimation
~6-8 heures de travail
