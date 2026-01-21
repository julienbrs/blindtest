import { test, expect } from '@playwright/test'

test.describe('Blindtest Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for the "Nouvelle Partie" button to appear (indicates loading complete)
    await expect(
      page.getByRole('button', { name: 'Nouvelle Partie' })
    ).toBeVisible({ timeout: 30000 })

    // Additional wait for any animations to complete
    await page.waitForTimeout(500)
  })

  test("devrait afficher la page d'accueil correctement", async ({ page }) => {
    // Verify homepage loads with title
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Blindtest'
    )

    // Verify configuration form is visible
    await expect(page.getByText('Que deviner ?')).toBeVisible()
    await expect(page.getByText('Durée des extraits')).toBeVisible()

    // Verify start button exists
    await expect(
      page.getByRole('button', { name: 'Nouvelle Partie' })
    ).toBeVisible()
  })

  test('devrait permettre de configurer le mode de devinette', async ({
    page,
  }) => {
    // Click on title mode (label says "Titre")
    await page.getByText('Titre', { exact: true }).click()

    // Click on artist mode (label says "Artiste")
    await page.getByText('Artiste', { exact: true }).click()

    // Click on both mode
    await page.getByText('Les deux').click()

    // All modes should be clickable without error
    await expect(page.getByText('Les deux')).toBeVisible()
  })

  test('devrait permettre de configurer la durée des extraits', async ({
    page,
  }) => {
    // Find and interact with duration slider
    const slider = page.locator('input[type="range"]').first()
    await expect(slider).toBeVisible()

    // Slider should have min and max values
    await expect(slider).toHaveAttribute('min', '5')
    await expect(slider).toHaveAttribute('max', '60')
  })

  // Note: This test is flaky due to audio loading timing variability
  test.fixme('devrait pouvoir jouer une partie complète', async ({ page }) => {
    // 1. Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()

    // 2. Wait for game page to load
    await page.waitForURL('/game*')

    // Wait a moment for the page to settle
    await page.waitForTimeout(1000)

    // 3. Wait for the buzzer to appear (indicates audio loaded and game is playing)
    // or wait for any game UI element that indicates the game started
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    try {
      await expect(buzzerButton).toBeVisible({ timeout: 45000 })
    } catch {
      // Take screenshot for debugging if buzzer doesn't appear
      await page.screenshot({ path: 'test-results/debug-no-buzzer.png' })
      throw new Error('Buzzer not visible within timeout')
    }

    // 4. Verify game UI elements are visible
    await expect(page.getByText('Score')).toBeVisible()

    // 5. Press buzzer and validate
    await buzzerButton.click()
    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })
    await correctButton.click()

    // 6. Wait for next song button to appear (indicates answer was processed)
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 5000 })

    // 7. Quit game
    const quitButton = page.getByRole('button', { name: /quitter/i }).first()
    await quitButton.click()

    // 8. Confirm quit in modal
    await page.waitForTimeout(500) // Wait for modal animation
    const confirmQuitButton = page
      .locator('button')
      .filter({ hasText: /^quitter$/i })
      .last()
    await confirmQuitButton.click()

    // 9. Should be back on homepage
    await page.waitForURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Blindtest'
    )
  })

  test('devrait pouvoir révéler la réponse sans buzzer', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear (indicates game is ready)
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 30000 })

    // Click reveal button
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    await revealButton.click()

    // Song info should be visible (album cover should be clear)
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible()
  })

  test('devrait valider une réponse incorrecte', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 30000 })

    // Buzz
    await buzzerButton.click()

    // Click incorrect
    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible({ timeout: 5000 })
    await incorrectButton.click()

    // Next song button should appear
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible()
  })

  // Note: This test is flaky due to audio loading timing variability
  test.fixme("devrait permettre de rejouer l'extrait", async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 30000 })

    // Reveal the answer first
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    await revealButton.click()

    // Replay button should be visible in reveal state
    const replayButton = page.getByRole('button', {
      name: /rejouer/i,
    })
    await expect(replayButton).toBeVisible()
    await replayButton.click()

    // After replay, we should still be able to see next song button
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible()
  })

  test('devrait afficher les paramètres avancés', async ({ page }) => {
    // Click on advanced settings
    const advancedButton = page.getByText('Paramètres avancés')
    await expect(advancedButton).toBeVisible()
    await advancedButton.click()

    // Timer duration options should be visible
    await expect(page.getByText('Temps pour répondre')).toBeVisible()

    // No timer toggle should be visible
    await expect(page.getByText('Mode sans timer')).toBeVisible()

    // Start position options should be visible
    await expect(page.getByText('Point de départ')).toBeVisible()
  })
})

test.describe('Blindtest Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test("devrait s'afficher correctement sur mobile", async ({ page }) => {
    await page.goto('/')

    // Wait for "Nouvelle Partie" button to appear
    const startButton = page.getByRole('button', { name: 'Nouvelle Partie' })
    await expect(startButton).toBeVisible({ timeout: 30000 })

    // Homepage should be responsive
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Start game
    await startButton.click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear (indicates game is ready)
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 30000 })

    // Game elements should be visible on mobile
    await expect(page.getByText('Score')).toBeVisible()

    // Get buzzer bounding box to check size - on mobile it should be at least 128px (h-32)
    const box = await buzzer.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(100) // At least 100px wide on mobile
    expect(box!.height).toBeGreaterThanOrEqual(100) // At least 100px tall on mobile
  })

  test('devrait avoir des zones tactiles suffisantes', async ({ page }) => {
    await page.goto('/')

    // Wait for "Nouvelle Partie" button to appear
    const startButton = page.getByRole('button', { name: 'Nouvelle Partie' })
    await expect(startButton).toBeVisible({ timeout: 30000 })
    await page.waitForTimeout(500) // Wait for any animations

    // Start button should be large enough for touch (44px minimum per Apple guidelines)
    const startBox = await startButton.boundingBox()
    expect(startBox).not.toBeNull()
    expect(startBox!.height).toBeGreaterThanOrEqual(44)

    // Start game and check game buttons
    await startButton.click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Buzzer should be large enough for touch
    const buzzerBox = await buzzer.boundingBox()
    expect(buzzerBox).not.toBeNull()
    expect(buzzerBox!.width).toBeGreaterThanOrEqual(100)
    expect(buzzerBox!.height).toBeGreaterThanOrEqual(100)
  })
})

test.describe('Blindtest Tablet Experience', () => {
  test.use({ viewport: { width: 768, height: 1024 } }) // iPad

  test('devrait utiliser le layout tablette', async ({ page }) => {
    await page.goto('/')

    // Wait for "Nouvelle Partie" button to appear
    await expect(
      page.getByRole('button', { name: 'Nouvelle Partie' })
    ).toBeVisible({ timeout: 30000 })

    // Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 30000 })

    // Game elements should be visible
    await expect(page.getByText('Score')).toBeVisible()
  })
})
