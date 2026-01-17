# Epic 8 : Audio et effets sonores

## Objectif
Ajouter des effets sonores pour enrichir l'expérience de jeu : son de buzzer, jingles de victoire/défaite, tick-tock du timer.

## Dépendances
- Epic 5-6 terminés (jeu fonctionnel)
- Fichiers audio d'effets sonores

---

## Ressources audio suggérées

**Sources gratuites**
- [Freesound.org](https://freesound.org) - Effets sous licence Creative Commons
- [Mixkit](https://mixkit.co/free-sound-effects/) - Effets gratuits
- [Zapsplat](https://www.zapsplat.com) - Grande bibliothèque gratuite

**Fichiers à préparer**
```
public/sounds/
├── buzz.mp3        # Son de buzzer (~0.5s)
├── correct.mp3     # Jingle victoire (~1s)
├── incorrect.mp3   # Son d'erreur (~0.5s)
├── timeout.mp3     # Alerte fin de timer (~0.5s)
├── tick.mp3        # Tick pour le timer (~0.1s)
└── reveal.mp3      # Son de révélation (optionnel)
```

---

## Issues

### 8.1 Ajouter un son de buzzer
**Priorité** : P1 (Important)

**Description**
Jouer un son satisfaisant quand quelqu'un appuie sur le buzzer.

**Caractéristiques du son**
- Court (~0.5 seconde)
- Impactant mais pas agressif
- Style "game show" ou "buzzer électronique"

**Implémentation**
```typescript
// Dans BuzzerButton.tsx
const buzzSound = useRef<HTMLAudioElement | null>(null)

useEffect(() => {
  buzzSound.current = new Audio('/sounds/buzz.mp3')
  buzzSound.current.volume = 0.7
}, [])

const handleClick = () => {
  buzzSound.current?.play()
  // Vibration + callback
}
```

**Critères d'acceptation**
- [ ] Son joué immédiatement au clic
- [ ] Pas de latence perceptible
- [ ] Volume approprié

---

### 8.2 Ajouter un son de bonne réponse
**Priorité** : P1 (Important)

**Description**
Jingle de victoire quand le MJ valide une bonne réponse.

**Caractéristiques du son**
- Joyeux et célébratoire
- ~1-2 secondes
- Style "ding ding" ou fanfare courte

**Implémentation**
```typescript
function playCorrectSound() {
  const audio = new Audio('/sounds/correct.mp3')
  audio.volume = 0.6
  audio.play()
}

// Appelé dans le reducer ou l'action validate(true)
```

**Critères d'acceptation**
- [ ] Son joué après validation positive
- [ ] Synchronisé avec les confettis
- [ ] Durée appropriée

---

### 8.3 Ajouter un son de mauvaise réponse
**Priorité** : P1 (Important)

**Description**
Son d'erreur quand la réponse est incorrecte.

**Caractéristiques du son**
- Court et clair
- Pas trop négatif/frustrant
- Style "buzzer négatif" ou "whomp"

**Implémentation**
```typescript
function playIncorrectSound() {
  const audio = new Audio('/sounds/incorrect.mp3')
  audio.volume = 0.5
  audio.play()
}
```

**Critères d'acceptation**
- [ ] Son joué après validation négative
- [ ] Pas trop punitif
- [ ] Synchronisé avec l'animation shake

---

### 8.4 Ajouter un son de fin de timer
**Priorité** : P1 (Important)

**Description**
Alerte sonore quand le temps est écoulé (timeout).

**Caractéristiques du son**
- Court et distinctif
- Indique clairement que le temps est fini
- Style "buzzer de fin" ou "gong"

**Implémentation**
```typescript
// Dans useGameState, quand timer atteint 0
useEffect(() => {
  if (state.timerRemaining === 0 && state.status === 'timer') {
    const audio = new Audio('/sounds/timeout.mp3')
    audio.play()
  }
}, [state.timerRemaining, state.status])
```

**Critères d'acceptation**
- [ ] Son joué exactement à 0
- [ ] Distinctif des autres sons
- [ ] Indique clairement la fin du temps

---

### 8.5 Ajouter un tick-tock pour le timer
**Priorité** : P2 (Nice-to-have)

**Description**
Son de tick à chaque seconde du countdown pour augmenter la tension.

**Caractéristiques du son**
- Très court (~100ms)
- Subtil mais audible
- Peut accélérer ou s'intensifier vers la fin

**Implémentation**
```typescript
const tickSound = useRef<HTMLAudioElement | null>(null)

useEffect(() => {
  tickSound.current = new Audio('/sounds/tick.mp3')
  tickSound.current.volume = 0.3
}, [])

useEffect(() => {
  if (state.status === 'timer' && state.timerRemaining > 0) {
    tickSound.current?.play()
  }
}, [state.timerRemaining])
```

**Option : intensification**
```typescript
// Volume qui augmente vers la fin
const volume = 0.2 + (5 - state.timerRemaining) * 0.1
tickSound.current.volume = Math.min(volume, 0.7)
```

**Critères d'acceptation**
- [ ] Tick à chaque seconde
- [ ] Volume approprié (pas gênant)
- [ ] Optionnel : intensification

---

### 8.6 Créer un hook useSoundEffects
**Priorité** : P1 (Important)

**Description**
Hook centralisé pour gérer tous les effets sonores.

**Fichier** : `src/hooks/useSoundEffects.ts`

**Implémentation**
```typescript
'use client'

import { useRef, useCallback, useEffect } from 'react'

interface SoundEffects {
  buzz: () => void
  correct: () => void
  incorrect: () => void
  timeout: () => void
  tick: () => void
  reveal: () => void
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
}

export function useSoundEffects(): SoundEffects {
  const sounds = useRef<Record<string, HTMLAudioElement>>({})
  const isMuted = useRef(false)
  const volume = useRef(0.7)

  // Précharger les sons
  useEffect(() => {
    const soundFiles = {
      buzz: '/sounds/buzz.mp3',
      correct: '/sounds/correct.mp3',
      incorrect: '/sounds/incorrect.mp3',
      timeout: '/sounds/timeout.mp3',
      tick: '/sounds/tick.mp3',
      reveal: '/sounds/reveal.mp3',
    }

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      sounds.current[name] = audio
    })

    return () => {
      Object.values(sounds.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  const playSound = useCallback((name: string) => {
    if (isMuted.current) return

    const audio = sounds.current[name]
    if (audio) {
      audio.volume = volume.current
      audio.currentTime = 0
      audio.play().catch(() => {
        // Ignorer les erreurs d'autoplay
      })
    }
  }, [])

  return {
    buzz: useCallback(() => playSound('buzz'), [playSound]),
    correct: useCallback(() => playSound('correct'), [playSound]),
    incorrect: useCallback(() => playSound('incorrect'), [playSound]),
    timeout: useCallback(() => playSound('timeout'), [playSound]),
    tick: useCallback(() => playSound('tick'), [playSound]),
    reveal: useCallback(() => playSound('reveal'), [playSound]),
    setMuted: useCallback((muted: boolean) => {
      isMuted.current = muted
    }, []),
    setVolume: useCallback((v: number) => {
      volume.current = Math.max(0, Math.min(1, v))
    }, []),
  }
}
```

**Usage**
```tsx
function GamePage() {
  const sfx = useSoundEffects()

  const handleBuzz = () => {
    sfx.buzz()
    game.actions.buzz()
  }

  const handleValidate = (correct: boolean) => {
    if (correct) sfx.correct()
    else sfx.incorrect()
    game.actions.validate(correct)
  }

  return (...)
}
```

**Critères d'acceptation**
- [ ] Tous les sons accessibles
- [ ] Préchargement au montage
- [ ] Mute et volume fonctionnels
- [ ] Gestion des erreurs autoplay

---

### 8.7 Ajouter une option mute effets sonores
**Priorité** : P2 (Nice-to-have)

**Description**
Toggle pour désactiver les effets sonores sans couper la musique.

**Implémentation**
```tsx
// Dans les paramètres ou en header de jeu
const [sfxMuted, setSfxMuted] = useState(false)

useEffect(() => {
  sfx.setMuted(sfxMuted)
}, [sfxMuted])

<button onClick={() => setSfxMuted(!sfxMuted)}>
  {sfxMuted ? <VolumeOffIcon /> : <VolumeIcon />}
  Effets sonores
</button>
```

**Persistance**
```typescript
// Sauvegarder en localStorage
useEffect(() => {
  localStorage.setItem('sfx_muted', JSON.stringify(sfxMuted))
}, [sfxMuted])

// Charger au montage
useEffect(() => {
  const saved = localStorage.getItem('sfx_muted')
  if (saved) setSfxMuted(JSON.parse(saved))
}, [])
```

**Critères d'acceptation**
- [ ] Toggle visible dans l'UI
- [ ] État persisté en localStorage
- [ ] Musique non affectée

---

### 8.8 Gérer le volume principal
**Priorité** : P1 (Important)

**Description**
Slider pour ajuster le volume de la musique du blindtest.

**Implémentation**
```tsx
const [musicVolume, setMusicVolume] = useState(0.7)

// Appliquer au lecteur audio
useEffect(() => {
  if (audioRef.current) {
    audioRef.current.volume = musicVolume
  }
}, [musicVolume])

// UI
<div className="flex items-center gap-4">
  <VolumeIcon className="w-5 h-5" />
  <input
    type="range"
    min={0}
    max={1}
    step={0.1}
    value={musicVolume}
    onChange={(e) => setMusicVolume(Number(e.target.value))}
    className="w-24"
  />
</div>
```

**Critères d'acceptation**
- [ ] Slider de volume
- [ ] Range 0-100%
- [ ] Appliqué en temps réel
- [ ] Persisté en localStorage

---

## Gestion de l'autoplay

**Problème** : Les navigateurs bloquent l'autoplay des sons sans interaction utilisateur.

**Solution** : Déclencher les sons uniquement après une interaction.

```typescript
const [audioUnlocked, setAudioUnlocked] = useState(false)

// Débloquer l'audio au premier clic
const unlockAudio = useCallback(() => {
  if (audioUnlocked) return

  // Jouer un son silencieux pour débloquer
  const silence = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
  silence.play().then(() => {
    setAudioUnlocked(true)
  }).catch(() => {})
}, [audioUnlocked])

// Attacher au premier clic
<div onClick={unlockAudio}>
```

---

## Checklist de l'Epic

- [ ] 8.1 Son de buzzer
- [ ] 8.2 Son bonne réponse
- [ ] 8.3 Son mauvaise réponse
- [ ] 8.4 Son fin de timer
- [ ] 8.5 Tick-tock timer
- [ ] 8.6 Hook useSoundEffects
- [ ] 8.7 Option mute
- [ ] 8.8 Volume principal

## Estimation
~2-3 heures de travail (+ temps pour trouver les bons sons)
