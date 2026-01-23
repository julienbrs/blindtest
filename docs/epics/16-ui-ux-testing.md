# Epic 16 : UI/UX Testing

## Objectif

Assurer la qualite visuelle et l'experience utilisateur de l'application par des tests automatises de regression visuelle, tests de responsiveness, tests UX et tests d'accessibilite.

## Dependances

- Epic 15 (Multiplayer Testing) complete
- Playwright configure
- Application fonctionnelle en local

---

## Workflow de Test

### 1. Tests de regression visuelle (Screenshots)

```bash
# Generer les screenshots de reference (premiere fois)
npx playwright test e2e/visual-regression.spec.ts --update-snapshots

# Comparer aux references
npx playwright test e2e/visual-regression.spec.ts
```

### 2. Tests UX interactifs (MCP Browser)

```
Outils disponibles:
- mcp__claude-in-chrome__navigate: Naviguer vers une URL
- mcp__claude-in-chrome__read_page: Lire le DOM/accessibilite
- mcp__claude-in-chrome__computer: Cliquer, taper, screenshot
- mcp__claude-in-chrome__find: Trouver des elements
```

---

## Issues

### 16.1 Setup Playwright visual regression testing infrastructure

**Priorite** : P1 (Important)

**Description**
Configurer l'infrastructure de base pour les tests de regression visuelle avec Playwright.

**Fichier** : `e2e/visual-regression.spec.ts`

**Implementation**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Attendre que les animations soient terminees
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('baseline setup', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage.png')
  })
})
```

**Configuration requise**

- Ajouter `snapshotDir` dans playwright.config.ts
- Creer le dossier `e2e/__screenshots__/`
- Configurer les seuils de tolerance

**Criteres d'acceptation**

- [ ] Configuration Playwright pour screenshots ajoutee
- [ ] Dossier screenshots cree et gitignore configure
- [ ] Test de base fonctionnel avec `toHaveScreenshot()`
- [ ] Documentation des commandes de mise a jour

---

### 16.2 Add visual tests for homepage and play mode selection

**Priorite** : P1 (Important)

**Description**
Tests visuels pour la page d'accueil et la selection de mode de jeu.

**Tests**

```typescript
test.describe('Homepage Visual', () => {
  test('play mode selection page renders correctly', async ({ page }) => {
    await page.goto('/play')
    await expect(page).toHaveScreenshot('play-selection.png')
  })

  test('solo button hover state', async ({ page }) => {
    await page.goto('/play')
    await page.hover('[data-testid="solo-button"]')
    await expect(page).toHaveScreenshot('solo-hover.png')
  })

  test('multiplayer button hover state', async ({ page }) => {
    await page.goto('/play')
    await page.hover('[data-testid="multiplayer-button"]')
    await expect(page).toHaveScreenshot('multiplayer-hover.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshot page /play
- [ ] Screenshot etats hover des boutons
- [ ] Verification gradient et animations

---

### 16.3 Add visual tests for solo game configuration page

**Priorite** : P1 (Important)

**Description**
Tests visuels pour la page de configuration du jeu solo.

**Tests**

```typescript
test.describe('Solo Config Visual', () => {
  test('config form renders correctly', async ({ page }) => {
    await page.goto('/solo')
    await expect(page).toHaveScreenshot('solo-config.png')
  })

  test('slider interaction visual', async ({ page }) => {
    await page.goto('/solo')
    const slider = page.locator('[data-testid="duration-slider"]')
    await slider.click()
    await expect(page).toHaveScreenshot('slider-active.png')
  })

  test('advanced settings expanded', async ({ page }) => {
    await page.goto('/solo')
    await page.click('[data-testid="advanced-settings"]')
    await expect(page).toHaveScreenshot('advanced-settings.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshot formulaire de configuration
- [ ] Screenshot slider actif
- [ ] Screenshot parametres avances deplies

---

### 16.4 Add visual tests for game screen (all states)

**Priorite** : P1 (Important)

**Description**
Tests visuels pour l'ecran de jeu dans tous ses etats.

**Tests**

```typescript
test.describe('Game Screen Visual', () => {
  test('playing state', async ({ page }) => {
    // Setup: navigate to game, start playing
    await expect(page).toHaveScreenshot('game-playing.png')
  })

  test('buzzed state', async ({ page }) => {
    // After buzzer pressed
    await expect(page).toHaveScreenshot('game-buzzed.png')
  })

  test('timer running state', async ({ page }) => {
    // Timer countdown visible
    await expect(page).toHaveScreenshot('game-timer.png')
  })

  test('reveal state', async ({ page }) => {
    // Song revealed
    await expect(page).toHaveScreenshot('game-reveal.png')
  })

  test('correct answer celebration', async ({ page }) => {
    // Green flash animation
    await expect(page).toHaveScreenshot('game-correct.png')
  })

  test('incorrect answer shake', async ({ page }) => {
    // Red shake animation
    await expect(page).toHaveScreenshot('game-incorrect.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshot etat playing
- [ ] Screenshot etat buzzed
- [ ] Screenshot etat timer
- [ ] Screenshot etat reveal
- [ ] Screenshot bonne reponse
- [ ] Screenshot mauvaise reponse

---

### 16.5 Add visual tests for multiplayer lobby and game

**Priorite** : P1 (Important)

**Description**
Tests visuels pour le lobby multijoueur et l'ecran de jeu.

**Tests**

```typescript
test.describe('Multiplayer Visual', () => {
  test('create room form', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(page).toHaveScreenshot('multiplayer-hub.png')
  })

  test('lobby with players', async ({ page }) => {
    // Setup: create room, mock players
    await expect(page).toHaveScreenshot('lobby-players.png')
  })

  test('room code display', async ({ page }) => {
    // Room code visible and styled
    await expect(page).toHaveScreenshot('room-code.png')
  })

  test('multiplayer game recap', async ({ page }) => {
    // End of game leaderboard
    await expect(page).toHaveScreenshot('multiplayer-recap.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshot hub multiplayer
- [ ] Screenshot lobby avec joueurs
- [ ] Screenshot code de room
- [ ] Screenshot recap final

---

### 16.6 Add visual tests for mobile portrait layouts

**Priorite** : P1 (Important)

**Description**
Tests visuels sur mobile en mode portrait (iPhone SE 375px, iPhone 12 390px).

**Tests**

```typescript
test.describe('Mobile Portrait', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('play selection mobile', async ({ page }) => {
    await page.goto('/play')
    await expect(page).toHaveScreenshot('mobile-play.png')
  })

  test('game screen mobile', async ({ page }) => {
    // Setup game
    await expect(page).toHaveScreenshot('mobile-game.png')
  })

  test('buzzer button size mobile', async ({ page }) => {
    // Verify buzzer is large enough
    await expect(page).toHaveScreenshot('mobile-buzzer.png')
  })
})

test.describe('Mobile Portrait iPhone 12', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  // Similar tests for iPhone 12
})
```

**Criteres d'acceptation**

- [ ] Screenshots iPhone SE (375px)
- [ ] Screenshots iPhone 12 (390px)
- [ ] Buzzer visible et cliquable

---

### 16.7 Add visual tests for mobile landscape layouts

**Priorite** : P2 (Nice-to-have)

**Description**
Tests visuels sur mobile en mode paysage.

**Tests**

```typescript
test.describe('Mobile Landscape', () => {
  test.use({ viewport: { width: 667, height: 375 } }) // iPhone SE landscape

  test('game screen landscape', async ({ page }) => {
    // Verify layout adapts
    await expect(page).toHaveScreenshot('landscape-game.png')
  })

  test('controls visible landscape', async ({ page }) => {
    // All controls accessible
    await expect(page).toHaveScreenshot('landscape-controls.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshot jeu en paysage
- [ ] Controles visibles et accessibles
- [ ] Pas de defilement horizontal

---

### 16.8 Add visual tests for tablet layouts

**Priorite** : P2 (Nice-to-have)

**Description**
Tests visuels sur tablette (iPad 768px, iPad Pro 1024px).

**Tests**

```typescript
test.describe('Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }) // iPad

  test('play selection tablet', async ({ page }) => {
    await page.goto('/play')
    await expect(page).toHaveScreenshot('tablet-play.png')
  })

  test('game screen tablet', async ({ page }) => {
    await expect(page).toHaveScreenshot('tablet-game.png')
  })
})

test.describe('Tablet Pro', () => {
  test.use({ viewport: { width: 1024, height: 1366 } }) // iPad Pro
  // Similar tests
})
```

**Criteres d'acceptation**

- [ ] Screenshots iPad (768px)
- [ ] Screenshots iPad Pro (1024px)
- [ ] Utilisation optimale de l'espace

---

### 16.9 Add visual tests for desktop layouts

**Priorite** : P2 (Nice-to-have)

**Description**
Tests visuels sur desktop (1280px, 1920px).

**Tests**

```typescript
test.describe('Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('play selection desktop', async ({ page }) => {
    await page.goto('/play')
    await expect(page).toHaveScreenshot('desktop-play.png')
  })
})

test.describe('Desktop Large', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('game screen full HD', async ({ page }) => {
    await expect(page).toHaveScreenshot('desktop-large-game.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Screenshots 1280px
- [ ] Screenshots 1920px
- [ ] Contenu centre et lisible

---

### 16.10 Test game configuration UX flow

**Priorite** : P1 (Important)

**Description**
Tester le flux UX de configuration du jeu (sliders, dropdowns, settings).

**Tests**

```typescript
test.describe('Config UX', () => {
  test('slider responds smoothly', async ({ page }) => {
    await page.goto('/solo')
    const slider = page.locator('[data-testid="duration-slider"]')

    // Drag slider
    await slider.dragTo(slider, { targetPosition: { x: 100, y: 0 } })

    // Verify value updated
    const value = await page
      .locator('[data-testid="duration-value"]')
      .textContent()
    expect(parseInt(value!)).toBeGreaterThan(10)
  })

  test('dropdown opens and closes', async ({ page }) => {
    await page.goto('/solo')
    await page.click('[data-testid="mode-dropdown"]')
    await expect(page.locator('[data-testid="mode-options"]')).toBeVisible()

    await page.click('[data-testid="mode-option-artist"]')
    await expect(page.locator('[data-testid="mode-options"]')).not.toBeVisible()
  })

  test('form validation feedback', async ({ page }) => {
    await page.goto('/solo')
    // Test validation messages appear
  })
})
```

**Criteres d'acceptation**

- [ ] Slider reagit fluidement
- [ ] Dropdown s'ouvre/ferme correctement
- [ ] Messages de validation affiches
- [ ] Pas de friction dans le flux

---

### 16.11 Test buzzer interaction UX

**Priorite** : P1 (Important)

**Description**
Tester l'UX du buzzer (timing, feedback, etats desactives).

**Tests**

```typescript
test.describe('Buzzer UX', () => {
  test('buzzer click feedback is immediate', async ({ page }) => {
    // Setup game
    const buzzer = page.locator('[data-testid="buzzer-button"]')

    const start = Date.now()
    await buzzer.click()
    const elapsed = Date.now() - start

    // Feedback should be < 100ms
    expect(elapsed).toBeLessThan(100)
  })

  test('buzzer disabled state is clear', async ({ page }) => {
    // When audio not playing, buzzer should look disabled
    await expect(page.locator('[data-testid="buzzer-button"]')).toHaveAttribute(
      'disabled'
    )
  })

  test('buzzer has haptic feedback on mobile', async ({ page }) => {
    // Verify vibration API called (mocked)
  })
})
```

**Criteres d'acceptation**

- [ ] Feedback buzzer < 100ms
- [ ] Etat desactive visuellement clair
- [ ] Feedback haptique sur mobile

---

### 16.12 Test multiplayer room join UX

**Priorite** : P1 (Important)

**Description**
Tester l'UX de jonction de room multijoueur.

**Tests**

```typescript
test.describe('Room Join UX', () => {
  test('room code input is easy to use', async ({ page }) => {
    await page.goto('/multiplayer')
    const input = page.locator('[data-testid="room-code-input"]')

    // Type code
    await input.type('ABC123')

    // Verify uppercase transformation
    await expect(input).toHaveValue('ABC123')
  })

  test('invalid code shows clear error', async ({ page }) => {
    await page.goto('/multiplayer')
    await page.fill('[data-testid="room-code-input"]', 'INVALID')
    await page.click('[data-testid="join-button"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'introuvable'
    )
  })

  test('loading state during join', async ({ page }) => {
    // Verify spinner shows while joining
  })
})
```

**Criteres d'acceptation**

- [ ] Input code facile a utiliser
- [ ] Erreurs affichees clairement
- [ ] Etat de chargement visible

---

### 16.13 Test error recovery UX flows

**Priorite** : P2 (Nice-to-have)

**Description**
Tester les flux de recuperation d'erreur.

**Tests**

```typescript
test.describe('Error Recovery UX', () => {
  test('network error shows retry option', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', (route) => route.abort())

    await page.goto('/solo')
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('retry actually retries', async ({ page }) => {
    // Click retry, verify request made
  })

  test('audio error shows fallback', async ({ page }) => {
    // Mock audio failure
  })
})
```

**Criteres d'acceptation**

- [ ] Erreur reseau affiche option retry
- [ ] Bouton retry fonctionne
- [ ] Erreurs audio gerees gracieusement

---

### 16.14 Test buzzer button animations

**Priorite** : P2 (Nice-to-have)

**Description**
Tester les animations du bouton buzzer.

**Tests**

```typescript
test.describe('Buzzer Animations', () => {
  test('buzzer scales on press', async ({ page }) => {
    // Verify scale animation
    const buzzer = page.locator('[data-testid="buzzer-button"]')

    await buzzer.click({ force: true })

    // Check computed style or screenshot
    await expect(page).toHaveScreenshot('buzzer-pressed.png')
  })

  test('buzzer pulses while active', async ({ page }) => {
    // Verify pulse animation runs
  })
})
```

**Criteres d'acceptation**

- [ ] Animation scale au clic
- [ ] Animation pulse quand actif
- [ ] Pas de saccades

---

### 16.15 Test correct/incorrect answer flash animations

**Priorite** : P2 (Nice-to-have)

**Description**
Tester les animations de flash bonne/mauvaise reponse.

**Tests**

```typescript
test.describe('Answer Feedback Animations', () => {
  test('correct answer shows green flash', async ({ page }) => {
    // Trigger correct answer
    await expect(page.locator('[data-testid="correct-flash"]')).toBeVisible()
  })

  test('incorrect answer shows red shake', async ({ page }) => {
    // Trigger incorrect answer
    await expect(page.locator('[data-testid="incorrect-flash"]')).toBeVisible()
  })
})
```

**Criteres d'acceptation**

- [ ] Flash vert visible
- [ ] Animation shake rouge
- [ ] Duree appropriee (~500ms)

---

### 16.16 Test song reveal transition animations

**Priorite** : P2 (Nice-to-have)

**Description**
Tester la transition blur-to-clear de la revelation.

**Tests**

```typescript
test.describe('Reveal Animation', () => {
  test('cover transitions from blur to clear', async ({ page }) => {
    // Trigger reveal
    // Verify blur removal animation
    await expect(page).toHaveScreenshot('reveal-transition.png')
  })

  test('title and artist animate in', async ({ page }) => {
    // Verify text animations
  })
})
```

**Criteres d'acceptation**

- [ ] Transition blur fluide
- [ ] Texte anime progressivement
- [ ] Pas de flash/saut

---

### 16.17 Test reduced motion preference support

**Priorite** : P2 (Nice-to-have)

**Description**
Verifier le support de prefers-reduced-motion.

**Tests**

```typescript
test.describe('Reduced Motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('animations disabled with reduced motion', async ({ page }) => {
    await page.goto('/play')

    // Verify no animations
    await expect(page).toHaveScreenshot('reduced-motion-play.png')
  })

  test('buzzer still functional without animation', async ({ page }) => {
    // Verify core functionality preserved
  })
})
```

**Criteres d'acceptation**

- [ ] Animations desactivees
- [ ] Fonctionnalites preservees
- [ ] Pas d'erreur JavaScript

---

### 16.18 Test focus states and indicators

**Priorite** : P1 (Important)

**Description**
Tester la visibilite des etats focus sur tous les elements interactifs.

**Tests**

```typescript
test.describe('Focus States', () => {
  test('buttons show focus ring', async ({ page }) => {
    await page.goto('/play')
    await page.keyboard.press('Tab')

    const button = page.locator('[data-testid="solo-button"]')
    await expect(button).toBeFocused()
    await expect(page).toHaveScreenshot('button-focus.png')
  })

  test('inputs show focus ring', async ({ page }) => {
    await page.goto('/multiplayer')
    await page.keyboard.press('Tab')

    await expect(page).toHaveScreenshot('input-focus.png')
  })

  test('all interactive elements keyboard accessible', async ({ page }) => {
    // Tab through all elements
  })
})
```

**Criteres d'acceptation**

- [ ] Boutons ont ring de focus
- [ ] Inputs ont ring de focus
- [ ] Navigation clavier complete

---

### 16.19 Test dark mode contrast and readability

**Priorite** : P1 (Important)

**Description**
Tester le contraste et la lisibilite en mode sombre.

**Tests**

```typescript
test.describe('Dark Mode', () => {
  test.use({ colorScheme: 'dark' })

  test('text readable on dark background', async ({ page }) => {
    await page.goto('/play')
    await expect(page).toHaveScreenshot('dark-mode-play.png')
  })

  test('buttons visible in dark mode', async ({ page }) => {
    await page.goto('/solo')
    await expect(page).toHaveScreenshot('dark-mode-solo.png')
  })

  test('game screen dark mode', async ({ page }) => {
    // Setup game
    await expect(page).toHaveScreenshot('dark-mode-game.png')
  })
})
```

**Criteres d'acceptation**

- [ ] Texte lisible sur fond sombre
- [ ] Boutons visibles
- [ ] Contraste suffisant (WCAG AA)

---

### 16.20 Test touch target sizes

**Priorite** : P1 (Important)

**Description**
Verifier que les zones tactiles font au moins 44px.

**Tests**

```typescript
test.describe('Touch Targets', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('buzzer button meets minimum size', async ({ page }) => {
    const buzzer = page.locator('[data-testid="buzzer-button"]')
    const box = await buzzer.boundingBox()

    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('control buttons meet minimum size', async ({ page }) => {
    const buttons = page.locator('[data-testid*="control-"]')

    for (const button of await buttons.all()) {
      const box = await button.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })
})
```

**Criteres d'acceptation**

- [ ] Buzzer >= 44px
- [ ] Boutons controles >= 44px
- [ ] Tous les elements cliquables >= 44px

---

### 16.21 Test Cumulative Layout Shift (CLS)

**Priorite** : P2 (Nice-to-have)

**Description**
Tester le Cumulative Layout Shift sur les pages principales.

**Tests**

```typescript
test.describe('Layout Shift', () => {
  test('homepage has minimal CLS', async ({ page }) => {
    await page.goto('/play')

    // Get CLS metric
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          resolve(entries.reduce((sum, entry) => sum + entry.value, 0))
        }).observe({ entryTypes: ['layout-shift'] })

        setTimeout(resolve, 3000, 0)
      })
    })

    expect(cls).toBeLessThan(0.1) // Good CLS < 0.1
  })

  test('game screen has minimal CLS', async ({ page }) => {
    // Similar test for game screen
  })
})
```

**Criteres d'acceptation**

- [ ] CLS < 0.1 sur page d'accueil
- [ ] CLS < 0.1 sur ecran de jeu
- [ ] Pas de sauts de layout visibles

---

### 16.22 Test loading states and skeleton screens

**Priorite** : P2 (Nice-to-have)

**Description**
Tester les etats de chargement et les skeletons.

**Tests**

```typescript
test.describe('Loading States', () => {
  test('loading screen shows on initial load', async ({ page }) => {
    await page.goto('/play')

    // Capture loading state (may need to slow network)
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible()
  })

  test('game loading shows progress', async ({ page }) => {
    // Verify loading indicator during song load
  })

  test('skeleton screens render correctly', async ({ page }) => {
    // If skeletons exist, verify they appear
  })
})
```

**Criteres d'acceptation**

- [ ] Ecran de chargement visible
- [ ] Indicateur de progression
- [ ] Skeletons ou spinners presents

---

## Configuration requise

### Mise a jour playwright.config.ts

```typescript
// Ajouter dans playwright.config.ts
export default defineConfig({
  // ... existing config
  snapshotDir: './e2e/__screenshots__',
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100, // Tolerance pour petites differences
      threshold: 0.2, // 20% de difference acceptable
    },
  },
})
```

### Commandes

```bash
# Generer/mettre a jour les screenshots de reference
npx playwright test e2e/visual-regression.spec.ts --update-snapshots

# Lancer tous les tests visuels
npx playwright test e2e/visual*.spec.ts

# Lancer tests UX
npx playwright test e2e/ux-flows.spec.ts

# Debug interactif
npx playwright test --ui
```

---

## Checklist de l'Epic

**Visual Regression**

- [ ] 16.1 Infrastructure screenshots
- [ ] 16.2 Homepage et play selection
- [ ] 16.3 Solo config page
- [ ] 16.4 Game screen (tous etats)
- [ ] 16.5 Multiplayer lobby et game

**Responsive**

- [ ] 16.6 Mobile portrait
- [ ] 16.7 Mobile landscape
- [ ] 16.8 Tablet
- [ ] 16.9 Desktop

**UX Flows**

- [ ] 16.10 Config UX
- [ ] 16.11 Buzzer UX
- [ ] 16.12 Room join UX
- [ ] 16.13 Error recovery UX

**Animations**

- [ ] 16.14 Buzzer animations
- [ ] 16.15 Answer flash animations
- [ ] 16.16 Reveal transitions
- [ ] 16.17 Reduced motion

**Accessibility**

- [ ] 16.18 Focus states
- [ ] 16.19 Dark mode contrast
- [ ] 16.20 Touch targets

**Performance**

- [ ] 16.21 CLS testing
- [ ] 16.22 Loading states

## Estimation

~10-12 heures de travail
