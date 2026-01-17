# Epic 7 : UI/UX - Thème festif

## Objectif

Créer une interface visuelle attrayante avec une ambiance de soirée/fête. Animations fluides, couleurs vives, effets visuels satisfaisants.

## Dépendances

- Epic 1 terminé (Tailwind, couleurs)
- Framer Motion installé (optionnel mais recommandé)

---

## Issues

### 7.1 Créer le fond d'écran festif

**Priorité** : P1 (Important)

**Description**
Fond d'écran animé ou gradient qui évoque l'ambiance festive.

**Options**

1. **Gradient animé**

```css
.animated-bg {
  background: linear-gradient(-45deg, #1e1b4b, #581c87, #be185d, #1e1b4b);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

2. **Particules / Étoiles**

```tsx
// Composant avec canvas ou CSS
function StarryBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )
}
```

3. **Orbes flottantes**

```css
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}
```

**Critères d'acceptation**

- [ ] Fond visuellement attrayant
- [ ] Animation subtile (pas distrayante)
- [ ] Performance OK (pas de lag)
- [ ] Fonctionne sur mobile

---

### 7.2 Styliser les boutons principaux

**Priorité** : P0 (Critique)

**Description**
Design cohérent pour tous les boutons avec états hover, active, disabled.

**Classes Tailwind**

```tsx
// Bouton primaire (ex: "Nouvelle partie")
const primaryButton = `
  py-4 px-6
  bg-gradient-to-r from-pink-500 to-purple-600
  hover:from-pink-400 hover:to-purple-500
  active:from-pink-600 active:to-purple-700
  rounded-xl
  font-bold text-lg text-white
  shadow-lg hover:shadow-xl
  transform hover:scale-105 active:scale-95
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
`

// Bouton secondaire (ex: "Quitter")
const secondaryButton = `
  py-2 px-4
  bg-white/10 hover:bg-white/20 active:bg-white/5
  rounded-lg
  text-purple-200 hover:text-white
  transition-all duration-200
`

// Bouton succès (ex: "Correct")
const successButton = `
  py-4 px-6
  bg-green-600 hover:bg-green-500 active:bg-green-700
  rounded-xl
  font-bold text-white
  shadow-lg
  transition-all duration-200
`

// Bouton danger (ex: "Incorrect")
const dangerButton = `
  py-4 px-6
  bg-red-600 hover:bg-red-500 active:bg-red-700
  rounded-xl
  font-bold text-white
  shadow-lg
  transition-all duration-200
`
```

**Critères d'acceptation**

- [ ] 4 variantes de boutons (primary, secondary, success, danger)
- [ ] États hover et active
- [ ] État disabled stylisé
- [ ] Effet scale au hover

---

### 7.3 Ajouter des ombres et profondeur

**Priorité** : P1 (Important)

**Description**
Utiliser des ombres pour créer de la profondeur et hiérarchiser les éléments.

**Classes**

```tsx
// Card avec profondeur
const card = `
  bg-white/10
  backdrop-blur-sm
  rounded-2xl
  shadow-xl
  border border-white/10
`

// Élément surélevé
const elevated = `
  shadow-[0_20px_50px_rgba(0,0,0,0.3)]
`

// Glow effect
const glow = `
  shadow-[0_0_30px_rgba(236,72,153,0.5)]
`
```

**Critères d'acceptation**

- [ ] Cards avec ombre et blur
- [ ] Hiérarchie visuelle claire
- [ ] Cohérence sur tous les composants

---

### 7.4 Créer les animations de transition

**Priorité** : P1 (Important)

**Description**
Transitions fluides entre les états du jeu.

**Avec Framer Motion**

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Fade in/out
;<AnimatePresence mode="wait">
  {state.status === 'playing' && (
    <motion.div
      key="playing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <BuzzerButton />
    </motion.div>
  )}
</AnimatePresence>

// Stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
```

**Animations suggérées**

- Apparition du buzzer : slide up + fade
- Disparition du buzzer : scale down + fade
- Timer : pulse quand urgent
- Révélation : scale up depuis le centre

**Critères d'acceptation**

- [ ] Transitions fluides (60fps)
- [ ] Pas de flash de contenu
- [ ] AnimatePresence pour les sorties

---

### 7.5 Ajouter l'animation de bonne réponse

**Priorité** : P1 (Important)

**Description**
Célébration visuelle quand le joueur trouve la bonne réponse.

**Effets**

1. **Confettis**

```bash
npm install canvas-confetti
```

```typescript
import confetti from 'canvas-confetti'

function celebrateCorrectAnswer() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ec4899', '#8b5cf6', '#fbbf24'],
  })
}
```

2. **Flash vert**

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: [0, 0.3, 0] }}
  transition={{ duration: 0.5 }}
  className="fixed inset-0 bg-green-500 pointer-events-none"
/>
```

3. **Animation du score**

```tsx
<motion.span
  key={score}
  initial={{ scale: 1.5, color: '#22c55e' }}
  animate={{ scale: 1, color: '#ffffff' }}
  transition={{ duration: 0.5 }}
>
  {score}
</motion.span>
```

**Critères d'acceptation**

- [ ] Effet visuel satisfaisant
- [ ] Confettis fonctionnels
- [ ] Score qui "pop"
- [ ] Son synchronisé (voir Epic 8)

---

### 7.6 Ajouter l'animation de mauvaise réponse

**Priorité** : P1 (Important)

**Description**
Feedback visuel négatif mais pas frustrant.

**Effets**

1. **Shake**

```tsx
<motion.div
  animate={incorrect ? { x: [-10, 10, -10, 10, 0] } : {}}
  transition={{ duration: 0.4 }}
>
  {content}
</motion.div>
```

2. **Flash rouge subtil**

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: [0, 0.2, 0] }}
  transition={{ duration: 0.3 }}
  className="fixed inset-0 bg-red-500 pointer-events-none"
/>
```

**Critères d'acceptation**

- [ ] Feedback clair mais pas punitif
- [ ] Shake de l'écran ou du composant
- [ ] Flash rouge subtil

---

### 7.7 Styliser le timer avec urgence

**Priorité** : P1 (Important)

**Description**
Le timer devient visuellement plus urgent dans les dernières secondes.

**Effets par temps restant**
| Temps | Couleur | Animation |
|-------|---------|-----------|
| 5-4s | Jaune | Normal |
| 3-2s | Orange | Léger pulse |
| 1s | Rouge | Pulse rapide + clignotement |

**Implémentation**

```tsx
const isWarning = remaining <= 3
const isUrgent = remaining <= 1

<div className={`
  ${isUrgent ? 'text-red-500 animate-pulse' : isWarning ? 'text-orange-400' : 'text-yellow-400'}
  ${isUrgent ? 'scale-110' : ''}
  transition-all duration-200
`}>
  {remaining}
</div>
```

**Critères d'acceptation**

- [ ] Changement de couleur progressif
- [ ] Pulsation dans les dernières secondes
- [ ] Effet d'urgence palpable

---

### 7.8 Ajouter des icônes

**Priorité** : P1 (Important)

**Description**
Icônes cohérentes pour améliorer la compréhension visuelle.

**Options**

1. **Heroicons** (recommandé avec Tailwind)

```bash
npm install @heroicons/react
```

```tsx
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
```

2. **Lucide React**

```bash
npm install lucide-react
```

```tsx
import { Play, Pause, Check, X, Music, Volume2 } from 'lucide-react'
```

3. **SVG custom** (déjà implémenté dans certains composants)

**Icônes nécessaires**

- Play / Pause
- Check (correct)
- X (incorrect)
- Music note
- Volume
- Arrow right (suivant)
- Exit / Home

**Critères d'acceptation**

- [ ] Icônes cohérentes en style
- [ ] Taille appropriée
- [ ] Couleur cohérente avec le texte

---

### 7.9 Créer un thème sombre

**Priorité** : P2 (Nice-to-have)

**Description**
Option de thème encore plus sombre pour les soirées en basse luminosité.

**Implémentation**

```tsx
// Contexte pour le thème
const ThemeContext = createContext<{
  isDark: boolean
  toggle: () => void
}>({ isDark: true, toggle: () => {} })

// Dans le layout
<body className={isDark ? 'dark' : ''}>
```

```css
/* Tailwind dark mode */
.dark {
  --bg-primary: #0f0a1f;
  --bg-secondary: #1a1333;
}
```

**Critères d'acceptation**

- [ ] Toggle dans les paramètres
- [ ] Couleurs encore plus sombres
- [ ] Transition fluide

---

### 7.10 Ajouter des particules de fond

**Priorité** : P2 (Nice-to-have)

**Description**
Effet de particules ou bulles flottantes en arrière-plan.

**Avec tsparticles**

```bash
npm install @tsparticles/react @tsparticles/slim
```

```tsx
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// Configuration légère
const particlesConfig = {
  particles: {
    number: { value: 30 },
    color: { value: '#ffffff' },
    opacity: { value: 0.1 },
    size: { value: 3 },
    move: { enable: true, speed: 0.5 },
  },
}
```

**Alternative CSS pure**

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 10s ease-in-out infinite;
}
```

**Critères d'acceptation**

- [ ] Effet subtil et non distrayant
- [ ] Performance maintenue
- [ ] Désactivable si prefers-reduced-motion

---

## Checklist de l'Epic

- [ ] 7.1 Fond festif
- [ ] 7.2 Boutons stylisés
- [ ] 7.3 Ombres et profondeur
- [ ] 7.4 Animations de transition
- [ ] 7.5 Animation bonne réponse
- [ ] 7.6 Animation mauvaise réponse
- [ ] 7.7 Timer urgent
- [ ] 7.8 Icônes
- [ ] 7.9 Thème sombre
- [ ] 7.10 Particules

## Estimation

~3-4 heures de travail
