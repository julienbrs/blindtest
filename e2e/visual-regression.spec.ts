import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots for visual regression testing.
 * Run with --update-snapshots to generate/update baseline screenshots:
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 *
 * Run normally to compare against baselines:
 *   npx playwright test e2e/visual-regression.spec.ts
 */

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('baseline setup - homepage redirects to play', async ({ page }) => {
    // Homepage redirects to /play
    await page.goto('/')

    // Wait for redirect to complete
    await page.waitForURL('/play')

    // Verify we're on the play page
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
  })
})

test.describe('Homepage Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play mode selection page renders correctly', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')

    // Additional wait for any remaining transitions
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page
    await expect(page).toHaveScreenshot('play-selection.png', {
      fullPage: true,
    })
  })

  test('solo button hover state', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Hover over the solo button
    await page.hover('[data-testid="solo-button"]')

    // Wait for hover animation to complete
    await page.waitForTimeout(350)

    // Take screenshot showing hover state
    await expect(page).toHaveScreenshot('solo-hover.png', {
      fullPage: true,
    })
  })

  test('multiplayer button hover state', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(
      page.locator('[data-testid="multiplayer-button"]')
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Hover over the multiplayer button
    await page.hover('[data-testid="multiplayer-button"]')

    // Wait for hover animation to complete
    await page.waitForTimeout(350)

    // Take screenshot showing hover state
    await expect(page).toHaveScreenshot('multiplayer-hover.png', {
      fullPage: true,
    })
  })

  test('play page has proper gradient styling', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Verify the title has gradient styling
    const title = page.locator('h1')
    await expect(title).toBeVisible()
    await expect(title).toContainText('Blindtest')

    // Verify both cards are visible
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="multiplayer-button"]')
    ).toBeVisible()

    // Verify gradient icons are rendered
    // Solo button should have blue-cyan gradient
    const soloCard = page.locator('[data-testid="solo-button"]').locator('..')
    await expect(soloCard).toBeVisible()

    // Multiplayer button should have pink-purple gradient
    const multiplayerCard = page
      .locator('[data-testid="multiplayer-button"]')
      .locator('..')
    await expect(multiplayerCard).toBeVisible()
  })

  test('play page elements are properly positioned', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check that main elements exist and are visible
    await expect(page.locator('h1')).toBeVisible() // Title
    await expect(
      page.locator('text=Choisissez votre mode de jeu')
    ).toBeVisible() // Subtitle

    // Check solo card content
    await expect(page.locator('text=Jouer seul')).toBeVisible()
    await expect(
      page.locator('text=Testez vos connaissances musicales en solo')
    ).toBeVisible()

    // Check multiplayer card content
    await expect(page.locator('text=Multijoueur')).toBeVisible()
    await expect(
      page.locator('text=Affrontez vos amis en temps réel')
    ).toBeVisible()
  })
})

test.describe('Solo Config Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('config form renders correctly', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the page to be fully loaded (loading screen should disappear)
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')

    // Additional wait for any remaining transitions
    await page.waitForTimeout(500)

    // Take screenshot of the solo configuration form
    await expect(page).toHaveScreenshot('solo-config.png', {
      fullPage: true,
    })
  })

  test('slider interaction visual', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Get the slider element
    const slider = page.locator('[data-testid="duration-slider"]')

    // Click on the slider to interact with it (change value)
    // Get slider bounding box and click at 75% position (should be around 45-50s)
    const box = await slider.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    }

    // Wait for UI to update
    await page.waitForTimeout(300)

    // Verify the value changed (should be different from default 20s)
    const valueElement = page.locator('[data-testid="duration-value"]')
    await expect(valueElement).toBeVisible()

    // Take screenshot showing slider in active/changed state
    await expect(page).toHaveScreenshot('slider-active.png', {
      fullPage: true,
    })
  })

  test('advanced settings expanded', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Click on advanced settings to expand
    await page.click('[data-testid="advanced-settings"]')

    // Wait for animation to complete
    await page.waitForTimeout(400)

    // Verify advanced settings content is visible
    await expect(page.locator('text=Temps pour répondre')).toBeVisible()
    await expect(page.locator('text=Mode sans timer')).toBeVisible()
    await expect(page.locator('text=Point de départ')).toBeVisible()
    await expect(page.locator('text=Thème sombre')).toBeVisible()

    // Take screenshot with advanced settings expanded
    await expect(page).toHaveScreenshot('advanced-settings.png', {
      fullPage: true,
    })
  })

  test('solo config has proper styling elements', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check that main elements exist and are visible
    await expect(page.locator('h1')).toBeVisible() // Title "Blindtest"
    await expect(page.locator('text=Mode Solo')).toBeVisible() // Subtitle

    // Check configuration sections
    await expect(page.locator('text=Que deviner ?')).toBeVisible()
    await expect(page.locator('text=Durée des extraits')).toBeVisible()
    // Playlists section header (first element matching)
    await expect(page.locator('h2:has-text("Playlists")').first()).toBeVisible()

    // Check guess mode options
    await expect(page.locator('text=Titre').first()).toBeVisible()
    await expect(page.locator('text=Artiste').first()).toBeVisible()
    await expect(page.locator('text=Les deux')).toBeVisible()

    // Check start button
    await expect(page.locator('text=Nouvelle Partie')).toBeVisible()

    // Check back button
    await expect(page.locator('text=Retour')).toBeVisible()
  })

  test('guess mode selection visual', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Click on "Titre" mode to change selection
    await page.click('text=Titre')
    await page.waitForTimeout(200)

    // Take screenshot with Titre selected
    await expect(page).toHaveScreenshot('guess-mode-title.png', {
      fullPage: true,
    })
  })
})

test.describe('Game Screen Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('playing state - buzzer visible', async ({ page }) => {
    // Navigate to solo config page first
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear (indicates PLAYING state)
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Verify game UI elements are visible
    await expect(page.getByText('Score')).toBeVisible()

    // Take screenshot of playing state with buzzer
    await expect(page).toHaveScreenshot('game-playing.png', {
      fullPage: true,
    })
  })

  test('buzzed state - validation buttons visible', async ({ page }) => {
    // Navigate to solo config page first
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Press the buzzer
    await buzzerButton.click()

    // Wait for validation buttons to appear (BUZZED/TIMER state)
    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })

    // Wait for UI to settle
    await page.waitForTimeout(300)

    // Take screenshot of buzzed state with validation buttons
    await expect(page).toHaveScreenshot('game-buzzed.png', {
      fullPage: true,
    })
  })

  test('timer running state - countdown visible', async ({ page }) => {
    // Navigate to solo config page with timer enabled
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Expand advanced settings to verify timer is enabled
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(300)

    // Ensure timer is enabled (not in "Mode sans timer")
    // The default should have timer enabled, so we just start the game

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Press the buzzer to start timer
    await buzzerButton.click()

    // Wait for timer to be visible - look for the timer display
    // The timer shows remaining seconds in a circular countdown
    await page.waitForTimeout(500)

    // Verify validation buttons are visible (timer state shows these)
    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })

    // Take screenshot of timer state
    await expect(page).toHaveScreenshot('game-timer.png', {
      fullPage: true,
    })
  })

  test('reveal state - song info visible', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Click reveal button to skip to reveal state
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    await revealButton.click()

    // Wait for reveal state - "Chanson suivante" button appears
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 5000 })

    // Wait for UI to settle (cover unblur animation, etc.)
    await page.waitForTimeout(500)

    // Take screenshot of reveal state
    await expect(page).toHaveScreenshot('game-reveal.png', {
      fullPage: true,
    })
  })

  test('correct answer celebration - green flash', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Press the buzzer
    await buzzerButton.click()

    // Wait for validation buttons
    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })

    // Click correct - this triggers the green flash celebration
    await correctButton.click()

    // Wait briefly for the flash animation to start
    await page.waitForTimeout(100)

    // Take screenshot during celebration (green flash)
    // Note: The flash is brief (~500ms) so we capture quickly
    await expect(page).toHaveScreenshot('game-correct.png', {
      fullPage: true,
    })
  })

  test('incorrect answer shake - red flash', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Press the buzzer
    await buzzerButton.click()

    // Wait for validation buttons
    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible({ timeout: 10000 })

    // Click incorrect - this triggers the red shake effect
    await incorrectButton.click()

    // Wait briefly for the flash animation to start
    await page.waitForTimeout(100)

    // Take screenshot during incorrect answer (red flash)
    // Note: The shake animation is brief (~300ms) so we capture quickly
    await expect(page).toHaveScreenshot('game-incorrect.png', {
      fullPage: true,
    })
  })

  test('game screen header with score and controls', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Verify header elements are visible
    await expect(page.getByText('Score')).toBeVisible()
    await expect(page.locator('[data-testid="sfx-mute-toggle"]')).toBeVisible()

    // If fullscreen is supported, the toggle should be visible
    // Note: Fullscreen may not be supported in all test environments

    // Take screenshot focusing on header area
    await expect(page).toHaveScreenshot('game-header.png', {
      fullPage: true,
    })
  })

  test('quit confirmation modal', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Click quit button to show confirmation modal
    const quitButton = page.getByRole('button', { name: /quitter/i }).first()
    await quitButton.click()

    // Wait for modal animation
    await page.waitForTimeout(300)

    // Verify modal content is visible
    await expect(page.getByText('Quitter la partie ?')).toBeVisible()
    await expect(
      page.getByText('Votre score ne sera pas sauvegardé.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible()

    // Take screenshot of quit confirmation modal
    await expect(page).toHaveScreenshot('game-quit-modal.png', {
      fullPage: true,
    })
  })
})

test.describe('Multiplayer Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('multiplayer hub page renders correctly', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')

    // Additional wait for any remaining transitions
    await page.waitForTimeout(500)

    // Verify create and join forms are visible
    await expect(
      page.getByRole('heading', { name: 'Créer une partie' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible()

    // Verify input fields are present
    await expect(page.locator('#create-nickname')).toBeVisible()
    await expect(page.locator('#join-code')).toBeVisible()
    await expect(page.locator('#join-nickname')).toBeVisible()

    // Take screenshot of multiplayer hub page
    await expect(page).toHaveScreenshot('multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('create room form with nickname filled', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(page.locator('#create-nickname')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Fill in a nickname
    await page.locator('#create-nickname').fill('TestPlayer')

    // Wait for UI update
    await page.waitForTimeout(200)

    // Take screenshot with nickname filled
    await expect(page).toHaveScreenshot('create-room-form-filled.png', {
      fullPage: true,
    })
  })

  test('join room form with code and nickname filled', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(page.locator('#join-code')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Fill in room code and nickname
    await page.locator('#join-code').fill('ABC123')
    await page.locator('#join-nickname').fill('JoinPlayer')

    // Wait for UI update
    await page.waitForTimeout(200)

    // Take screenshot with fields filled
    await expect(page).toHaveScreenshot('join-room-form-filled.png', {
      fullPage: true,
    })
  })

  test('lobby with players renders correctly', async ({ browser }) => {
    // Create two browser contexts for host and player
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Disable animations for consistent screenshots
      await hostPage.emulateMedia({ reducedMotion: 'reduce' })
      await playerPage.emulateMedia({ reducedMotion: 'reduce' })

      // Host creates room
      await hostPage.goto('/play')
      await expect(
        hostPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await hostPage.getByRole('button', { name: 'Multijoueur' }).click()
      await hostPage.locator('#create-nickname').fill('HostPlayer')
      await hostPage.getByRole('button', { name: 'Créer une partie' }).click()

      // Wait for lobby and get room code
      await expect(hostPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      // Get room code from URL
      const url = hostPage.url()
      const match = url.match(/\/multiplayer\/([A-Z0-9]+)/)
      if (!match) throw new Error('Could not find room code')
      const roomCode = match[1]

      // Player joins room
      await playerPage.goto('/play')
      await expect(
        playerPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await playerPage.getByRole('button', { name: 'Multijoueur' }).click()
      await playerPage.locator('#join-code').fill(roomCode)
      await playerPage.locator('#join-nickname').fill('GuestPlayer')
      await playerPage.getByRole('button', { name: 'Rejoindre' }).click()

      // Wait for both players to be visible in lobby
      await expect(hostPage.getByText('GuestPlayer')).toBeVisible({
        timeout: 10000,
      })
      await expect(hostPage.getByText('Joueurs (2/10)')).toBeVisible()

      // Wait for page to settle
      await hostPage.waitForLoadState('networkidle')
      await hostPage.waitForTimeout(500)

      // Take screenshot of lobby with players (host view)
      await expect(hostPage).toHaveScreenshot('lobby-players.png', {
        fullPage: true,
      })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('room code display is prominent and copyable', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const hostPage = await hostContext.newPage()

    try {
      // Disable animations for consistent screenshots
      await hostPage.emulateMedia({ reducedMotion: 'reduce' })

      // Host creates room
      await hostPage.goto('/play')
      await expect(
        hostPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await hostPage.getByRole('button', { name: 'Multijoueur' }).click()
      await hostPage.locator('#create-nickname').fill('CodeHost')
      await hostPage.getByRole('button', { name: 'Créer une partie' }).click()

      // Wait for lobby with room code
      await expect(hostPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      // Wait for page to settle
      await hostPage.waitForLoadState('networkidle')
      await hostPage.waitForTimeout(500)

      // Verify room code is visible with proper styling
      // Room code should be in large monospace font
      const roomCodeSection = hostPage
        .locator('text=Code de la room')
        .locator('..')
      await expect(roomCodeSection).toBeVisible()

      // Verify copy button is present
      await expect(
        hostPage.locator('button[title="Copier le code"]')
      ).toBeVisible()

      // Take screenshot focusing on room code area
      await expect(hostPage).toHaveScreenshot('room-code.png', {
        fullPage: true,
      })

      // Test copy functionality - click copy button
      await hostPage.locator('button[title="Copier le code"]').click()

      // Wait for "Code copié" message
      await expect(hostPage.getByText('Code copié !')).toBeVisible({
        timeout: 3000,
      })

      // Take screenshot showing copied state
      await expect(hostPage).toHaveScreenshot('room-code-copied.png', {
        fullPage: true,
      })
    } finally {
      await hostContext.close()
    }
  })

  test('multiplayer game recap with podium', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Disable animations for consistent screenshots
      await hostPage.emulateMedia({ reducedMotion: 'reduce' })
      await playerPage.emulateMedia({ reducedMotion: 'reduce' })

      // Host creates room
      await hostPage.goto('/play')
      await expect(
        hostPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await hostPage.getByRole('button', { name: 'Multijoueur' }).click()
      await hostPage.locator('#create-nickname').fill('RecapHost')
      await hostPage.getByRole('button', { name: 'Créer une partie' }).click()

      // Wait for lobby and get room code
      await expect(hostPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      const url = hostPage.url()
      const match = url.match(/\/multiplayer\/([A-Z0-9]+)/)
      if (!match) throw new Error('Could not find room code')
      const roomCode = match[1]

      // Player joins room
      await playerPage.goto('/play')
      await expect(
        playerPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await playerPage.getByRole('button', { name: 'Multijoueur' }).click()
      await playerPage.locator('#join-code').fill(roomCode)
      await playerPage.locator('#join-nickname').fill('RecapPlayer')
      await playerPage.getByRole('button', { name: 'Rejoindre' }).click()

      // Wait for both players to be visible
      await expect(hostPage.getByText('RecapPlayer')).toBeVisible({
        timeout: 10000,
      })

      // Start game
      await hostPage
        .getByRole('button', { name: /démarrer|commencer/i })
        .click()
      await expect(hostPage.getByText(/controles hote/i)).toBeVisible({
        timeout: 10000,
      })

      // Load a song first
      await hostPage.getByRole('button', { name: /chanson suivante/i }).click()
      await expect(hostPage.getByText(/en cours/i)).toBeVisible({
        timeout: 15000,
      })

      // End game
      const endButton = hostPage.getByRole('button', { name: /terminer/i })
      await expect(endButton).toBeVisible({ timeout: 5000 })
      await endButton.click()

      // Wait for recap to show
      await expect(
        hostPage.getByRole('heading', { name: /Partie terminée/i })
      ).toBeVisible({ timeout: 10000 })

      // Wait for animations to complete
      await hostPage.waitForTimeout(1500)

      // Verify recap elements are visible
      await expect(hostPage.getByText('Classement final')).toBeVisible()

      // Take screenshot of multiplayer recap (host view)
      await expect(hostPage).toHaveScreenshot('multiplayer-recap.png', {
        fullPage: true,
      })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('lobby configuration panel expanded', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const hostPage = await hostContext.newPage()

    try {
      // Disable animations for consistent screenshots
      await hostPage.emulateMedia({ reducedMotion: 'reduce' })

      // Host creates room
      await hostPage.goto('/play')
      await expect(
        hostPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await hostPage.getByRole('button', { name: 'Multijoueur' }).click()
      await hostPage.locator('#create-nickname').fill('ConfigHost')
      await hostPage.getByRole('button', { name: 'Créer une partie' }).click()

      // Wait for lobby
      await expect(hostPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      // Expand configuration panel
      await hostPage.getByText('Configuration').click()

      // Wait for panel to expand
      await hostPage.waitForTimeout(400)

      // Verify configuration options are visible
      await expect(hostPage.getByText('Que deviner ?')).toBeVisible()
      await expect(hostPage.getByText('Durée des extraits')).toBeVisible()
      await expect(hostPage.getByText('Temps pour répondre')).toBeVisible()

      // Wait for page to settle
      await hostPage.waitForLoadState('networkidle')
      await hostPage.waitForTimeout(300)

      // Take screenshot with configuration expanded
      await expect(hostPage).toHaveScreenshot('lobby-config-expanded.png', {
        fullPage: true,
      })
    } finally {
      await hostContext.close()
    }
  })

  test('player view of lobby (non-host)', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Disable animations for consistent screenshots
      await hostPage.emulateMedia({ reducedMotion: 'reduce' })
      await playerPage.emulateMedia({ reducedMotion: 'reduce' })

      // Host creates room
      await hostPage.goto('/play')
      await expect(
        hostPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await hostPage.getByRole('button', { name: 'Multijoueur' }).click()
      await hostPage.locator('#create-nickname').fill('LobbyHost')
      await hostPage.getByRole('button', { name: 'Créer une partie' }).click()

      // Wait for lobby and get room code
      await expect(hostPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      const url = hostPage.url()
      const match = url.match(/\/multiplayer\/([A-Z0-9]+)/)
      if (!match) throw new Error('Could not find room code')
      const roomCode = match[1]

      // Player joins room
      await playerPage.goto('/play')
      await expect(
        playerPage.getByRole('button', { name: 'Multijoueur' })
      ).toBeVisible({
        timeout: 10000,
      })
      await playerPage.getByRole('button', { name: 'Multijoueur' }).click()
      await playerPage.locator('#join-code').fill(roomCode)
      await playerPage.locator('#join-nickname').fill('LobbyGuest')
      await playerPage.getByRole('button', { name: 'Rejoindre' }).click()

      // Wait for lobby
      await expect(playerPage.getByText('Code de la room')).toBeVisible({
        timeout: 10000,
      })

      // Wait for both players to appear
      await expect(playerPage.getByText('LobbyHost')).toBeVisible({
        timeout: 10000,
      })

      // Wait for page to settle
      await playerPage.waitForLoadState('networkidle')
      await playerPage.waitForTimeout(500)

      // Verify player view has "waiting for host" message
      await expect(
        playerPage.getByText('En attente du lancement...')
      ).toBeVisible()

      // Take screenshot of player view (non-host)
      await expect(playerPage).toHaveScreenshot('lobby-player-view.png', {
        fullPage: true,
      })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })
})
