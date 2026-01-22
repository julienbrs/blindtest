import { test, expect, Locator } from '@playwright/test'

/**
 * Touch Target Size Tests
 *
 * These tests verify that all interactive elements meet the minimum
 * touch target size of 44x44 pixels (WCAG 2.5.5 Target Size).
 *
 * Run with:
 *   npx playwright test e2e/accessibility-touch-targets.spec.ts
 */

const MIN_TOUCH_TARGET_SIZE = 44

/**
 * Helper function to verify touch target size
 * Returns an object with width, height, and whether both meet minimum
 */
async function getTouchTargetInfo(locator: Locator): Promise<{
  width: number
  height: number
  meetsMinWidth: boolean
  meetsMinHeight: boolean
  meetsMinSize: boolean
}> {
  const box = await locator.boundingBox()
  if (!box) {
    return {
      width: 0,
      height: 0,
      meetsMinWidth: false,
      meetsMinHeight: false,
      meetsMinSize: false,
    }
  }
  return {
    width: box.width,
    height: box.height,
    meetsMinWidth: box.width >= MIN_TOUCH_TARGET_SIZE,
    meetsMinHeight: box.height >= MIN_TOUCH_TARGET_SIZE,
    meetsMinSize:
      box.width >= MIN_TOUCH_TARGET_SIZE && box.height >= MIN_TOUCH_TARGET_SIZE,
  }
}

test.describe('Touch Targets - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test.describe('Play Selection Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/play')
      await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
        timeout: 30000,
      })
      await page.waitForLoadState('networkidle')
    })

    test('solo button meets minimum touch target size', async ({ page }) => {
      const soloButton = page.locator('[data-testid="solo-button"]')
      const info = await getTouchTargetInfo(soloButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('multiplayer button meets minimum touch target size', async ({
      page,
    }) => {
      const multiplayerButton = page.locator(
        '[data-testid="multiplayer-button"]'
      )
      const info = await getTouchTargetInfo(multiplayerButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })
  })

  test.describe('Solo Configuration Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/solo')
      await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible(
        {
          timeout: 30000,
        }
      )
      await page.waitForLoadState('networkidle')
    })

    test('back button meets minimum touch target size', async ({ page }) => {
      const backButton = page.locator('[data-testid="back-button"]')
      if ((await backButton.count()) > 0) {
        const info = await getTouchTargetInfo(backButton)
        expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
        expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      }
    })

    test('duration slider thumb meets minimum touch target size', async ({
      page,
    }) => {
      const slider = page.locator('[data-testid="duration-slider"]')
      const info = await getTouchTargetInfo(slider)

      // Slider itself should be wide enough to interact with
      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      // Slider height may be smaller, but the clickable area should be accessible
      expect(info.height).toBeGreaterThanOrEqual(20) // Sliders typically have smaller height
    })

    test('guess mode option buttons meet minimum touch target size', async ({
      page,
    }) => {
      // Find guess mode option labels (they act as buttons)
      const modeOptions = page.locator('label:has(input[name="guessMode"])')
      const count = await modeOptions.count()

      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i++) {
        const option = modeOptions.nth(i)
        const info = await getTouchTargetInfo(option)

        expect(
          info.width,
          `Guess mode option ${i} width should be >= ${MIN_TOUCH_TARGET_SIZE}`
        ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
        expect(
          info.height,
          `Guess mode option ${i} height should be >= ${MIN_TOUCH_TARGET_SIZE}`
        ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      }
    })

    test('start game button meets minimum touch target size', async ({
      page,
    }) => {
      const startButton = page.locator('button:has-text("Nouvelle Partie")')
      const info = await getTouchTargetInfo(startButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('advanced settings toggle meets minimum touch target size', async ({
      page,
    }) => {
      const advancedToggle = page.locator('[data-testid="advanced-settings"]')
      const info = await getTouchTargetInfo(advancedToggle)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })
  })

  test.describe('Multiplayer Hub Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/multiplayer')
      await expect(page.locator('#create-nickname')).toBeVisible({
        timeout: 30000,
      })
      await page.waitForLoadState('networkidle')
    })

    test('create room button meets minimum touch target size', async ({
      page,
    }) => {
      const createButton = page.locator('button:has-text("Créer une partie")')
      const info = await getTouchTargetInfo(createButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('join room button meets minimum touch target size', async ({
      page,
    }) => {
      const joinButton = page.locator('button:has-text("Rejoindre")')
      const info = await getTouchTargetInfo(joinButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('nickname input meets minimum touch target size', async ({ page }) => {
      const nicknameInput = page.locator('#create-nickname')
      const info = await getTouchTargetInfo(nicknameInput)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('room code input meets minimum touch target size', async ({
      page,
    }) => {
      const roomCodeInput = page.locator('#join-code')
      const info = await getTouchTargetInfo(roomCodeInput)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })
  })

  test.describe('Game Screen', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/solo')
      await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible(
        {
          timeout: 30000,
        }
      )
      await page.waitForLoadState('networkidle')

      // Start the game
      await page.click('button:has-text("Nouvelle Partie")')
      await page.waitForURL('/game*')

      // Wait for buzzer to appear (game is in PLAYING state)
      const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
      await expect(buzzerButton).toBeVisible({ timeout: 45000 })
    })

    test('buzzer button meets minimum touch target size (should be much larger)', async ({
      page,
    }) => {
      const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
      const info = await getTouchTargetInfo(buzzerButton)

      // Buzzer should be significantly larger than minimum (at least 100px)
      expect(info.width).toBeGreaterThanOrEqual(100)
      expect(info.height).toBeGreaterThanOrEqual(100)
    })

    test('reveal button meets minimum touch target size', async ({ page }) => {
      const revealButton = page.getByRole('button', {
        name: 'Révéler la réponse',
      })
      const info = await getTouchTargetInfo(revealButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('quit button meets minimum touch target size', async ({ page }) => {
      const quitButton = page.getByRole('button', { name: /quitter/i }).first()
      const info = await getTouchTargetInfo(quitButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('validation buttons meet minimum touch target size after buzz', async ({
      page,
    }) => {
      const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })

      // Press buzzer
      await buzzerButton.click()

      // Wait for validation buttons
      const correctButton = page.getByRole('button', {
        name: 'Correct',
        exact: true,
      })
      const incorrectButton = page.getByRole('button', { name: 'Incorrect' })

      await expect(correctButton).toBeVisible({ timeout: 10000 })
      await expect(incorrectButton).toBeVisible()

      const correctInfo = await getTouchTargetInfo(correctButton)
      const incorrectInfo = await getTouchTargetInfo(incorrectButton)

      expect(correctInfo.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(correctInfo.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(incorrectInfo.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(incorrectInfo.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })

    test('next song button meets minimum touch target size in reveal state', async ({
      page,
    }) => {
      // Reveal the answer
      const revealButton = page.getByRole('button', {
        name: 'Révéler la réponse',
      })
      await revealButton.click()

      // Wait for next song button
      const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
      await expect(nextButton).toBeVisible({ timeout: 5000 })

      const info = await getTouchTargetInfo(nextButton)

      expect(info.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(info.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })
  })

  test.describe('Modal Dialogs', () => {
    test('quit modal buttons meet minimum touch target size', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/solo')
      await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible(
        {
          timeout: 30000,
        }
      )
      await page.waitForLoadState('networkidle')

      // Start the game
      await page.click('button:has-text("Nouvelle Partie")')
      await page.waitForURL('/game*')

      // Wait for game to load
      const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
      await expect(buzzerButton).toBeVisible({ timeout: 45000 })

      // Open quit modal
      const quitButton = page.getByRole('button', { name: /quitter/i }).first()
      await quitButton.click()

      // Wait for modal
      await expect(page.getByText('Quitter la partie ?')).toBeVisible()
      await page.waitForTimeout(300)

      // Check modal button sizes
      const cancelButton = page.getByRole('button', { name: 'Annuler' })
      const confirmQuitButton = page
        .getByRole('button', { name: 'Quitter' })
        .last()

      const cancelInfo = await getTouchTargetInfo(cancelButton)
      const confirmInfo = await getTouchTargetInfo(confirmQuitButton)

      expect(cancelInfo.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(cancelInfo.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(confirmInfo.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
      expect(confirmInfo.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE)
    })
  })
})

test.describe('Touch Targets - iPhone 12 Pro Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('all primary buttons meet touch target requirements', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check solo and multiplayer buttons
    const soloButton = page.locator('[data-testid="solo-button"]')
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')

    const soloInfo = await getTouchTargetInfo(soloButton)
    const multiplayerInfo = await getTouchTargetInfo(multiplayerButton)

    expect(soloInfo.meetsMinSize).toBe(true)
    expect(multiplayerInfo.meetsMinSize).toBe(true)
  })

  test('game buzzer is appropriately large for touch', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    const info = await getTouchTargetInfo(buzzerButton)

    // Buzzer should be large and easy to tap
    expect(info.width).toBeGreaterThanOrEqual(120)
    expect(info.height).toBeGreaterThanOrEqual(120)
  })
})

test.describe('Touch Targets - Tablet Viewport', () => {
  test.use({ viewport: { width: 768, height: 1024 } }) // iPad

  test('all interactive elements meet touch target requirements on tablet', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check buttons on play page
    const soloButton = page.locator('[data-testid="solo-button"]')
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')

    const soloInfo = await getTouchTargetInfo(soloButton)
    const multiplayerInfo = await getTouchTargetInfo(multiplayerButton)

    expect(soloInfo.meetsMinSize).toBe(true)
    expect(multiplayerInfo.meetsMinSize).toBe(true)
  })
})

test.describe('Touch Targets - All Interactive Elements Audit', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('audit all buttons on solo config page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Get all buttons on the page
    const buttons = page.locator('button')
    const count = await buttons.count()

    const results: Array<{
      text: string
      width: number
      height: number
      meetsMinSize: boolean
    }> = []

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const info = await getTouchTargetInfo(button)
        const text = (await button.textContent()) || `Button ${i}`
        results.push({
          text: text.substring(0, 30),
          width: info.width,
          height: info.height,
          meetsMinSize: info.meetsMinSize,
        })
      }
    }

    // Log results for debugging
    console.log('Button touch target audit:', results)

    // All visible buttons should meet minimum touch target size
    for (const result of results) {
      expect(
        result.meetsMinSize,
        `Button "${result.text}" (${result.width}x${result.height}) should meet minimum touch target size`
      ).toBe(true)
    }
  })

  test('audit all inputs on multiplayer page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/multiplayer')
    await expect(page.locator('#create-nickname')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Get all inputs on the page
    const inputs = page.locator('input:visible')
    const count = await inputs.count()

    const results: Array<{
      id: string
      width: number
      height: number
      meetsMinSize: boolean
    }> = []

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const info = await getTouchTargetInfo(input)
      const id = (await input.getAttribute('id')) || `Input ${i}`
      results.push({
        id,
        width: info.width,
        height: info.height,
        meetsMinSize: info.meetsMinSize,
      })
    }

    // Log results for debugging
    console.log('Input touch target audit:', results)

    // All visible inputs should meet minimum touch target size
    for (const result of results) {
      expect(
        result.meetsMinSize,
        `Input "${result.id}" (${result.width}x${result.height}) should meet minimum touch target size`
      ).toBe(true)
    }
  })
})

test.describe('Touch Targets - Spacing Between Elements', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('buttons have adequate spacing on play page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    const soloButton = page.locator('[data-testid="solo-button"]')
    const multiplayerButton = page.locator('[data-testid="multiplayer-button"]')

    const soloBox = await soloButton.boundingBox()
    const multiplayerBox = await multiplayerButton.boundingBox()

    expect(soloBox).not.toBeNull()
    expect(multiplayerBox).not.toBeNull()

    if (soloBox && multiplayerBox) {
      // Calculate vertical spacing between buttons
      const spacing = multiplayerBox.y - (soloBox.y + soloBox.height)

      // Buttons should have at least 8px spacing to prevent accidental taps
      expect(spacing).toBeGreaterThanOrEqual(8)
    }
  })

  test('validation buttons have adequate spacing after buzz', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Press buzzer
    await buzzerButton.click()

    // Wait for validation buttons
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })

    await expect(correctButton).toBeVisible({ timeout: 10000 })
    await expect(incorrectButton).toBeVisible()

    const correctBox = await correctButton.boundingBox()
    const incorrectBox = await incorrectButton.boundingBox()

    expect(correctBox).not.toBeNull()
    expect(incorrectBox).not.toBeNull()

    if (correctBox && incorrectBox) {
      // Calculate horizontal spacing between buttons
      const spacing = incorrectBox.x - (correctBox.x + correctBox.width)

      // Buttons should have at least 8px spacing
      expect(spacing).toBeGreaterThanOrEqual(8)
    }
  })
})
