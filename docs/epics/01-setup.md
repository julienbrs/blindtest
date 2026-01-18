# Epic 1 : Setup du projet

## Objectif

Mettre en place les fondations techniques du projet : initialisation Next.js, configuration Tailwind avec un thème festif, structure des dossiers, et définition des types TypeScript.

## Prérequis

- Node.js 18+ installé
- npm ou yarn
- Accès au dossier de travail

---

## Issues

### 1.1 Initialiser le projet Next.js

**Priorité** : P0 (Critique)

**Description**
Créer le projet Next.js avec les options suivantes :

- TypeScript activé
- App Router (pas Pages Router)
- Dossier `src/` pour le code source
- ESLint configuré

**Commande**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Critères d'acceptation**

- [ ] Le projet démarre avec `npm run dev`
- [ ] TypeScript fonctionne (fichiers .tsx)
- [ ] App Router est utilisé (`src/app/`)
- [ ] ESLint est configuré

**Fichiers concernés**

- `package.json`
- `tsconfig.json`
- `next.config.js`
- `src/app/layout.tsx`
- `src/app/page.tsx`

---

### 1.2 Configurer Tailwind CSS

**Priorité** : P0 (Critique)

**Description**
Tailwind est installé par défaut avec create-next-app, mais il faut personnaliser la configuration pour le thème festif et s'assurer que tous les chemins sont couverts.

**Tâches**

1. Vérifier que `tailwind.config.ts` inclut les bons chemins
2. Configurer le thème avec les couleurs festives
3. Ajouter les plugins utiles (forms, typography si nécessaire)

**Configuration exemple**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Défini dans l'issue 1.3
      },
    },
  },
  plugins: [],
}
export default config
```

**Critères d'acceptation**

- [ ] Les classes Tailwind fonctionnent dans les composants
- [ ] Le thème personnalisé est accessible
- [ ] Pas d'erreurs de purge CSS en production

---

### 1.3 Définir la palette de couleurs festive

**Priorité** : P0 (Critique)

**Description**
Choisir et configurer une palette de couleurs qui évoque une ambiance de soirée/fête. Les couleurs doivent être suffisamment contrastées pour être lisibles et énergiques.

**Palette suggérée**

```typescript
colors: {
  // Couleurs principales
  primary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',  // Magenta/Violet festif
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  // Couleur secondaire (doré/jaune)
  secondary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',  // Jaune doré
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  // Fond sombre
  dark: {
    50: '#f8fafc',
    100: '#1e1b4b',  // Indigo très sombre
    200: '#312e81',
    300: '#3730a3',
    400: '#4338ca',
    500: '#4f46e5',
    600: '#6366f1',
    700: '#818cf8',
    800: '#a5b4fc',
    900: '#c7d2fe',
  },
  // États
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
}
```

**Critères d'acceptation**

- [ ] Palette définie dans tailwind.config.ts
- [ ] Contraste suffisant (WCAG AA minimum)
- [ ] Test visuel sur fond sombre et clair

---

### 1.4 Configurer les fonts

**Priorité** : P1 (Important)

**Description**
Ajouter des polices qui renforcent l'ambiance festive. Utiliser Google Fonts via `next/font` pour une performance optimale.

**Fonts suggérées**

- **Titres** : Poppins (bold, moderne) ou Montserrat
- **Corps** : Inter ou système par défaut

**Implémentation**

```typescript
// src/app/layout.tsx
import { Poppins, Inter } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**Critères d'acceptation**

- [ ] Fonts chargées sans flash (FOUT)
- [ ] Variables CSS disponibles
- [ ] Fallback système configuré

---

### 1.5 Créer la structure des dossiers

**Priorité** : P0 (Critique)

**Description**
Organiser le code source de manière claire et maintenable.

**Structure**

```
src/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Page d'accueil
│   ├── game/
│   │   └── page.tsx        # Écran de jeu
│   └── api/
│       ├── songs/
│       │   ├── route.ts    # GET /api/songs
│       │   └── random/
│       │       └── route.ts # GET /api/songs/random
│       ├── audio/
│       │   └── [id]/
│       │       └── route.ts # GET /api/audio/[id]
│       └── cover/
│           └── [id]/
│               └── route.ts # GET /api/cover/[id]
├── components/
│   ├── ui/                 # Composants UI réutilisables
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── game/               # Composants spécifiques au jeu
│   │   ├── AudioPlayer.tsx
│   │   ├── BuzzerButton.tsx
│   │   ├── Timer.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── SongReveal.tsx
│   └── layout/             # Composants de layout
│       └── Header.tsx
├── hooks/
│   ├── useGameState.ts
│   ├── useAudioPlayer.ts
│   └── useSoundEffects.ts
├── lib/
│   ├── audioScanner.ts     # Scan et métadonnées
│   ├── types.ts            # Types TypeScript
│   └── utils.ts            # Fonctions utilitaires
└── styles/
    └── globals.css         # Styles globaux
```

**Critères d'acceptation**

- [ ] Tous les dossiers créés
- [ ] Fichiers placeholder si nécessaire
- [ ] Imports fonctionnels avec alias `@/`

---

### 1.6 Configurer les variables d'environnement

**Priorité** : P0 (Critique)

**Description**
Définir les variables d'environnement pour la configuration de l'application, notamment le chemin vers les fichiers audio.

**Fichier `.env.local`**

```env
# Chemin vers le dossier contenant les fichiers audio
AUDIO_FOLDER_PATH=/path/to/your/music

# Port de l'application (optionnel)
PORT=3000

# Environnement
NODE_ENV=development
```

**Fichier `.env.example`**

```env
# Copier ce fichier en .env.local et remplir les valeurs
AUDIO_FOLDER_PATH=/path/to/your/music
```

**Accès dans le code**

```typescript
// Côté serveur uniquement
const audioPath = process.env.AUDIO_FOLDER_PATH

// Pour exposer au client (préfixer avec NEXT_PUBLIC_)
// NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Critères d'acceptation**

- [ ] `.env.local` créé (gitignored)
- [ ] `.env.example` commité pour documentation
- [ ] Variables accessibles dans les API routes

---

### 1.7 Configurer ESLint et Prettier

**Priorité** : P2 (Nice-to-have)

**Description**
Configurer des règles de linting cohérentes pour maintenir la qualité du code.

**ESLint** (`.eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "react/no-unescaped-entities": "off"
  }
}
```

**Prettier** (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Scripts package.json**

```json
{
  "scripts": {
    "lint": "next lint",
    "format": "prettier --write ."
  }
}
```

**Critères d'acceptation**

- [ ] `npm run lint` fonctionne
- [ ] Pas d'erreurs bloquantes
- [ ] Formatage cohérent

---

### 1.8 Créer le fichier de types global

**Priorité** : P0 (Critique)

**Description**
Définir tous les types TypeScript utilisés dans l'application.

**Fichier `src/lib/types.ts`**

```typescript
// ============================================
// Types pour les chansons
// ============================================

export interface Song {
  id: string // Hash unique du fichier
  title: string // Titre de la chanson
  artist: string // Artiste/groupe
  album?: string // Nom de l'album (optionnel)
  year?: number // Année de sortie (optionnel)
  duration: number // Durée en secondes
  filePath: string // Chemin absolu du fichier
  format: AudioFormat // Format du fichier
  hasCover: boolean // Si une pochette est disponible
}

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac'

// ============================================
// Types pour la configuration de partie
// ============================================

export interface GameConfig {
  guessMode: GuessMode // Ce qu'il faut deviner
  clipDuration: number // Durée de l'extrait en secondes
  timerDuration: number // Temps pour répondre après buzz
}

export type GuessMode = 'title' | 'artist' | 'both'

// ============================================
// Types pour l'état du jeu
// ============================================

export interface GameState {
  status: GameStatus // État actuel de la machine
  currentSong: Song | null // Chanson en cours
  score: number // Score actuel
  songsPlayed: number // Nombre de chansons jouées
  playedSongIds: string[] // IDs des chansons déjà jouées
  timerRemaining: number // Secondes restantes sur le timer
  isRevealed: boolean // Si la réponse est révélée
}

export type GameStatus =
  | 'idle' // En attente de démarrage
  | 'loading' // Chargement d'une chanson
  | 'playing' // Musique en lecture
  | 'buzzed' // Quelqu'un a buzzé
  | 'timer' // Timer en cours
  | 'reveal' // Réponse révélée
  | 'ended' // Partie terminée

// ============================================
// Types pour les réponses API
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SongsListResponse {
  songs: Song[]
  total: number
}

export interface RandomSongResponse {
  song: Song
}

// ============================================
// Types pour les actions du jeu
// ============================================

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'LOAD_SONG'; song: Song }
  | { type: 'PLAY' }
  | { type: 'BUZZ' }
  | { type: 'TICK_TIMER' }
  | { type: 'VALIDATE'; correct: boolean }
  | { type: 'REVEAL' }
  | { type: 'NEXT_SONG' }
  | { type: 'END_GAME' }
  | { type: 'RESET' }
```

**Critères d'acceptation**

- [ ] Tous les types définis
- [ ] Exports corrects
- [ ] Utilisables dans tout le projet

---

## Checklist de l'Epic

- [ ] 1.1 Projet Next.js initialisé
- [ ] 1.2 Tailwind CSS configuré
- [ ] 1.3 Palette de couleurs définie
- [ ] 1.4 Fonts configurées
- [ ] 1.5 Structure des dossiers créée
- [ ] 1.6 Variables d'environnement configurées
- [ ] 1.7 ESLint/Prettier configurés
- [ ] 1.8 Types TypeScript définis

## Estimation

~2-3 heures de travail
