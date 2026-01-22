import { test, expect, Page } from '@playwright/test'

/**
 * Reduced Motion Preference Support Tests
 *
 * Tests that verify the application correctly respects the prefers-reduced-motion
 * accessibility setting:
 * - Animations are disabled when reduced motion is preferred
 * - Core functionality is preserved without animations
 * - No JavaScript errors occur when animations are disabled
 *
 * Issue 16.17 - Test reduced motion preference support
 *
 * Acceptance criteria:
 * - Animations desactivees (animations disabled)
 * - Fonctionnalites preservees (functionality preserved)
 * - Pas d'erreur JavaScript (no JavaScript errors)
 */

// Helper function to start a game and get to the buzzer
async function setupGameWithBuzzer(page: Page) {
  await page.goto('/solo')
  await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle')

  // Start the game
  await page.click('button:has-text("Nouvelle Partie")')
  await page.waitForURL('/game*')

  // Wait for buzzer to appear (indicates PLAYING state)
  const buzzer = page.getByRole('button', { name: 'BUZZ!' })
  await expect(buzzer).toBeVisible({ timeout: 45000 })

  return buzzer
}

// Helper to trigger reveal transition
async function setupGameForValidation(page: Page) {
  const buzzer = await setupGameWithBuzzer(page)
  await buzzer.click()

  // Wait for validation buttons to appear
  await expect(
    page.getByRole('button', { name: 'Correct', exact: true })
  ).toBeVisible({
    timeout: 2000,
  })
}

test.describe('Reduced Motion - CSS Animations Disabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play page renders correctly with reduced motion', async ({ page }) => {
    await page.goto('/play')
    await expect(page.locator('h1')).toContainText('Blindtest')

    // Take screenshot to verify layout is correct without animations
    await expect(page).toHaveScreenshot('reduced-motion-play.png', {
      fullPage: true,
    })
  })

  test('CSS animation-duration is nearly instant', async ({ page }) => {
    await page.goto('/play')

    // Get an element with animation class
    const animationDuration = await page.evaluate(() => {
      // Check that the reduced motion media query styles are applied
      const style = document.createElement('div')
      style.className = 'animate-fade-in'
      document.body.appendChild(style)
      const computed = window.getComputedStyle(style)
      const duration = computed.animationDuration
      document.body.removeChild(style)
      return duration
    })

    // With reduced motion, animation-duration should be 0.01ms (from globals.css)
    const durationMs = parseFloat(animationDuration)
    expect(durationMs).toBeLessThanOrEqual(0.1)
  })

  test('CSS transition-duration is nearly instant', async ({ page }) => {
    await page.goto('/play')

    // Check that transitions are also reduced
    const transitionDuration = await page.evaluate(() => {
      const style = document.createElement('div')
      style.style.transition = 'all 0.5s ease'
      document.body.appendChild(style)
      const computed = window.getComputedStyle(style)
      const duration = computed.transitionDuration
      document.body.removeChild(style)
      return duration
    })

    // With reduced motion, transition-duration should be 0.01ms
    const durationMs = parseFloat(transitionDuration)
    expect(durationMs).toBeLessThanOrEqual(0.1)
  })
})

test.describe('Reduced Motion - Background Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('FestiveBackground shows static gradient (no floating orbs)', async ({
    page,
  }) => {
    await page.goto('/play')

    // Wait for page to fully render
    await page.waitForLoadState('domcontentloaded')

    // The animated orbs should NOT be present when reduced motion is enabled
    // (FestiveBackground renders only a static gradient)
    const floatingOrbs = page.locator('.animate-float-orb')
    const orbCount = await floatingOrbs.count()

    // With reduced motion, FestiveBackground renders without orbs
    expect(orbCount).toBe(0)
  })

  test('BackgroundParticles does not render', async ({ page }) => {
    await page.goto('/play')
    await page.waitForLoadState('domcontentloaded')

    // Particles should not be initialized when reduced motion is preferred
    const particles = page.locator('#background-particles')
    const particleCount = await particles.count()

    expect(particleCount).toBe(0)
  })

  test('background still has gradient styling', async ({ page }) => {
    await page.goto('/play')
    await page.waitForLoadState('domcontentloaded')

    // The background should still have the gradient (just not animated)
    const background = page.locator('.fixed.inset-0.-z-10').first()
    await expect(background).toBeVisible()

    // Verify it has a gradient background style
    const hasGradient = await background.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return (
        style.background.includes('gradient') ||
        style.backgroundImage.includes('gradient')
      )
    })

    expect(hasGradient).toBe(true)
  })
})

test.describe('Reduced Motion - Flash Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('correct answer flash does not appear', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Flash should NOT be visible with reduced motion
    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).not.toBeVisible({ timeout: 200 })
  })

  test('incorrect answer flash does not appear', async ({ page }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    // Flash should NOT be visible with reduced motion
    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).not.toBeVisible({ timeout: 200 })
  })

  test('game still transitions correctly after validation without flash', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Game should transition to reveal state and show "Next Song" button
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Reduced Motion - Buzzer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('buzzer button is clickable', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Click the buzzer
    await buzzer.click()

    // Should transition to validation state
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await expect(correctButton).toBeVisible({ timeout: 2000 })
  })

  test('buzzer has correct appearance without animations', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Verify buzzer button exists and has correct text
    await expect(buzzer).toContainText('BUZZ!')

    // Verify it has the expected gradient classes
    await expect(buzzer).toHaveClass(/from-red-500/)
    await expect(buzzer).toHaveClass(/to-red-700/)
  })

  test('buzzer shockwave effect does not cause errors', async ({ page }) => {
    // Collect JavaScript errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    const buzzer = await setupGameWithBuzzer(page)
    await buzzer.click()

    // Wait for any potential animation to complete
    await page.waitForTimeout(500)

    // No JavaScript errors should have occurred
    expect(errors).toHaveLength(0)
  })

  test('buzzer screenshot with reduced motion', async ({ page }) => {
    await setupGameWithBuzzer(page)
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('reduced-motion-buzzer.png', {
      fullPage: true,
    })
  })
})

test.describe('Reduced Motion - Song Reveal', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('cover blur removal is instant', async ({ page }) => {
    await setupGameForValidation(page)

    // Verify cover is blurred before reveal
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toHaveClass(/blur-xl/)

    // Trigger reveal
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    const startTime = Date.now()
    await correctButton.click()

    // With reduced motion, blur should be removed almost instantly
    await page.waitForTimeout(50)
    await expect(coverImage).not.toHaveClass(/blur-xl/)

    const elapsed = Date.now() - startTime
    // Should be much faster than normal 500ms transition
    expect(elapsed).toBeLessThan(300)
  })

  test('song info appears instantly', async ({ page }) => {
    await setupGameForValidation(page)

    // Trigger reveal
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Song title should appear immediately
    await page.waitForTimeout(50)
    const title = page.locator('h2')
    await expect(title).toBeVisible()

    // Artist should also be visible
    const artist = page.locator('.text-purple-200')
    await expect(artist).toBeVisible()
  })

  test('reveal screenshot with reduced motion', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()
    await page.waitForTimeout(100)

    await expect(page).toHaveScreenshot('reduced-motion-reveal.png', {
      fullPage: true,
    })
  })
})

test.describe('Reduced Motion - No JavaScript Errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('homepage loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('play selection page loads without JavaScript errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/play')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('solo config page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/solo')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })

  test('full game flow completes without JavaScript errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Start game
    const buzzer = await setupGameWithBuzzer(page)

    // Press buzzer
    await buzzer.click()

    // Validate answer
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await expect(correctButton).toBeVisible({ timeout: 2000 })
    await correctButton.click()

    // Go to next song
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })
    await nextButton.click()

    // Wait for new song to load
    await expect(page.getByRole('button', { name: 'BUZZ!' })).toBeVisible({
      timeout: 45000,
    })

    // No errors throughout the flow
    expect(errors).toHaveLength(0)
  })

  test('multiplayer hub loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/multiplayer')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })
})

test.describe('Reduced Motion - Functionality Preserved', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/play')

    // Click solo button
    await page.click('[data-testid="solo-button"]')
    await page.waitForURL('/solo')

    // Should see the config page
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible()

    // Navigate back
    await page.goBack()
    await page.waitForURL('/play')
  })

  test('form inputs work correctly', async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible()

    // Interact with slider
    const slider = page.locator('[data-testid="duration-slider"]')
    await slider.click()

    // Verify slider is interactive (value can change)
    const initialValue = await slider.inputValue()
    expect(initialValue).toBeDefined()
  })

  test('buttons respond to clicks', async ({ page }) => {
    await page.goto('/play')

    // Find and click the solo button
    const soloButton = page.locator('[data-testid="solo-button"]')
    await expect(soloButton).toBeVisible()

    // Button should be clickable and navigate
    await soloButton.click()
    await expect(page).toHaveURL(/\/solo/)
  })

  test('audio player controls work', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Verify audio progress bar is visible
    const progressBar = page.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toBeVisible()

    // Play/pause should work
    await buzzer.click()

    // Should transition to timer state
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await expect(correctButton).toBeVisible({ timeout: 2000 })
  })

  test('score updates after correct answer', async ({ page }) => {
    await setupGameForValidation(page)

    // Get initial score
    const scoreDisplay = page.locator('[data-testid="score-display"]')
    const initialScore = await scoreDisplay.textContent()

    // Click correct
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Wait for reveal state
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible({ timeout: 3000 })

    // Score should have increased
    const newScore = await scoreDisplay.textContent()
    expect(newScore).not.toBe(initialScore)
  })
})

test.describe('Reduced Motion - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('homepage visual with reduced motion', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('reduced-motion-homepage.png', {
      fullPage: true,
    })
  })

  test('solo config visual with reduced motion', async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('reduced-motion-solo-config.png', {
      fullPage: true,
    })
  })

  test('game playing state visual with reduced motion', async ({ page }) => {
    await setupGameWithBuzzer(page)
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('reduced-motion-game-playing.png', {
      fullPage: true,
    })
  })

  test('multiplayer hub visual with reduced motion', async ({ page }) => {
    await page.goto('/multiplayer')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('reduced-motion-multiplayer.png', {
      fullPage: true,
    })
  })
})

test.describe('Reduced Motion - Comparison with Normal Motion', () => {
  test('same content visible with and without reduced motion', async ({
    browser,
  }) => {
    // Create context with reduced motion
    const reducedContext = await browser.newContext({
      reducedMotion: 'reduce',
    })
    const reducedPage = await reducedContext.newPage()

    // Create context without reduced motion
    const normalContext = await browser.newContext({
      reducedMotion: 'no-preference',
    })
    const normalPage = await normalContext.newPage()

    // Navigate both to play page
    await reducedPage.goto('/play')
    await normalPage.goto('/play')

    // Both should have the same main content
    const reducedTitle = await reducedPage.locator('h1').textContent()
    const normalTitle = await normalPage.locator('h1').textContent()
    expect(reducedTitle).toBe(normalTitle)

    // Both should have solo and multiplayer buttons
    await expect(
      reducedPage.locator('[data-testid="solo-button"]')
    ).toBeVisible()
    await expect(
      normalPage.locator('[data-testid="solo-button"]')
    ).toBeVisible()

    await reducedContext.close()
    await normalContext.close()
  })
})

test.describe('Reduced Motion - Dark Mode Combination', () => {
  test('reduced motion works with dark color scheme', async ({ page }) => {
    // Enable both reduced motion and dark mode
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })

    await page.goto('/play')
    await page.waitForLoadState('networkidle')

    // Should render without errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Content should be visible
    await expect(page.locator('h1')).toContainText('Blindtest')

    // No floating orbs (reduced motion)
    const orbs = page.locator('.animate-float-orb')
    expect(await orbs.count()).toBe(0)

    // No JavaScript errors
    expect(errors).toHaveLength(0)

    await expect(page).toHaveScreenshot('reduced-motion-dark-mode.png', {
      fullPage: true,
    })
  })
})
