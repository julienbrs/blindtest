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
