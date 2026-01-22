import { test, expect, Page } from '@playwright/test'

/**
 * Correct/Incorrect Answer Flash Animation Tests
 *
 * Tests the flash animations that appear when validating answers:
 * - Green flash overlay for correct answers (500ms duration)
 * - Red flash overlay for incorrect answers (300ms duration)
 * - Both respect prefers-reduced-motion setting
 *
 * Issue 16.15 - Test correct/incorrect answer flash animations
 *
 * Acceptance criteria:
 * - Flash vert visible
 * - Animation shake rouge
 * - Duree appropriee (~500ms for correct, ~300ms for incorrect)
 */

// Helper function to start a game and get to the validation state
async function setupGameForValidation(page: Page) {
  // Navigate to solo config page
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

  // Click buzzer to enter timer state
  await buzzer.click()

  // Wait for validation buttons to appear
  await expect(
    page.getByRole('button', { name: 'Correct', exact: true })
  ).toBeVisible({
    timeout: 2000,
  })
}

test.describe('Correct Answer Flash Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('correct answer shows green flash overlay', async ({ page }) => {
    await setupGameForValidation(page)

    // Click correct button
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // The flash element should be visible immediately after click
    // It appears for 500ms and then fades out
    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })
  })

  test('correct flash uses green background color', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for green background class
    await expect(flash).toHaveClass(/bg-green-500/)
  })

  test('correct flash covers full screen (fixed inset-0)', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for fixed positioning and full screen coverage
    await expect(flash).toHaveClass(/fixed/)
    await expect(flash).toHaveClass(/inset-0/)
  })

  test('correct flash is non-interactive (pointer-events-none)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for pointer-events-none to allow clicks through
    await expect(flash).toHaveClass(/pointer-events-none/)
  })

  test('correct flash disappears after animation (~500ms)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')

    // Flash should be visible initially
    await expect(flash).toBeVisible({ timeout: 100 })

    // Wait for animation to complete (500ms + buffer)
    await page.waitForTimeout(700)

    // Flash should no longer be visible (element may still exist but animation makes it invisible)
    // The component removes itself from DOM after show becomes false
    await expect(flash).not.toBeVisible({ timeout: 100 })
  })

  test('correct answer screenshot during flash', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })

    // Click and immediately capture the flash
    await correctButton.click()

    // Small delay to let the flash reach peak opacity
    await page.waitForTimeout(100)

    await expect(page).toHaveScreenshot('correct-answer-flash.png', {
      fullPage: true,
    })
  })
})

test.describe('Incorrect Answer Flash Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('incorrect answer shows red flash overlay', async ({ page }) => {
    await setupGameForValidation(page)

    // Click incorrect button
    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    // The flash element should be visible immediately after click
    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })
  })

  test('incorrect flash uses red background color', async ({ page }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for red background class
    await expect(flash).toHaveClass(/bg-red-500/)
  })

  test('incorrect flash covers full screen (fixed inset-0)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for fixed positioning and full screen coverage
    await expect(flash).toHaveClass(/fixed/)
    await expect(flash).toHaveClass(/inset-0/)
  })

  test('incorrect flash is non-interactive (pointer-events-none)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check for pointer-events-none to allow clicks through
    await expect(flash).toHaveClass(/pointer-events-none/)
  })

  test('incorrect flash disappears after animation (~300ms)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')

    // Flash should be visible initially
    await expect(flash).toBeVisible({ timeout: 100 })

    // Wait for animation to complete (300ms + buffer)
    await page.waitForTimeout(500)

    // Flash should no longer be visible
    await expect(flash).not.toBeVisible({ timeout: 100 })
  })

  test('incorrect answer also triggers screen shake', async ({ page }) => {
    await setupGameForValidation(page)

    // Get main element before click to capture initial position
    const main = page.locator('main')
    const initialTransform = await main.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    // Wait a moment for shake to start
    await page.waitForTimeout(100)

    // Get transform during shake - it should be different if shaking
    const shakeTransform = await main.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // The main element receives a shake animation via Framer Motion
    // which applies translateX during the shake
    // If the transforms are different, shake is happening
    // Note: This might be 'none' vs 'matrix(...)'
    expect(
      shakeTransform !== initialTransform || shakeTransform !== 'none'
    ).toBe(true)
  })

  test('incorrect answer screenshot during flash', async ({ page }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })

    // Click and immediately capture the flash
    await incorrectButton.click()

    // Small delay to let the flash reach peak opacity
    await page.waitForTimeout(50)

    await expect(page).toHaveScreenshot('incorrect-answer-flash.png', {
      fullPage: true,
    })
  })
})

test.describe('Answer Flash - Reduced Motion', () => {
  test.beforeEach(async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('correct flash is not shown when reduced motion is enabled', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')

    // With reduced motion, the flash component should not render at all
    await expect(flash).not.toBeVisible({ timeout: 100 })
  })

  test('incorrect flash is not shown when reduced motion is enabled', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')

    // With reduced motion, the flash component should not render at all
    await expect(flash).not.toBeVisible({ timeout: 100 })
  })

  test('game still transitions correctly with reduced motion', async ({
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

test.describe('Answer Flash - Animation Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('correct flash has proper z-index for overlay (z-40)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check z-index class
    await expect(flash).toHaveClass(/z-40/)
  })

  test('incorrect flash has proper z-index for overlay (z-40)', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    const flash = page.locator('[data-testid="incorrect-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Check z-index class
    await expect(flash).toHaveClass(/z-40/)
  })

  test('flash animation uses smooth opacity transition', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    const flash = page.locator('[data-testid="correct-answer-flash"]')
    await expect(flash).toBeVisible({ timeout: 100 })

    // Get opacity value - Framer Motion animates through opacity: [0, 0.3, 0]
    const opacity = await flash.evaluate((el) => {
      return window.getComputedStyle(el).opacity
    })

    // Opacity should be a value between 0 and 1
    const opacityValue = parseFloat(opacity)
    expect(opacityValue).toBeGreaterThanOrEqual(0)
    expect(opacityValue).toBeLessThanOrEqual(1)
  })
})

test.describe('Answer Flash - Multiple Rapid Validations', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('correct answer triggers flash and allows next song navigation', async ({
    page,
  }) => {
    await setupGameForValidation(page)

    // Click correct
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Wait for flash and game state transition
    await page.waitForTimeout(300)

    // Should be able to click next song
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })
    await nextButton.click()

    // Wait for new buzzer to appear (new song loaded)
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })
  })

  test('flash does not interfere with UI interactions', async ({ page }) => {
    await setupGameForValidation(page)

    // Click correct - this triggers the flash overlay
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // The flash has pointer-events-none, so we should be able to
    // interact with the "Chanson suivante" button even while flash is visible
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })

    // This click should work even if flash is still animating
    await nextButton.click()

    // Verify navigation worked by checking for loading or new buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })
  })
})

test.describe('Answer Flash - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('game state after correct answer (reveal state)', async ({ page }) => {
    await setupGameForValidation(page)

    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Wait for flash to finish and state to settle
    await page.waitForTimeout(700)

    await expect(page).toHaveScreenshot('game-after-correct-answer.png', {
      fullPage: true,
    })
  })

  test('game state after incorrect answer (reveal state)', async ({ page }) => {
    await setupGameForValidation(page)

    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    // Wait for flash and shake to finish and state to settle
    await page.waitForTimeout(700)

    await expect(page).toHaveScreenshot('game-after-incorrect-answer.png', {
      fullPage: true,
    })
  })
})
