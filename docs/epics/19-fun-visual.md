# Epic 19: Fun & Visual

Ajouter des fonctionnalités visuelles fun : visualizer audio, streak bonus, et podium animé.

---

## 19.1 Créer le visualizer audio décoratif

**Description**: Ajouter des barres animées en fond derrière la pochette qui bougent de manière décorative pendant la lecture.

**Acceptance Criteria**:

- [ ] Composant `AudioVisualizer` créé
- [ ] 8-12 barres verticales avec hauteurs animées
- [ ] Animation décorative (pas d'analyse fréquentielle réelle)
- [ ] Synchronisé avec l'état de lecture (pause = barres statiques)
- [ ] Opacité faible pour ne pas distraire (10-20%)
- [ ] Positionné en background derrière la pochette
- [ ] `prefers-reduced-motion` respecté (barres statiques)
- [ ] Fonctionne en mode solo et multiplayer

**Files**:

- `src/components/game/AudioVisualizer.tsx` (créer)
- `src/components/game/SongReveal.tsx` (modifier)

**Implementation Notes**:

```tsx
// AudioVisualizer.tsx
interface AudioVisualizerProps {
  isPlaying: boolean
}

export function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const shouldReduceMotion = useReducedMotion()
  const bars = 10

  return (
    <div className="absolute inset-0 flex items-end justify-center gap-1 opacity-15 pointer-events-none">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
          animate={
            isPlaying && !shouldReduceMotion
              ? {
                  height: [
                    `${20 + Math.random() * 30}%`,
                    `${40 + Math.random() * 40}%`,
                    `${20 + Math.random() * 30}%`,
                  ],
                }
              : { height: '20%' }
          }
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )
}
```

```tsx
// Dans SongReveal.tsx
<div className="relative">
  <AudioVisualizer isPlaying={isPlaying} />
  <div className="relative z-10">{/* Contenu existant de la pochette */}</div>
</div>
```

---

## 19.2 Implémenter le streak bonus avec animation

**Description**: Déclencher une animation spéciale après 3 bonnes réponses consécutives.

**Acceptance Criteria**:

- [ ] Hook `useStreak` créé pour tracker les bonnes réponses consécutives
- [ ] Streak déclenché à 3 bonnes réponses
- [ ] Pas de compteur visible (effet surprise)
- [ ] Animation : confetti spécial (couleurs différentes du correct normal)
- [ ] Son spécial différent du son "correct" normal
- [ ] Reset du streak sur mauvaise réponse OU skip (reveal sans réponse)
- [ ] Fonctionne en solo et multiplayer
- [ ] `prefers-reduced-motion` : juste le son, pas de confetti

**Files**:

- `src/hooks/useStreak.ts` (créer)
- `src/components/game/StreakCelebration.tsx` (créer)
- `src/hooks/useGameState.ts` (modifier)
- `src/hooks/useMultiplayerGame.ts` (modifier)
- `public/sounds/streak.mp3` (ajouter)

**Implementation Notes**:

```tsx
// useStreak.ts
interface UseStreakOptions {
  threshold?: number // Défaut: 3
  onStreak?: () => void
}

export function useStreak({ threshold = 3, onStreak }: UseStreakOptions = {}) {
  const [count, setCount] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  const recordCorrect = useCallback(() => {
    setCount((prev) => {
      const newCount = prev + 1
      if (newCount >= threshold && newCount % threshold === 0) {
        setShowCelebration(true)
        onStreak?.()
        setTimeout(() => setShowCelebration(false), 2000)
      }
      return newCount
    })
  }, [threshold, onStreak])

  const recordIncorrect = useCallback(() => {
    setCount(0)
  }, [])

  const reset = useCallback(() => {
    setCount(0)
    setShowCelebration(false)
  }, [])

  return {
    count,
    showCelebration,
    recordCorrect,
    recordIncorrect,
    reset,
  }
}
```

```tsx
// StreakCelebration.tsx
export function StreakCelebration({ show }: { show: boolean }) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (show) {
      // Play streak sound
      const audio = new Audio('/sounds/streak.mp3')
      audio.play().catch(() => {})
    }
  }, [show])

  if (!show || shouldReduceMotion) return null

  // Confetti avec couleurs dorées/arc-en-ciel pour le streak
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Texte STREAK! au centre */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg">
          STREAK!
        </span>
      </motion.div>

      {/* Confetti doré */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1 }}
          animate={{ y: '110vh', opacity: 0 }}
          transition={{ duration: 2, delay: p.delay }}
          style={{ backgroundColor: p.color }}
          className="absolute w-3 h-3 rounded-full"
        />
      ))}
    </div>
  )
}
```

---

## 19.3 Créer le podium animé de fin de partie

**Description**: Afficher un podium animé après le recap de fin de partie multiplayer.

**Acceptance Criteria**:

- [ ] Composant `AnimatedPodium` créé
- [ ] Affichage automatique 2-3 secondes après le recap
- [ ] Top 3 joueurs sur le podium
- [ ] Liste des autres joueurs en dessous
- [ ] Animation : podium monte progressivement (3ème → 2ème → 1er)
- [ ] Avatars des joueurs affichés sur le podium
- [ ] Médailles (🥇🥈🥉) sur les positions
- [ ] Confetti en fond pendant l'animation
- [ ] `prefers-reduced-motion` : affichage direct sans animation

**Files**:

- `src/components/multiplayer/AnimatedPodium.tsx` (créer)
- `src/components/multiplayer/MultiplayerRecap.tsx` (modifier)

**Implementation Notes**:

```tsx
// AnimatedPodium.tsx
interface AnimatedPodiumProps {
  players: Player[]
}

export function AnimatedPodium({ players }: AnimatedPodiumProps) {
  const shouldReduceMotion = useReducedMotion()
  const [stage, setStage] = useState<
    'hidden' | 'third' | 'second' | 'first' | 'complete'
  >('hidden')

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const top3 = sortedPlayers.slice(0, 3)
  const others = sortedPlayers.slice(3)

  useEffect(() => {
    if (shouldReduceMotion) {
      setStage('complete')
      return
    }

    const timers = [
      setTimeout(() => setStage('third'), 500),
      setTimeout(() => setStage('second'), 1200),
      setTimeout(() => setStage('first'), 1900),
      setTimeout(() => setStage('complete'), 2600),
    ]

    return () => timers.forEach(clearTimeout)
  }, [shouldReduceMotion])

  const podiumHeights = ['h-32', 'h-24', 'h-20'] // 1st, 2nd, 3rd
  const podiumOrder = [1, 0, 2] // Affichage: 2nd, 1st, 3rd
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((position) => {
          const player = top3[position]
          if (!player) return null

          const isVisible =
            stage === 'complete' ||
            (position === 2 && stage !== 'hidden') ||
            (position === 1 &&
              (stage === 'second' ||
                stage === 'first' ||
                stage === 'complete')) ||
            (position === 0 && (stage === 'first' || stage === 'complete'))

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="flex flex-col items-center"
            >
              {/* Joueur */}
              <div className="flex flex-col items-center mb-2">
                <span className="text-3xl mb-1">{medals[position]}</span>
                <PlayerAvatar
                  avatar={player.avatar}
                  nickname={player.nickname}
                  size="lg"
                />
                <span className="font-semibold mt-1">{player.nickname}</span>
                <span className="text-purple-300 text-sm">
                  {player.score} pts
                </span>
              </div>

              {/* Socle du podium */}
              <motion.div
                initial={{ height: 0 }}
                animate={isVisible ? { height: 'auto' } : { height: 0 }}
                className={cn(
                  'w-24 bg-gradient-to-t from-purple-600 to-purple-500 rounded-t-lg',
                  podiumHeights[position]
                )}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Autres joueurs */}
      {others.length > 0 && stage === 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 w-full max-w-md"
        >
          <h4 className="text-sm text-purple-300 mb-2">Autres participants</h4>
          <div className="space-y-2">
            {others.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className="text-purple-400 w-6">#{index + 4}</span>
                <PlayerAvatar
                  avatar={player.avatar}
                  nickname={player.nickname}
                  size="sm"
                />
                <span className="flex-1">{player.nickname}</span>
                <span className="text-purple-300">{player.score} pts</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confetti */}
      {stage !== 'hidden' && !shouldReduceMotion && <ConfettiEffect />}
    </div>
  )
}
```

```tsx
// Dans MultiplayerRecap.tsx
const [showPodium, setShowPodium] = useState(false)

useEffect(() => {
  // Afficher le podium après 2-3s
  const timer = setTimeout(() => setShowPodium(true), 2500)
  return () => clearTimeout(timer)
}, [])

return (
  <div>
    {!showPodium ? (
      <div>{/* Recap classique existant */}</div>
    ) : (
      <AnimatedPodium players={players} />
    )}
  </div>
)
```
