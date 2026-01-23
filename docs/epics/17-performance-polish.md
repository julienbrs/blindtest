# Epic 17: Performance & Polish

Améliorer les performances et le polish visuel de l'application avec transitions, micro-interactions, skeletons et Service Worker.

---

## 17.1 Ajouter les transitions de page avec Framer Motion

**Description**: Ajouter des transitions fade simples entre toutes les pages de l'application.

**Acceptance Criteria**:

- [ ] Composant `PageTransition` créé avec AnimatePresence
- [ ] Toutes les pages wrappées avec le composant de transition
- [ ] Transition fade avec durée 200-300ms
- [ ] `prefers-reduced-motion` respecté (pas d'animation si activé)
- [ ] Pas de flash blanc entre les pages
- [ ] Navigation fluide sans blocage

**Files**:

- `src/components/ui/PageTransition.tsx` (créer)
- `src/app/layout.tsx` (modifier)
- `src/app/page.tsx`
- `src/app/play/page.tsx`
- `src/app/solo/page.tsx`
- `src/app/game/page.tsx`
- `src/app/multiplayer/page.tsx`
- `src/app/multiplayer/[code]/page.tsx`

**Implementation Notes**:

```tsx
// PageTransition.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## 17.2 Ajouter les micro-interactions bounce sur boutons de jeu

**Description**: Ajouter un effet bounce au tap/click sur les boutons de jeu pour un feedback tactile amélioré.

**Acceptance Criteria**:

- [ ] Effet bounce sur le BuzzerButton
- [ ] Effet bounce sur les boutons Correct/Incorrect
- [ ] Effet bounce sur le bouton "Je sais!"
- [ ] Effet bounce sur le bouton "Suivant"
- [ ] Animation: scale 0.95 → 1.05 → 1 avec spring physics
- [ ] `prefers-reduced-motion` respecté
- [ ] Pas d'effet sur les boutons de navigation standard

**Files**:

- `src/components/game/BuzzerButton.tsx`
- `src/components/game/GameControls.tsx`
- `src/components/multiplayer/HostControls.tsx`

**Implementation Notes**:

```tsx
// Utiliser whileTap de Framer Motion
const bounceAnimation = {
  scale: [1, 0.95, 1.05, 1],
  transition: {
    duration: 0.3,
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
}

;<motion.button whileTap={shouldReduceMotion ? {} : bounceAnimation}>
  ...
</motion.button>
```

---

## 17.3 Créer les skeleton loaders glass-morphism

**Description**: Créer des placeholders animés pour tous les écrans de chargement, avec un style glass-morphism cohérent.

**Acceptance Criteria**:

- [ ] Composant `Skeleton` de base créé
- [ ] `SongSkeleton` pour le chargement de la pochette et infos
- [ ] `PlayerListSkeleton` pour la liste des joueurs dans le lobby
- [ ] `LeaderboardSkeleton` pour le leaderboard en jeu
- [ ] Style glass-morphism (backdrop-blur + bg-white/10)
- [ ] Animation pulse ou shimmer subtil
- [ ] Intégration dans les composants existants
- [ ] `prefers-reduced-motion` respecté (animation désactivée)

**Files**:

- `src/components/ui/Skeleton.tsx` (créer)
- `src/components/ui/SongSkeleton.tsx` (créer)
- `src/components/ui/PlayerListSkeleton.tsx` (créer)
- `src/components/ui/LeaderboardSkeleton.tsx` (créer)
- `src/components/game/SongReveal.tsx` (modifier)
- `src/components/multiplayer/Lobby.tsx` (modifier)
- `src/components/multiplayer/Leaderboard.tsx` (modifier)

**Implementation Notes**:

```tsx
// Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/10 backdrop-blur-sm',
        className
      )}
    />
  )
}

// SongSkeleton.tsx
export function SongSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-xl" />
      <Skeleton className="w-32 h-6" />
      <Skeleton className="w-24 h-4" />
    </div>
  )
}
```

---

## 17.4 Implémenter le Service Worker pour caching

**Description**: Créer un Service Worker pour cacher l'app shell, les assets statiques et les sons d'effets.

**Acceptance Criteria**:

- [ ] Service Worker créé dans `public/sw.js`
- [ ] Helper de registration créé dans `src/lib/serviceWorker.ts`
- [ ] Service Worker enregistré au chargement de l'app
- [ ] Cache de l'app shell (HTML, CSS, JS)
- [ ] Cache des fonts
- [ ] Cache des sons SFX (`/sounds/*`)
- [ ] Stratégie Cache-first pour assets statiques
- [ ] Stratégie Network-first pour les appels API
- [ ] Gestion des mises à jour du SW

**Files**:

- `public/sw.js` (créer)
- `src/lib/serviceWorker.ts` (créer)
- `src/app/layout.tsx` (modifier)

**Implementation Notes**:

```javascript
// public/sw.js
const CACHE_NAME = 'blindtest-v1'
const STATIC_ASSETS = [
  '/',
  '/play',
  '/sounds/buzz.mp3',
  '/sounds/correct.mp3',
  '/sounds/incorrect.mp3',
  '/sounds/tick.mp3',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-first pour les API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first pour les assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})
```

---

## 17.5 Ajouter le pre-loading audio intelligent

**Description**: Pendant qu'une chanson joue, pre-loader la chanson suivante pour éliminer le temps de chargement.

**Acceptance Criteria**:

- [ ] Hook `useAudioPreloader` créé
- [ ] Pre-load de la prochaine chanson pendant la lecture courante
- [ ] Cache mémoire pour l'audio preloadé (pas Service Worker)
- [ ] Intégration avec `useGameState` (solo)
- [ ] Intégration avec `useMultiplayerGame` (multiplayer)
- [ ] Gestion de la mémoire (libérer l'ancien preload)
- [ ] Pas de pre-load si dernière chanson

**Files**:

- `src/hooks/useAudioPreloader.ts` (créer)
- `src/hooks/useGameState.ts` (modifier)
- `src/hooks/useMultiplayerGame.ts` (modifier)

**Implementation Notes**:

```tsx
// useAudioPreloader.ts
export function useAudioPreloader() {
  const preloadedAudioRef = useRef<{
    id: string
    audio: HTMLAudioElement
  } | null>(null)

  const preloadNext = useCallback(async (excludeIds: string[]) => {
    const response = await fetch(
      `/api/songs/random?exclude=${excludeIds.join(',')}`
    )
    const song = await response.json()

    if (song) {
      const audio = new Audio(`/api/audio/${song.id}`)
      audio.preload = 'auto'
      preloadedAudioRef.current = { id: song.id, audio }
    }
  }, [])

  const getPreloaded = useCallback(() => {
    return preloadedAudioRef.current
  }, [])

  return { preloadNext, getPreloaded }
}
```
