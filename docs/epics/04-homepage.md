# Epic 4 : Frontend - Page d'accueil / Configuration

## Objectif
Créer la page d'accueil de l'application avec un formulaire de configuration de partie. Interface festive et accueillante qui donne envie de jouer.

## Dépendances
- Epic 1 terminé (setup, styles)
- Epic 3 partiellement terminé (API /api/songs pour afficher le nombre de chansons)

---

## Issues

### 4.1 Créer le layout principal
**Priorité** : P0 (Critique)

**Description**
Créer le layout racine qui sera utilisé par toutes les pages : fond festif, container centré, structure responsive.

**Fichier** : `src/app/layout.tsx`

**Implémentation**
```tsx
import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Blindtest',
  description: 'Application de blindtest musical',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 text-white font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
```

**Fichier** : `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-poppins: 'Poppins', sans-serif;
  --font-inter: 'Inter', sans-serif;
}

body {
  font-family: var(--font-inter);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-poppins);
}

/* Animation de fond subtile */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animated-bg {
  background-size: 200% 200%;
  animation: gradient-shift 15s ease infinite;
}
```

**Critères d'acceptation**
- [ ] Fond gradient festif appliqué
- [ ] Fonts chargées correctement
- [ ] Structure flex pour le contenu
- [ ] Metadata SEO définie

---

### 4.2 Designer la page d'accueil
**Priorité** : P0 (Critique)

**Description**
Créer la page d'accueil avec le logo/titre, une ambiance festive, et le formulaire de configuration.

**Fichier** : `src/app/page.tsx`

**Structure**
```tsx
export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Logo / Titre */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
          Blindtest
        </h1>
        <p className="mt-2 text-lg text-purple-200">
          Testez vos connaissances musicales !
        </p>
      </div>

      {/* Formulaire de configuration */}
      <GameConfigForm />

      {/* Stats de la bibliothèque */}
      <LibraryStats />
    </main>
  )
}
```

**Éléments visuels**
- Titre en gradient coloré
- Sous-titre descriptif
- Icônes musicales décoratives (notes, vinyles)
- Effet de particules ou étoiles en fond (optionnel)

**Critères d'acceptation**
- [ ] Titre impactant et lisible
- [ ] Ambiance festive visible
- [ ] Responsive (mobile et desktop)
- [ ] Temps de chargement rapide

---

### 4.3 Créer le formulaire de configuration
**Priorité** : P0 (Critique)

**Description**
Composant formulaire pour configurer les paramètres de la partie avant de jouer.

**Fichier** : `src/components/game/GameConfigForm.tsx`

**Implémentation**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GuessMode } from '@/lib/types'

export function GameConfigForm() {
  const router = useRouter()
  const [guessMode, setGuessMode] = useState<GuessMode>('both')
  const [clipDuration, setClipDuration] = useState(20)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Stocker la config dans les query params ou localStorage
    const params = new URLSearchParams({
      mode: guessMode,
      duration: clipDuration.toString(),
    })

    router.push(`/game?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Mode de devinette */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Que deviner ?</h2>
        {/* Radio buttons - voir issue 4.4 */}
      </div>

      {/* Durée des extraits */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Durée des extraits</h2>
        {/* Slider - voir issue 4.5 */}
      </div>

      {/* Bouton démarrer */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Chargement...' : 'Nouvelle Partie'}
      </button>
    </form>
  )
}
```

**Critères d'acceptation**
- [ ] Formulaire fonctionnel
- [ ] État de chargement au submit
- [ ] Redirection vers /game avec paramètres
- [ ] Style cohérent avec le thème

---

### 4.4 Ajouter le sélecteur de mode de devinette
**Priorité** : P0 (Critique)

**Description**
Radio buttons stylisés pour choisir ce que les joueurs doivent deviner.

**Options**
- Titre uniquement
- Artiste uniquement
- Les deux (titre ET artiste)

**Implémentation**
```tsx
const modes: { value: GuessMode; label: string; description: string }[] = [
  { value: 'title', label: 'Titre', description: 'Deviner le nom de la chanson' },
  { value: 'artist', label: 'Artiste', description: 'Deviner l\'artiste ou le groupe' },
  { value: 'both', label: 'Les deux', description: 'Deviner titre ET artiste' },
]

<div className="space-y-3">
  {modes.map((mode) => (
    <label
      key={mode.value}
      className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${
        guessMode === mode.value
          ? 'bg-purple-500/30 border-2 border-purple-400'
          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
      }`}
    >
      <input
        type="radio"
        name="guessMode"
        value={mode.value}
        checked={guessMode === mode.value}
        onChange={(e) => setGuessMode(e.target.value as GuessMode)}
        className="sr-only"
      />
      <div className="flex-1">
        <div className="font-semibold">{mode.label}</div>
        <div className="text-sm text-purple-200">{mode.description}</div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 ${
        guessMode === mode.value
          ? 'bg-purple-400 border-purple-400'
          : 'border-white/50'
      }`}>
        {guessMode === mode.value && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>
    </label>
  ))}
</div>
```

**Critères d'acceptation**
- [ ] 3 options disponibles
- [ ] État sélectionné visuellement distinct
- [ ] Descriptions claires
- [ ] Accessible au clavier

---

### 4.5 Ajouter le slider durée des extraits
**Priorité** : P0 (Critique)

**Description**
Slider pour choisir la durée des extraits audio (5 à 60 secondes).

**Implémentation**
```tsx
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <span className="text-purple-200">Durée</span>
    <span className="text-2xl font-bold">{clipDuration}s</span>
  </div>

  <input
    type="range"
    min={5}
    max={60}
    step={5}
    value={clipDuration}
    onChange={(e) => setClipDuration(Number(e.target.value))}
    className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:w-6
      [&::-webkit-slider-thumb]:h-6
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:bg-gradient-to-r
      [&::-webkit-slider-thumb]:from-pink-500
      [&::-webkit-slider-thumb]:to-purple-500
      [&::-webkit-slider-thumb]:shadow-lg
      [&::-webkit-slider-thumb]:cursor-pointer"
  />

  <div className="flex justify-between text-sm text-purple-300">
    <span>5s</span>
    <span>30s</span>
    <span>60s</span>
  </div>
</div>
```

**Critères d'acceptation**
- [ ] Range de 5 à 60 secondes
- [ ] Pas de 5 secondes
- [ ] Valeur affichée en temps réel
- [ ] Thumb stylisé selon le thème

---

### 4.6 Afficher le nombre de chansons disponibles
**Priorité** : P1 (Important)

**Description**
Afficher une info sur la taille de la bibliothèque pour rassurer l'utilisateur.

**Composant** : `src/components/game/LibraryStats.tsx`

**Implémentation**
```tsx
'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalSongs: number
  totalArtists: number
  isLoading: boolean
  error: string | null
}

export function LibraryStats() {
  const [stats, setStats] = useState<Stats>({
    totalSongs: 0,
    totalArtists: 0,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (!res.ok) throw new Error('Erreur chargement stats')
        const data = await res.json()
        setStats({
          totalSongs: data.totalSongs,
          totalArtists: data.totalArtists,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: 'Impossible de charger les statistiques',
        }))
      }
    }
    fetchStats()
  }, [])

  if (stats.isLoading) {
    return (
      <p className="mt-8 text-purple-300 animate-pulse">
        Chargement de la bibliothèque...
      </p>
    )
  }

  if (stats.error) {
    return (
      <p className="mt-8 text-red-400">
        {stats.error}
      </p>
    )
  }

  return (
    <div className="mt-8 text-center text-purple-200">
      <p className="text-lg">
        <span className="font-bold text-white">{stats.totalSongs}</span> chansons
        {' de '}
        <span className="font-bold text-white">{stats.totalArtists}</span> artistes
      </p>
      <p className="text-sm mt-1">prêtes à vous tester !</p>
    </div>
  )
}
```

**Critères d'acceptation**
- [ ] Nombre de chansons affiché
- [ ] État de chargement visible
- [ ] Gestion des erreurs
- [ ] Design intégré au thème

---

### 4.7 Ajouter la validation du formulaire
**Priorité** : P1 (Important)

**Description**
Valider les paramètres avant de démarrer la partie.

**Validations**
- Au moins une chanson dans la bibliothèque
- Valeurs dans les ranges acceptés

**Implémentation**
```tsx
const [validationError, setValidationError] = useState<string | null>(null)

const validateForm = async (): Promise<boolean> => {
  // Vérifier qu'il y a des chansons
  try {
    const res = await fetch('/api/songs')
    const data = await res.json()
    if (data.total === 0) {
      setValidationError('Aucune chanson disponible. Vérifiez votre dossier audio.')
      return false
    }
  } catch {
    setValidationError('Impossible de vérifier la bibliothèque.')
    return false
  }

  // Valider les paramètres
  if (clipDuration < 5 || clipDuration > 60) {
    setValidationError('La durée doit être entre 5 et 60 secondes.')
    return false
  }

  setValidationError(null)
  return true
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  const isValid = await validateForm()
  if (!isValid) {
    setIsLoading(false)
    return
  }

  // ... redirection
}
```

**Critères d'acceptation**
- [ ] Erreur si bibliothèque vide
- [ ] Messages d'erreur clairs
- [ ] Pas de submit si invalide

---

### 4.8 Persister la configuration
**Priorité** : P2 (Nice-to-have)

**Description**
Sauvegarder les préférences de l'utilisateur dans localStorage pour les sessions futures.

**Implémentation**
```tsx
const STORAGE_KEY = 'blindtest_config'

// Charger au montage
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const config = JSON.parse(saved)
      setGuessMode(config.guessMode || 'both')
      setClipDuration(config.clipDuration || 20)
    } catch {
      // Config invalide, ignorer
    }
  }
}, [])

// Sauvegarder à chaque changement
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    guessMode,
    clipDuration,
  }))
}, [guessMode, clipDuration])
```

**Critères d'acceptation**
- [ ] Config sauvegardée en localStorage
- [ ] Restaurée au prochain chargement
- [ ] Gestion des valeurs invalides

---

### 4.9 Ajouter un bouton "Paramètres avancés"
**Priorité** : P2 (Nice-to-have)

**Description**
Section dépliable avec des options supplémentaires pour les utilisateurs avancés.

**Options avancées possibles**
- Timer personnalisé (autre que 5s)
- Mode sans timer
- Point de départ aléatoire dans la chanson

**Implémentation**
```tsx
const [showAdvanced, setShowAdvanced] = useState(false)

<button
  type="button"
  onClick={() => setShowAdvanced(!showAdvanced)}
  className="text-purple-300 hover:text-white transition-colors"
>
  {showAdvanced ? '▼ Masquer' : '▶ Paramètres avancés'}
</button>

{showAdvanced && (
  <div className="mt-4 space-y-4 border-t border-white/20 pt-4">
    {/* Options avancées */}
  </div>
)}
```

**Critères d'acceptation**
- [ ] Section masquée par défaut
- [ ] Animation d'ouverture/fermeture
- [ ] Options fonctionnelles

---

### 4.10 Créer une animation d'entrée
**Priorité** : P2 (Nice-to-have)

**Description**
Animation de chargement/apparition des éléments de la page pour une entrée dynamique.

**Avec Framer Motion**
```bash
npm install framer-motion
```

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
  {/* Contenu */}
</motion.div>
```

**Animation suggérée**
1. Titre apparaît en premier (fade + slide up)
2. Formulaire apparaît ensuite (stagger)
3. Stats apparaissent en dernier

**Critères d'acceptation**
- [ ] Animation fluide
- [ ] Pas de flash de contenu non-stylé
- [ ] Désactivable si prefers-reduced-motion

---

## Checklist de l'Epic

- [ ] 4.1 Layout principal créé
- [ ] 4.2 Page d'accueil designée
- [ ] 4.3 Formulaire de configuration
- [ ] 4.4 Sélecteur mode de devinette
- [ ] 4.5 Slider durée extraits
- [ ] 4.6 Affichage nombre de chansons
- [ ] 4.7 Validation du formulaire
- [ ] 4.8 Persistance localStorage
- [ ] 4.9 Paramètres avancés
- [ ] 4.10 Animation d'entrée

## Estimation
~3-4 heures de travail
