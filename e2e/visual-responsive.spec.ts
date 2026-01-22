import { test, expect } from '@playwright/test'

/**
 * Responsive Visual Tests
 *
 * Tests visual layouts across different device sizes:
 * - Mobile Portrait: iPhone SE (375x667), iPhone 12 (390x844)
 * - Mobile Landscape: iPhone SE (667x375), iPhone 12 (844x390)
 * - Tablet: iPad (768x1024), iPad Pro (1024x1366)
 * - Desktop: (to be added in 16.9)
 *
 * Run with --update-snapshots to generate/update baseline screenshots:
 *   npx playwright test e2e/visual-responsive.spec.ts --update-snapshots
 */

test.describe('Mobile Portrait - iPhone SE (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page on mobile', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page on iPhone SE
    await expect(page).toHaveScreenshot('mobile-se-play.png', {
      fullPage: true,
    })
  })

  test('solo config page on mobile', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of solo config page on iPhone SE
    await expect(page).toHaveScreenshot('mobile-se-solo-config.png', {
      fullPage: true,
    })
  })

  test('game screen on mobile - buzzer visible', async ({ page }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen on iPhone SE
    await expect(page).toHaveScreenshot('mobile-se-game.png', {
      fullPage: true,
    })
  })

  test('buzzer button size on mobile meets minimum 44px', async ({ page }) => {
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

    // Get buzzer button bounding box
    const box = await buzzerButton.boundingBox()

    // Verify buzzer is at least 44px (WCAG minimum touch target size)
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // In fact, our buzzer should be much larger (160px / 192px)
    expect(box!.width).toBeGreaterThanOrEqual(120)
    expect(box!.height).toBeGreaterThanOrEqual(120)

    // Take screenshot focusing on buzzer
    await expect(page).toHaveScreenshot('mobile-se-buzzer.png', {
      fullPage: true,
    })
  })

  test('multiplayer hub on mobile', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of multiplayer hub on iPhone SE
    await expect(page).toHaveScreenshot('mobile-se-multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('game reveal state on mobile', async ({ page }) => {
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

    // Take screenshot of reveal state on iPhone SE
    await expect(page).toHaveScreenshot('mobile-se-game-reveal.png', {
      fullPage: true,
    })
  })
})

test.describe('Mobile Portrait - iPhone 12 (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page on iPhone 12', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page on iPhone 12
    await expect(page).toHaveScreenshot('mobile-12-play.png', {
      fullPage: true,
    })
  })

  test('solo config page on iPhone 12', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of solo config page on iPhone 12
    await expect(page).toHaveScreenshot('mobile-12-solo-config.png', {
      fullPage: true,
    })
  })

  test('game screen on iPhone 12 - buzzer visible', async ({ page }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen on iPhone 12
    await expect(page).toHaveScreenshot('mobile-12-game.png', {
      fullPage: true,
    })
  })

  test('buzzer button size on iPhone 12 meets minimum 44px', async ({
    page,
  }) => {
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

    // Get buzzer button bounding box
    const box = await buzzerButton.boundingBox()

    // Verify buzzer is at least 44px (WCAG minimum touch target size)
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // In fact, our buzzer should be much larger (160px / 192px)
    expect(box!.width).toBeGreaterThanOrEqual(120)
    expect(box!.height).toBeGreaterThanOrEqual(120)

    // Take screenshot focusing on buzzer
    await expect(page).toHaveScreenshot('mobile-12-buzzer.png', {
      fullPage: true,
    })
  })

  test('multiplayer hub on iPhone 12', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of multiplayer hub on iPhone 12
    await expect(page).toHaveScreenshot('mobile-12-multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('game reveal state on iPhone 12', async ({ page }) => {
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

    // Take screenshot of reveal state on iPhone 12
    await expect(page).toHaveScreenshot('mobile-12-game-reveal.png', {
      fullPage: true,
    })
  })

  test('advanced settings expanded on iPhone 12', async ({ page }) => {
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

    // Take screenshot with advanced settings expanded
    await expect(page).toHaveScreenshot('mobile-12-advanced-settings.png', {
      fullPage: true,
    })
  })
})

test.describe('Mobile Landscape - iPhone SE (667x375)', () => {
  test.use({ viewport: { width: 667, height: 375 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page in landscape', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page in landscape
    await expect(page).toHaveScreenshot('landscape-se-play.png', {
      fullPage: true,
    })
  })

  test('solo config page in landscape', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of solo config page in landscape
    await expect(page).toHaveScreenshot('landscape-se-solo-config.png', {
      fullPage: true,
    })
  })

  test('game screen in landscape - all controls visible', async ({ page }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen in landscape
    await expect(page).toHaveScreenshot('landscape-se-game.png', {
      fullPage: true,
    })
  })

  test('game controls visible and accessible in landscape', async ({
    page,
  }) => {
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

    // Verify buzzer button is visible and properly sized
    const buzzerBox = await buzzerButton.boundingBox()
    expect(buzzerBox!.width).toBeGreaterThanOrEqual(44)
    expect(buzzerBox!.height).toBeGreaterThanOrEqual(44)

    // Verify reveal button is visible and accessible
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    const revealBox = await revealButton.boundingBox()
    expect(revealBox!.width).toBeGreaterThanOrEqual(44)
    expect(revealBox!.height).toBeGreaterThanOrEqual(44)

    // Verify quit button is visible
    const quitButton = page.getByRole('button', { name: 'Quitter' })
    await expect(quitButton).toBeVisible()

    // Take screenshot showing all controls in landscape
    await expect(page).toHaveScreenshot('landscape-se-controls.png', {
      fullPage: true,
    })
  })

  test('no horizontal scrolling in landscape', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Get the scroll width and client width
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      )
    })

    // Verify no horizontal scrolling
    expect(hasHorizontalScroll).toBe(false)
  })

  test('multiplayer hub in landscape', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of multiplayer hub in landscape
    await expect(page).toHaveScreenshot('landscape-se-multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('game reveal state in landscape', async ({ page }) => {
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

    // Take screenshot of reveal state in landscape
    await expect(page).toHaveScreenshot('landscape-se-game-reveal.png', {
      fullPage: true,
    })
  })
})

test.describe('Mobile Landscape - iPhone 12 (844x390)', () => {
  test.use({ viewport: { width: 844, height: 390 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page on iPhone 12 landscape', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page on iPhone 12 landscape
    await expect(page).toHaveScreenshot('landscape-12-play.png', {
      fullPage: true,
    })
  })

  test('game screen on iPhone 12 landscape - all controls visible', async ({
    page,
  }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen on iPhone 12 landscape
    await expect(page).toHaveScreenshot('landscape-12-game.png', {
      fullPage: true,
    })
  })

  test('no horizontal scrolling on iPhone 12 landscape', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Get the scroll width and client width
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      )
    })

    // Verify no horizontal scrolling
    expect(hasHorizontalScroll).toBe(false)
  })

  test('game reveal state on iPhone 12 landscape', async ({ page }) => {
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

    // Take screenshot of reveal state on iPhone 12 landscape
    await expect(page).toHaveScreenshot('landscape-12-game-reveal.png', {
      fullPage: true,
    })
  })
})

test.describe('Mobile Landscape - Touch Targets', () => {
  test.use({ viewport: { width: 667, height: 375 } })

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('buzzer button meets minimum touch target in landscape', async ({
    page,
  }) => {
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

    // Get buzzer button bounding box
    const box = await buzzerButton.boundingBox()

    // Verify buzzer is at least 44px (WCAG minimum touch target size)
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // Buzzer should still be reasonably large in landscape
    expect(box!.width).toBeGreaterThanOrEqual(100)
    expect(box!.height).toBeGreaterThanOrEqual(100)
  })

  test('control buttons meet minimum touch target in landscape', async ({
    page,
  }) => {
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

    // Check reveal button touch target
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    const revealBox = await revealButton.boundingBox()
    expect(revealBox!.width).toBeGreaterThanOrEqual(44)
    expect(revealBox!.height).toBeGreaterThanOrEqual(44)

    // Press buzzer and check validation buttons
    await buzzerButton.click()

    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })
    const correctBox = await correctButton.boundingBox()
    expect(correctBox!.width).toBeGreaterThanOrEqual(44)
    expect(correctBox!.height).toBeGreaterThanOrEqual(44)

    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible()
    const incorrectBox = await incorrectButton.boundingBox()
    expect(incorrectBox!.width).toBeGreaterThanOrEqual(44)
    expect(incorrectBox!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Tablet - iPad (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page on iPad', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page on iPad
    await expect(page).toHaveScreenshot('tablet-ipad-play.png', {
      fullPage: true,
    })
  })

  test('solo config page on iPad', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of solo config page on iPad
    await expect(page).toHaveScreenshot('tablet-ipad-solo-config.png', {
      fullPage: true,
    })
  })

  test('game screen on iPad - optimal space usage', async ({ page }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen on iPad
    await expect(page).toHaveScreenshot('tablet-ipad-game.png', {
      fullPage: true,
    })
  })

  test('multiplayer hub on iPad', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of multiplayer hub on iPad
    await expect(page).toHaveScreenshot('tablet-ipad-multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('game reveal state on iPad', async ({ page }) => {
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

    // Take screenshot of reveal state on iPad
    await expect(page).toHaveScreenshot('tablet-ipad-game-reveal.png', {
      fullPage: true,
    })
  })

  test('advanced settings expanded on iPad', async ({ page }) => {
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

    // Take screenshot with advanced settings expanded
    await expect(page).toHaveScreenshot('tablet-ipad-advanced-settings.png', {
      fullPage: true,
    })
  })

  test('verifies optimal space utilization on iPad', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Verify no horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      )
    })
    expect(hasHorizontalScroll).toBe(false)

    // Verify buttons are appropriately sized for tablet
    const soloButton = page.locator('[data-testid="solo-button"]')
    const soloBox = await soloButton.boundingBox()
    expect(soloBox!.width).toBeGreaterThanOrEqual(200) // Tablet buttons should be larger
    expect(soloBox!.height).toBeGreaterThanOrEqual(60)
  })
})

test.describe('Tablet - iPad Pro (1024x1366)', () => {
  test.use({ viewport: { width: 1024, height: 1366 } })

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play selection page on iPad Pro', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page on iPad Pro
    await expect(page).toHaveScreenshot('tablet-ipad-pro-play.png', {
      fullPage: true,
    })
  })

  test('solo config page on iPad Pro', async ({ page }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of solo config page on iPad Pro
    await expect(page).toHaveScreenshot('tablet-ipad-pro-solo-config.png', {
      fullPage: true,
    })
  })

  test('game screen on iPad Pro - optimal space usage', async ({ page }) => {
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

    // Wait for all UI elements to settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of game screen on iPad Pro
    await expect(page).toHaveScreenshot('tablet-ipad-pro-game.png', {
      fullPage: true,
    })
  })

  test('multiplayer hub on iPad Pro', async ({ page }) => {
    await page.goto('/multiplayer')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of multiplayer hub on iPad Pro
    await expect(page).toHaveScreenshot('tablet-ipad-pro-multiplayer-hub.png', {
      fullPage: true,
    })
  })

  test('game reveal state on iPad Pro', async ({ page }) => {
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

    // Take screenshot of reveal state on iPad Pro
    await expect(page).toHaveScreenshot('tablet-ipad-pro-game-reveal.png', {
      fullPage: true,
    })
  })

  test('verifies optimal space utilization on iPad Pro', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Verify no horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      )
    })
    expect(hasHorizontalScroll).toBe(false)

    // Verify buttons are appropriately sized for tablet
    const soloButton = page.locator('[data-testid="solo-button"]')
    const soloBox = await soloButton.boundingBox()
    expect(soloBox!.width).toBeGreaterThanOrEqual(200) // Tablet buttons should be larger
    expect(soloBox!.height).toBeGreaterThanOrEqual(60)
  })
})

test.describe('Tablet - Touch Targets', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('buzzer button meets minimum touch target on tablet', async ({
    page,
  }) => {
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

    // Get buzzer button bounding box
    const box = await buzzerButton.boundingBox()

    // Verify buzzer is at least 44px (WCAG minimum touch target size)
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // Buzzer should be even larger on tablet
    expect(box!.width).toBeGreaterThanOrEqual(150)
    expect(box!.height).toBeGreaterThanOrEqual(150)
  })

  test('control buttons meet minimum touch target on tablet', async ({
    page,
  }) => {
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

    // Check reveal button touch target
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    const revealBox = await revealButton.boundingBox()
    expect(revealBox!.width).toBeGreaterThanOrEqual(44)
    expect(revealBox!.height).toBeGreaterThanOrEqual(44)

    // Press buzzer and check validation buttons
    await buzzerButton.click()

    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })
    const correctBox = await correctButton.boundingBox()
    expect(correctBox!.width).toBeGreaterThanOrEqual(44)
    expect(correctBox!.height).toBeGreaterThanOrEqual(44)

    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible()
    const incorrectBox = await incorrectButton.boundingBox()
    expect(incorrectBox!.width).toBeGreaterThanOrEqual(44)
    expect(incorrectBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('all major buttons on play page meet touch target on tablet', async ({
    page,
  }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check solo button touch target
    const soloButton = page.locator('[data-testid="solo-button"]')
    const soloBox = await soloButton.boundingBox()
    expect(soloBox!.width).toBeGreaterThanOrEqual(44)
    expect(soloBox!.height).toBeGreaterThanOrEqual(44)

    // Check multiplayer button touch target
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')
    const multiplayerBox = await multiplayerButton.boundingBox()
    expect(multiplayerBox!.width).toBeGreaterThanOrEqual(44)
    expect(multiplayerBox!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Mobile Portrait - Touch Targets', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('all major buttons meet 44px minimum touch target on play page', async ({
    page,
  }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check solo button touch target
    const soloButton = page.locator('[data-testid="solo-button"]')
    const soloBox = await soloButton.boundingBox()
    expect(soloBox!.width).toBeGreaterThanOrEqual(44)
    expect(soloBox!.height).toBeGreaterThanOrEqual(44)

    // Check multiplayer button touch target
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')
    const multiplayerBox = await multiplayerButton.boundingBox()
    expect(multiplayerBox!.width).toBeGreaterThanOrEqual(44)
    expect(multiplayerBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('control buttons in game meet minimum touch target', async ({
    page,
  }) => {
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

    // Check reveal button touch target
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
    const revealBox = await revealButton.boundingBox()
    expect(revealBox!.width).toBeGreaterThanOrEqual(44)
    expect(revealBox!.height).toBeGreaterThanOrEqual(44)

    // Press buzzer and check validation buttons
    await buzzerButton.click()

    const correctButton = page.getByRole('button', { name: 'Correct' })
    await expect(correctButton).toBeVisible({ timeout: 10000 })
    const correctBox = await correctButton.boundingBox()
    expect(correctBox!.width).toBeGreaterThanOrEqual(44)
    expect(correctBox!.height).toBeGreaterThanOrEqual(44)

    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible()
    const incorrectBox = await incorrectButton.boundingBox()
    expect(incorrectBox!.width).toBeGreaterThanOrEqual(44)
    expect(incorrectBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('start button on solo config meets minimum touch target', async ({
    page,
  }) => {
    await page.goto('/solo')

    // Wait for the config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check start button touch target
    const startButton = page.locator('button:has-text("Nouvelle Partie")')
    const startBox = await startButton.boundingBox()
    expect(startBox!.width).toBeGreaterThanOrEqual(44)
    expect(startBox!.height).toBeGreaterThanOrEqual(44)

    // Check back button touch target
    const backButton = page.locator('button:has-text("Retour")')
    const backBox = await backButton.boundingBox()
    expect(backBox!.width).toBeGreaterThanOrEqual(44)
    expect(backBox!.height).toBeGreaterThanOrEqual(44)
  })
})
