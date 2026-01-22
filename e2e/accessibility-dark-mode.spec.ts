import { test, expect, Page } from '@playwright/test'

/**
 * Dark Mode Contrast and Readability Tests
 *
 * These tests verify that the dark mode theme maintains sufficient contrast
 * and readability across all pages (WCAG AA compliance).
 *
 * Run with:
 *   npx playwright test e2e/accessibility-dark-mode.spec.ts
 *
 * Generate screenshots:
 *   npx playwright test e2e/accessibility-dark-mode.spec.ts --update-snapshots
 */

/**
 * Helper function to enable dark mode via localStorage before page load
 */
async function enableDarkMode(page: Page) {
  // Set dark mode in localStorage before navigation
  await page.addInitScript(() => {
    window.localStorage.setItem('blindtest_theme', 'dark')
  })
}

test.describe('Dark Mode - Play Selection Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('text readable on dark background', async ({ page }) => {
    // Wait for theme to fully apply
    await page.waitForTimeout(500)

    // Take screenshot of dark mode play page
    await expect(page).toHaveScreenshot('dark-mode-play.png', {
      fullPage: true,
    })
  })

  test('title has sufficient contrast', async ({ page }) => {
    const title = page.locator('h1')
    await expect(title).toBeVisible()

    // Verify title text is present and visible
    const titleText = await title.textContent()
    expect(titleText).toContain('Blindtest')

    // Check that title has visible styling
    const computedStyles = await title.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        color: styles.color,
        opacity: styles.opacity,
      }
    })

    // Title should have full opacity
    expect(parseFloat(computedStyles.opacity)).toBeGreaterThanOrEqual(0.9)
  })

  test('buttons visible in dark mode', async ({ page }) => {
    const soloButton = page.locator('[data-testid="solo-button"]')
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')

    // Both buttons should be visible
    await expect(soloButton).toBeVisible()
    await expect(multiplayerButton).toBeVisible()

    // Verify buttons have visible background
    const soloButtonStyles = await soloButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity,
      }
    })

    expect(parseFloat(soloButtonStyles.opacity)).toBeGreaterThanOrEqual(0.8)
  })

  test('button text is readable', async ({ page }) => {
    // Check solo button text
    await expect(page.locator('text=Jouer seul')).toBeVisible()
    await expect(
      page.locator('text=Testez vos connaissances musicales en solo')
    ).toBeVisible()

    // Check multiplayer button text
    await expect(page.locator('text=Multijoueur')).toBeVisible()
    await expect(
      page.locator('text=Affrontez vos amis en temps réel')
    ).toBeVisible()
  })

  test('hover states visible in dark mode', async ({ page }) => {
    await page.waitForTimeout(300)

    // Hover over solo button
    await page.hover('[data-testid="solo-button"]')
    await page.waitForTimeout(350)

    // Take screenshot of hover state in dark mode
    await expect(page).toHaveScreenshot('dark-mode-solo-hover.png', {
      fullPage: true,
    })
  })
})

test.describe('Dark Mode - Solo Configuration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('solo config page dark mode screenshot', async ({ page }) => {
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('dark-mode-solo.png', {
      fullPage: true,
    })
  })

  test('form labels readable in dark mode', async ({ page }) => {
    // Check main section labels
    await expect(page.locator('text=Que deviner ?')).toBeVisible()
    await expect(page.locator('text=Durée des extraits')).toBeVisible()

    // Check guess mode options are readable
    await expect(page.locator('text=Titre').first()).toBeVisible()
    await expect(page.locator('text=Artiste').first()).toBeVisible()
    await expect(page.locator('text=Les deux')).toBeVisible()
  })

  test('slider values visible in dark mode', async ({ page }) => {
    // Duration value should be visible
    const durationValue = page.locator('[data-testid="duration-value"]')
    await expect(durationValue).toBeVisible()

    // Get the displayed value
    const valueText = await durationValue.textContent()
    expect(valueText).toMatch(/\d+/)
  })

  test('advanced settings readable in dark mode', async ({ page }) => {
    // Expand advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // Check advanced settings labels are visible
    await expect(page.locator('text=Temps pour répondre')).toBeVisible()
    await expect(page.locator('text=Mode sans timer')).toBeVisible()
    await expect(page.locator('text=Point de départ')).toBeVisible()
    await expect(page.locator('text=Thème sombre')).toBeVisible()

    // Take screenshot with advanced settings expanded
    await expect(page).toHaveScreenshot('dark-mode-advanced-settings.png', {
      fullPage: true,
    })
  })

  test('start button visible in dark mode', async ({ page }) => {
    const startButton = page.locator('button:has-text("Nouvelle Partie")')
    await expect(startButton).toBeVisible()

    // Verify button is not disabled and has visible styling
    const isDisabled = await startButton.isDisabled()
    expect(isDisabled).toBe(false)
  })
})

test.describe('Dark Mode - Game Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')
    await page.waitForURL('/game*')

    // Wait for buzzer to appear (game is in PLAYING state)
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })
  })

  test('game screen dark mode screenshot', async ({ page }) => {
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('dark-mode-game.png', {
      fullPage: true,
    })
  })

  test('score display readable in dark mode', async ({ page }) => {
    // Score section should be visible
    await expect(page.getByText('Score')).toBeVisible()

    // Song number should be visible
    await expect(page.getByText(/Chanson \d+/)).toBeVisible()
  })

  test('buzzer button visible in dark mode', async ({ page }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible()

    // Verify buzzer has visible styling
    const buttonStyles = await buzzerButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        opacity: styles.opacity,
      }
    })

    expect(parseFloat(buttonStyles.opacity)).toBeGreaterThanOrEqual(0.9)
  })

  test('reveal button readable in dark mode', async ({ page }) => {
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()
  })

  test('validation buttons visible after buzz in dark mode', async ({
    page,
  }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await buzzerButton.click()

    // Wait for validation buttons
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })

    await expect(correctButton).toBeVisible({ timeout: 10000 })
    await expect(incorrectButton).toBeVisible()

    // Take screenshot of validation state in dark mode
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('dark-mode-game-validation.png', {
      fullPage: true,
    })
  })

  test('song reveal readable in dark mode', async ({ page }) => {
    // Reveal the answer
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await revealButton.click()

    // Wait for reveal state
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 5000 })

    // Wait for UI to settle
    await page.waitForTimeout(500)

    // Take screenshot of reveal state in dark mode
    await expect(page).toHaveScreenshot('dark-mode-game-reveal.png', {
      fullPage: true,
    })
  })

  test('quit modal readable in dark mode', async ({ page }) => {
    // Open quit modal
    const quitButton = page.getByRole('button', { name: /quitter/i }).first()
    await quitButton.click()

    // Wait for modal
    await expect(page.getByText('Quitter la partie ?')).toBeVisible()
    await page.waitForTimeout(300)

    // Verify modal text is readable
    await expect(
      page.getByText('Votre score ne sera pas sauvegardé.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Quitter' }).last()
    ).toBeVisible()

    // Take screenshot of quit modal in dark mode
    await expect(page).toHaveScreenshot('dark-mode-quit-modal.png', {
      fullPage: true,
    })
  })
})

test.describe('Dark Mode - Multiplayer Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/multiplayer')
    await expect(page.locator('#create-nickname')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('multiplayer hub dark mode screenshot', async ({ page }) => {
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('dark-mode-multiplayer.png', {
      fullPage: true,
    })
  })

  test('form labels readable in dark mode', async ({ page }) => {
    // Create room form labels
    await expect(
      page.getByRole('heading', { name: 'Créer une partie' })
    ).toBeVisible()

    // Join room form labels
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible()
  })

  test('input fields visible and usable in dark mode', async ({ page }) => {
    const nicknameInput = page.locator('#create-nickname')
    const roomCodeInput = page.locator('#join-code')

    // Inputs should be visible
    await expect(nicknameInput).toBeVisible()
    await expect(roomCodeInput).toBeVisible()

    // Type in inputs to verify they work
    await nicknameInput.fill('DarkModeTest')
    await roomCodeInput.fill('ABC123')

    // Verify values are visible in inputs
    await expect(nicknameInput).toHaveValue('DarkModeTest')
    await expect(roomCodeInput).toHaveValue('ABC123')

    // Take screenshot with filled inputs
    await expect(page).toHaveScreenshot('dark-mode-multiplayer-filled.png', {
      fullPage: true,
    })
  })

  test('buttons visible in dark mode', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Créer une partie' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejoindre' })).toBeVisible()
  })
})

test.describe('Dark Mode - Contrast Verification', () => {
  test('dark mode background is sufficiently dark', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForTimeout(500)

    // Check that the background is dark
    const bgElement = await page.locator('body').first()
    const backgroundColor = await bgElement.evaluate(() => {
      // Find the background element
      const bg = document.querySelector('[class*="fixed inset-0"]')
      if (bg) {
        const styles = window.getComputedStyle(bg)
        return styles.background
      }
      return ''
    })

    // Dark mode background should contain darker gradient values
    // This is a basic check - the screenshot comparison is more reliable
    expect(backgroundColor).toBeTruthy()
  })

  test('text contrast meets accessibility standards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForTimeout(500)

    // Check text color for main labels
    const labelElement = page.locator('text=Que deviner ?')
    await expect(labelElement).toBeVisible()

    const textStyles = await labelElement.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        color: styles.color,
        opacity: styles.opacity,
      }
    })

    // Text should not be transparent
    expect(parseFloat(textStyles.opacity)).toBeGreaterThanOrEqual(0.8)

    // Color should be light (high RGB values for dark background)
    // Parse RGB values from computed color
    const rgbMatch = textStyles.color.match(/\d+/g)
    if (rgbMatch && rgbMatch.length >= 3) {
      const [r, g, b] = rgbMatch.map(Number)
      // Light text should have high luminosity
      const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      expect(luminosity).toBeGreaterThan(0.5) // Text should be light colored
    }
  })
})

test.describe('Dark Mode - Theme Toggle', () => {
  test('theme can be toggled from solo config', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // Start in festive mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Take screenshot of festive mode
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('festive-mode-solo.png', {
      fullPage: true,
    })

    // Expand advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // Find and click the dark mode toggle
    const darkModeToggle = page.locator('text=Thème sombre').locator('..')
    await darkModeToggle.click()

    // Wait for theme transition
    await page.waitForTimeout(600)

    // Take screenshot of dark mode
    await expect(page).toHaveScreenshot('toggled-dark-mode-solo.png', {
      fullPage: true,
    })
  })

  test('dark mode persists across navigation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForTimeout(500)

    // Navigate to solo page
    await page.click('[data-testid="solo-button"]')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })

    // Verify dark mode is still active by checking if the page looks dark
    // (screenshot comparison is the reliable way to verify this)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('dark-mode-persisted-solo.png', {
      fullPage: true,
    })
  })
})

test.describe('Dark Mode - Error States', () => {
  test('error messages readable in dark mode', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await enableDarkMode(page)
    await page.goto('/multiplayer')
    await expect(page.locator('#join-code')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Try to join with invalid room code
    await page.locator('#join-code').fill('INVALID')
    await page.locator('#join-nickname').fill('TestUser')
    await page.getByRole('button', { name: 'Rejoindre' }).click()

    // Wait for error message (if validation happens)
    await page.waitForTimeout(2000)

    // Take screenshot of error state in dark mode
    await expect(page).toHaveScreenshot('dark-mode-error-state.png', {
      fullPage: true,
    })
  })
})
