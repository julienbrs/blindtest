# Epic 12 : Tests et qualité

## Objectif

Assurer la qualité et la fiabilité de l'application par des tests automatisés et manuels.

## Dépendances

- Application fonctionnelle complète
- Jest et/ou Vitest configuré

---

## Issues

### 12.1 Tester le scan de fichiers audio

**Priorité** : P1 (Important)

**Description**
Tests unitaires pour le scanner de fichiers audio.

**Setup test**

```bash
npm install -D vitest @testing-library/react
```

**Fichier** : `src/lib/__tests__/audioScanner.test.ts`

**Tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  scanAudioFolder,
  extractMetadata,
  generateSongId,
} from '../audioScanner'

describe('audioScanner', () => {
  describe('scanAudioFolder', () => {
    it('devrait trouver les fichiers MP3', async () => {
      const files = await scanAudioFolder('./test-fixtures/music')
      expect(files.some((f) => f.endsWith('.mp3'))).toBe(true)
    })

    it('devrait ignorer les fichiers non-audio', async () => {
      const files = await scanAudioFolder('./test-fixtures/music')
      expect(files.some((f) => f.endsWith('.txt'))).toBe(false)
    })

    it('devrait scanner récursivement', async () => {
      const files = await scanAudioFolder('./test-fixtures/music')
      expect(files.some((f) => f.includes('/subfolder/'))).toBe(true)
    })

    it('devrait retourner un array vide pour un dossier inexistant', async () => {
      const files = await scanAudioFolder('./nonexistent')
      expect(files).toEqual([])
    })
  })

  describe('extractMetadata', () => {
    it('devrait extraire titre et artiste', async () => {
      const song = await extractMetadata('./test-fixtures/music/test.mp3')
      expect(song).not.toBeNull()
      expect(song?.title).toBeDefined()
      expect(song?.artist).toBeDefined()
    })

    it('devrait fallback sur le nom de fichier', async () => {
      const song = await extractMetadata(
        './test-fixtures/music/Artist - Title.mp3'
      )
      expect(song?.artist).toBe('Artist')
      expect(song?.title).toBe('Title')
    })

    it('devrait retourner null pour un fichier invalide', async () => {
      const song = await extractMetadata('./test-fixtures/music/corrupted.mp3')
      expect(song).toBeNull()
    })
  })

  describe('generateSongId', () => {
    it('devrait générer un ID de 12 caractères', () => {
      const id = generateSongId('/path/to/song.mp3')
      expect(id).toHaveLength(12)
    })

    it('devrait être déterministe', () => {
      const id1 = generateSongId('/path/to/song.mp3')
      const id2 = generateSongId('/path/to/song.mp3')
      expect(id1).toBe(id2)
    })

    it('devrait être unique par fichier', () => {
      const id1 = generateSongId('/path/to/song1.mp3')
      const id2 = generateSongId('/path/to/song2.mp3')
      expect(id1).not.toBe(id2)
    })
  })
})
```

**Critères d'acceptation**

- [ ] Tests pour scanAudioFolder
- [ ] Tests pour extractMetadata
- [ ] Tests pour generateSongId
- [ ] Fixtures de test créées
- [ ] Coverage > 80%

---

### 12.2 Tester les API routes

**Priorité** : P1 (Important)

**Description**
Tests d'intégration pour les endpoints API.

**Fichier** : `src/app/api/__tests__/songs.test.ts`

**Tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../songs/route'
import { GET as GETRandom } from '../songs/random/route'

// Mock du cache
vi.mock('@/lib/audioScanner', () => ({
  getSongsCache: vi.fn(() =>
    Promise.resolve([
      {
        id: 'abc123',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
      },
      {
        id: 'def456',
        title: 'Another Song',
        artist: 'Another Artist',
        duration: 240,
      },
    ])
  ),
}))

describe('API /api/songs', () => {
  it('GET devrait retourner la liste des chansons', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.songs).toHaveLength(2)
    expect(data.total).toBe(2)
  })
})

describe('API /api/songs/random', () => {
  it('GET devrait retourner une chanson aléatoire', async () => {
    const request = new Request('http://localhost/api/songs/random')
    const response = await GETRandom(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.song).toBeDefined()
    expect(['abc123', 'def456']).toContain(data.song.id)
  })

  it('GET avec exclude devrait filtrer les chansons', async () => {
    const request = new Request(
      'http://localhost/api/songs/random?exclude=abc123'
    )
    const response = await GETRandom(request)
    const data = await response.json()

    expect(data.song.id).toBe('def456')
  })
})
```

**Critères d'acceptation**

- [ ] Tests GET /api/songs
- [ ] Tests GET /api/songs/random
- [ ] Tests GET /api/songs/[id]
- [ ] Tests d'erreur (404, 500)
- [ ] Mocks appropriés

---

### 12.3 Tester la machine d'état du jeu

**Priorité** : P1 (Important)

**Description**
Tests unitaires pour le reducer et les transitions d'état.

**Fichier** : `src/hooks/__tests__/useGameState.test.ts`

**Tests**

```typescript
import { describe, it, expect } from 'vitest'
import { gameReducer, initialState } from '../useGameState'

describe('gameReducer', () => {
  const mockSong = {
    id: 'abc123',
    title: 'Test',
    artist: 'Artist',
    duration: 180,
  }

  it('START_GAME devrait passer en loading', () => {
    const state = gameReducer(initialState, { type: 'START_GAME' })
    expect(state.status).toBe('loading')
  })

  it('LOAD_SONG devrait charger la chanson', () => {
    const state = gameReducer(
      { ...initialState, status: 'loading' },
      { type: 'LOAD_SONG', song: mockSong }
    )
    expect(state.currentSong).toEqual(mockSong)
  })

  it('BUZZ devrait démarrer le timer', () => {
    const state = gameReducer(
      { ...initialState, status: 'playing' },
      { type: 'BUZZ' }
    )
    expect(state.status).toBe('timer')
    expect(state.timerRemaining).toBe(5)
  })

  it('VALIDATE(true) devrait incrémenter le score', () => {
    const state = gameReducer(
      { ...initialState, status: 'timer', score: 0, currentSong: mockSong },
      { type: 'VALIDATE', correct: true }
    )
    expect(state.score).toBe(1)
    expect(state.status).toBe('reveal')
  })

  it('VALIDATE(false) ne devrait pas incrémenter le score', () => {
    const state = gameReducer(
      { ...initialState, status: 'timer', score: 0, currentSong: mockSong },
      { type: 'VALIDATE', correct: false }
    )
    expect(state.score).toBe(0)
    expect(state.status).toBe('reveal')
  })

  it('TICK_TIMER devrait décrémenter le timer', () => {
    const state = gameReducer(
      { ...initialState, status: 'timer', timerRemaining: 5 },
      { type: 'TICK_TIMER' }
    )
    expect(state.timerRemaining).toBe(4)
  })

  it('TICK_TIMER à 0 devrait passer en reveal', () => {
    const state = gameReducer(
      {
        ...initialState,
        status: 'timer',
        timerRemaining: 1,
        currentSong: mockSong,
      },
      { type: 'TICK_TIMER' }
    )
    expect(state.status).toBe('reveal')
    expect(state.timerRemaining).toBe(0)
  })

  it('NEXT_SONG devrait passer en loading', () => {
    const state = gameReducer(
      { ...initialState, status: 'reveal' },
      { type: 'NEXT_SONG' }
    )
    expect(state.status).toBe('loading')
    expect(state.isRevealed).toBe(false)
  })
})
```

**Critères d'acceptation**

- [ ] Tests pour chaque action
- [ ] Tests des transitions
- [ ] Tests des edge cases
- [ ] 100% coverage du reducer

---

### 12.4 Tester sur plusieurs navigateurs

**Priorité** : P1 (Important)

**Description**
Tests manuels de compatibilité multi-navigateurs.

**Navigateurs à tester**
| Navigateur | Version min | Priorité |
|------------|-------------|----------|
| Chrome | 100+ | P0 |
| Firefox | 100+ | P0 |
| Safari | 15+ | P0 |
| Edge | 100+ | P1 |
| Safari iOS | 15+ | P0 |
| Chrome Android | 100+ | P0 |

**Checklist par navigateur**

- [ ] Page d'accueil charge correctement
- [ ] Formulaire de configuration fonctionne
- [ ] Audio se charge et joue
- [ ] Buzzer fonctionne
- [ ] Timer fonctionne
- [ ] Animations fluides
- [ ] Responsive correct
- [ ] Effets sonores fonctionnent

**Outils**

- BrowserStack pour tests sur appareils réels
- Chrome DevTools pour émulation
- Safari Technology Preview

**Critères d'acceptation**

- [ ] Chrome desktop ✓
- [ ] Firefox desktop ✓
- [ ] Safari desktop ✓
- [ ] Safari iOS ✓
- [ ] Chrome Android ✓
- [ ] Bugs critiques documentés

---

### 12.5 Tester avec une grande bibliothèque

**Priorité** : P2 (Nice-to-have)

**Description**
Vérifier les performances avec 1000+ chansons.

**Tests de performance**

```typescript
describe('Performance', () => {
  it('devrait scanner 1000 fichiers en moins de 30s', async () => {
    const start = Date.now()
    const songs = await scanAudioFolder('./large-library')
    const duration = Date.now() - start

    expect(songs.length).toBeGreaterThan(1000)
    expect(duration).toBeLessThan(30000)
  })

  it('GET /api/songs devrait répondre en moins de 1s', async () => {
    const start = Date.now()
    const response = await fetch('/api/songs')
    const duration = Date.now() - start

    expect(response.ok).toBe(true)
    expect(duration).toBeLessThan(1000)
  })
})
```

**Métriques à surveiller**

- Temps de scan initial
- Utilisation mémoire
- Temps de réponse API
- Taille du payload JSON

**Critères d'acceptation**

- [ ] Scan < 30s pour 1000 fichiers
- [ ] API < 1s
- [ ] Mémoire stable (pas de leak)
- [ ] UI réactive

---

### 12.6 Ajouter des tests unitaires

**Priorité** : P2 (Nice-to-have)

**Description**
Tests unitaires pour les fonctions utilitaires.

**Fichier** : `src/lib/__tests__/utils.test.ts`

**Tests**

```typescript
import { describe, it, expect } from 'vitest'
import { formatTime, formatDuration, parseFileName } from '../utils'

describe('utils', () => {
  describe('formatTime', () => {
    it('devrait formater les secondes en mm:ss', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(65)).toBe('1:05')
      expect(formatTime(3600)).toBe('60:00')
    })
  })

  describe('formatDuration', () => {
    it('devrait formater en heures et minutes', () => {
      expect(formatDuration(3600)).toBe('1h 0min')
      expect(formatDuration(5400)).toBe('1h 30min')
    })
  })

  describe('parseFileName', () => {
    it('devrait parser "Artiste - Titre"', () => {
      const result = parseFileName('Queen - Bohemian Rhapsody')
      expect(result.artist).toBe('Queen')
      expect(result.title).toBe('Bohemian Rhapsody')
    })

    it('devrait gérer les titres sans artiste', () => {
      const result = parseFileName('Unknown Song')
      expect(result.artist).toBeUndefined()
      expect(result.title).toBe('Unknown Song')
    })
  })
})
```

**Critères d'acceptation**

- [ ] Tests pour toutes les fonctions utilitaires
- [ ] Edge cases couverts
- [ ] Coverage > 90%

---

### 12.7 Ajouter des tests E2E

**Priorité** : P3 (Futur)

**Description**
Tests end-to-end avec Playwright pour le flux complet.

**Setup**

```bash
npm install -D @playwright/test
npx playwright install
```

**Fichier** : `e2e/game-flow.spec.ts`

**Tests**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Blindtest Game Flow', () => {
  test('devrait pouvoir jouer une partie complète', async ({ page }) => {
    // 1. Accueil
    await page.goto('/')
    await expect(page.getByText('Blindtest')).toBeVisible()

    // 2. Configuration
    await page.getByText('Les deux').click()
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()

    // 3. Attendre le chargement
    await page.waitForURL('/game*')
    await expect(page.getByText('Chargement')).not.toBeVisible({
      timeout: 10000,
    })

    // 4. Buzzer
    await page.getByRole('button', { name: 'BUZZ!' }).click()

    // 5. Valider
    await page.getByRole('button', { name: 'Correct' }).click()

    // 6. Vérifier le score
    await expect(page.getByText('Score')).toContainText('1')

    // 7. Chanson suivante
    await page.getByRole('button', { name: 'Chanson suivante' }).click()

    // 8. Quitter
    await page.getByRole('button', { name: 'Quitter' }).click()
    await page.getByRole('button', { name: 'Quitter' }).nth(1).click() // Confirmation
    await page.waitForURL('/')
  })
})
```

**Critères d'acceptation**

- [ ] Test du flux complet
- [ ] Tests sur mobile (viewport)
- [ ] CI/CD intégration

---

## Configuration Vitest

**Fichier** : `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Checklist de l'Epic

- [ ] 12.1 Tests scanner audio
- [ ] 12.2 Tests API routes
- [ ] 12.3 Tests machine d'état
- [ ] 12.4 Tests multi-navigateurs
- [ ] 12.5 Tests performance
- [ ] 12.6 Tests unitaires utils
- [ ] 12.7 Tests E2E

## Estimation

~4-6 heures de travail
