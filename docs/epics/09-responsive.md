# Epic 9 : Responsive et mobile

## Objectif
S'assurer que l'application fonctionne parfaitement sur tous les appareils, avec une attention particulière au mobile (usage principal prévu).

## Dépendances
- Epic 4-5 terminés (pages et composants)
- Tailwind configuré

---

## Breakpoints Tailwind

| Préfixe | Largeur min | Appareils typiques |
|---------|-------------|-------------------|
| (base) | 0px | Téléphones portrait |
| `sm` | 640px | Téléphones paysage |
| `md` | 768px | Tablettes portrait |
| `lg` | 1024px | Tablettes paysage, laptops |
| `xl` | 1280px | Desktops |

---

## Issues

### 9.1 Adapter le layout pour mobile
**Priorité** : P0 (Critique)

**Description**
Réorganiser les éléments pour les petits écrans tout en gardant l'ergonomie.

**Principes**
- Éléments empilés verticalement sur mobile
- Disposition en grille/colonnes sur desktop
- Pas de scroll horizontal

**Page d'accueil**
```tsx
// Mobile: tout empilé
// Desktop: config à gauche, aperçu à droite (optionnel)
<main className="flex flex-col lg:flex-row lg:gap-8 p-4 lg:p-8">
  <div className="lg:w-1/2">
    <GameConfigForm />
  </div>
  <div className="lg:w-1/2 hidden lg:block">
    <LibraryPreview />
  </div>
</main>
```

**Écran de jeu**
```tsx
// Mobile: vertical, buzzer en bas
// Desktop: horizontal, contrôles à droite
<main className="flex flex-col lg:flex-row min-h-screen">
  <div className="flex-1 flex flex-col items-center justify-center p-4">
    <SongReveal />
    <AudioPlayer />
  </div>
  <div className="lg:w-80 p-4 lg:border-l border-white/10">
    <BuzzerButton />
    <GameControls />
  </div>
</main>
```

**Critères d'acceptation**
- [ ] Layout fluide de 320px à 1920px
- [ ] Pas de débordement horizontal
- [ ] Tous les éléments accessibles

---

### 9.2 Agrandir les zones tactiles
**Priorité** : P0 (Critique)

**Description**
Les boutons doivent être suffisamment grands pour être touchés avec le doigt (minimum 44x44px recommandé par Apple/Google).

**Tailles minimales**
```tsx
// Bouton principal (buzzer, actions)
className="min-h-[48px] min-w-[48px] p-4"

// Bouton secondaire
className="min-h-[44px] px-4 py-2"

// Icône interactive
className="p-3" // Ajoute du padding autour de l'icône
```

**Espacement**
```tsx
// Éviter les clics accidentels
<div className="flex gap-4"> {/* gap minimum de 16px */}
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

**Critères d'acceptation**
- [ ] Tous les boutons ≥ 44px de hauteur
- [ ] Espacement suffisant entre les boutons
- [ ] Test au doigt sur mobile réel

---

### 9.3 Tester sur différentes tailles d'écran
**Priorité** : P1 (Important)

**Description**
Vérifier le rendu sur les tailles d'écran courantes.

**Tailles à tester**
| Appareil | Dimensions | Ratio |
|----------|------------|-------|
| iPhone SE | 375×667 | 16:9 |
| iPhone 14 | 390×844 | 19.5:9 |
| iPhone 14 Pro Max | 430×932 | ~19.5:9 |
| Pixel 5 | 393×851 | ~19.5:9 |
| iPad Mini | 744×1133 | ~4:3 |
| iPad Pro | 1024×1366 | 4:3 |

**Chrome DevTools**
1. Ouvrir DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Sélectionner les appareils ou dimensions custom

**Checklist par taille**
- [ ] Titre lisible et pas coupé
- [ ] Formulaire accessible sans scroll excessif
- [ ] Buzzer visible et accessible
- [ ] Timer lisible
- [ ] Pochette d'album à taille correcte
- [ ] Contrôles accessibles

**Critères d'acceptation**
- [ ] Testé sur 6+ tailles différentes
- [ ] Pas de bug visuel majeur
- [ ] Screenshots documentés

---

### 9.4 Ajouter la vibration mobile au buzz
**Priorité** : P1 (Important)

**Description**
Utiliser l'API Vibration pour un feedback haptique lors du buzz.

**Implémentation**
```typescript
function triggerHapticFeedback() {
  if ('vibrate' in navigator) {
    navigator.vibrate(100) // Vibration de 100ms
  }
}

// Dans BuzzerButton
const handleClick = () => {
  triggerHapticFeedback()
  sfx.buzz()
  onBuzz()
}
```

**Patterns de vibration**
```typescript
// Buzz simple
navigator.vibrate(100)

// Pattern: buzz-pause-buzz (pour bonne réponse)
navigator.vibrate([100, 50, 100])

// Vibration longue (mauvaise réponse)
navigator.vibrate(200)
```

**Note** : Ne fonctionne pas sur iOS Safari (API non supportée).

**Critères d'acceptation**
- [ ] Vibration sur Android
- [ ] Pas d'erreur sur iOS (fail silently)
- [ ] Durée appropriée

---

### 9.5 Optimiser les performances mobile
**Priorité** : P2 (Nice-to-have)

**Description**
Réduire la charge CPU/GPU sur les appareils moins puissants.

**Optimisations**
1. **Animations réduites**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

2. **Images optimisées**
```tsx
import Image from 'next/image'

<Image
  src={`/api/cover/${song.id}`}
  alt="Pochette"
  width={256}
  height={256}
  quality={75}
  placeholder="blur"
  blurDataURL={PLACEHOLDER_BLUR}
/>
```

3. **Lazy loading**
```tsx
// Charger les composants lourds au besoin
const Confetti = dynamic(() => import('canvas-confetti'), {
  ssr: false,
  loading: () => null,
})
```

4. **Débounce des événements fréquents**
```typescript
const debouncedTimeUpdate = useMemo(
  () => debounce((time: number) => setCurrentTime(time), 100),
  []
)
```

**Critères d'acceptation**
- [ ] Pas de lag sur appareils mid-range
- [ ] Respect de prefers-reduced-motion
- [ ] Images optimisées

---

### 9.6 Gérer l'orientation landscape/portrait
**Priorité** : P2 (Nice-to-have)

**Description**
Adapter le layout selon l'orientation de l'écran.

**Détection**
```css
@media (orientation: portrait) {
  /* Layout vertical */
}

@media (orientation: landscape) {
  /* Layout horizontal */
}
```

**Avec Tailwind**
```tsx
<div className="portrait:flex-col landscape:flex-row">
  {/* Contenu */}
</div>
```

**Note** : Les classes `portrait:` et `landscape:` ne sont pas dans Tailwind par défaut, il faut les ajouter :

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
      // ...autres breakpoints
    },
  },
}
```

**Critères d'acceptation**
- [ ] Layout adapté en paysage
- [ ] Pas d'éléments coupés
- [ ] Buzzer toujours accessible

---

### 9.7 Ajouter un mode plein écran
**Priorité** : P2 (Nice-to-have)

**Description**
Option pour passer en mode plein écran pour une immersion maximale.

**API Fullscreen**
```typescript
async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  } else {
    await document.documentElement.requestFullscreen()
  }
}

// État
const [isFullscreen, setIsFullscreen] = useState(false)

useEffect(() => {
  const handler = () => setIsFullscreen(!!document.fullscreenElement)
  document.addEventListener('fullscreenchange', handler)
  return () => document.removeEventListener('fullscreenchange', handler)
}, [])
```

**UI**
```tsx
<button onClick={toggleFullscreen}>
  {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
</button>
```

**Note** : Ne fonctionne pas sur iOS Safari (limitations système).

**Critères d'acceptation**
- [ ] Bouton fullscreen visible
- [ ] Toggle fonctionnel sur desktop/Android
- [ ] Pas d'erreur sur iOS

---

### 9.8 Tester la lecture audio sur iOS Safari
**Priorité** : P0 (Critique)

**Description**
iOS Safari a des restrictions strictes sur l'autoplay audio. Il faut s'assurer que l'audio fonctionne correctement.

**Problèmes connus**
1. **Autoplay bloqué** : L'audio ne peut jouer qu'après une interaction utilisateur
2. **Volume non modifiable** : Le volume est contrôlé par les boutons hardware
3. **Playsound restrictions** : Les sons courts peuvent être silencieux

**Solutions**
```typescript
// 1. Débloquer l'audio au premier clic
const [audioUnlocked, setAudioUnlocked] = useState(false)

const unlockAudio = () => {
  if (audioUnlocked) return

  // Créer un contexte audio
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  audioContext.resume().then(() => {
    setAudioUnlocked(true)
  })

  // Jouer un son silencieux
  const audio = new Audio()
  audio.src = 'data:audio/mp3;base64,//uQxAAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  audio.play().catch(() => {})
}

// 2. Utiliser Web Audio API pour plus de contrôle
const audioContext = new AudioContext()
const gainNode = audioContext.createGain()
gainNode.connect(audioContext.destination)

// 3. Précharger les sons après interaction
const preloadSounds = () => {
  soundFiles.forEach(src => {
    const audio = new Audio(src)
    audio.preload = 'auto'
  })
}
```

**Test sur appareil réel**
1. Connecter un iPhone
2. Ouvrir Safari > localhost (via ngrok ou IP locale)
3. Tester le flux complet

**Critères d'acceptation**
- [ ] Audio joue après premier clic
- [ ] Pas de silence inattendu
- [ ] Effets sonores fonctionnels
- [ ] Testé sur iOS réel

---

## Checklist de l'Epic

- [ ] 9.1 Layout mobile adapté
- [ ] 9.2 Zones tactiles agrandies
- [ ] 9.3 Tests multi-tailles
- [ ] 9.4 Vibration mobile
- [ ] 9.5 Performances optimisées
- [ ] 9.6 Orientation landscape/portrait
- [ ] 9.7 Mode plein écran
- [ ] 9.8 iOS Safari testé

## Estimation
~3-4 heures de travail
