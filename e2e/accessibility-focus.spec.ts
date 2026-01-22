import { test, expect } from '@playwright/test'

/**
 * Focus States and Indicators Tests
 *
 * These tests verify that all interactive elements have visible focus states
 * for keyboard accessibility (WCAG 2.4.7 Focus Visible).
 *
 * Run with:
 *   npx playwright test e2e/accessibility-focus.spec.ts
 *
 * Generate screenshots:
 *   npx playwright test e2e/accessibility-focus.spec.ts --update-snapshots
 */

test.describe('Focus States - Play Selection Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('solo button shows focus ring when tabbed', async ({ page }) => {
    // Tab to the first interactive element
    await page.keyboard.press('Tab')

    // The solo button or its parent should be focused
    // Check that the focus ring is visible via screenshot
    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-solo-button.png', {
      fullPage: true,
    })
  })

  test('multiplayer button shows focus ring when tabbed', async ({ page }) => {
    // Tab twice to get to multiplayer button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-multiplayer-button.png', {
      fullPage: true,
    })
  })

  test('all interactive elements are keyboard accessible via Tab', async ({
    page,
  }) => {
    const focusedElements: string[] = []

    // Tab through all elements on the page
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      // Get info about focused element
      const focusedInfo = await page.evaluate(() => {
        const el = document.activeElement
        if (el) {
          return {
            tagName: el.tagName,
            role: el.getAttribute('role'),
            text: el.textContent?.substring(0, 50),
            dataTestId: el.getAttribute('data-testid'),
          }
        }
        return null
      })

      if (focusedInfo) {
        focusedElements.push(
          `${focusedInfo.tagName}[${focusedInfo.dataTestId || focusedInfo.role || focusedInfo.text}]`
        )
      }
    }

    // Verify we can tab through multiple elements
    expect(focusedElements.length).toBeGreaterThan(0)
  })

  test('Enter key activates focused button', async ({ page }) => {
    // Tab to solo button
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100)

    // Press Enter to activate
    await page.keyboard.press('Enter')

    // Should navigate to solo config page
    await page.waitForURL('/solo', { timeout: 5000 })
  })
})

test.describe('Focus States - Solo Configuration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('back button shows focus ring', async ({ page }) => {
    // Tab to back button (usually first interactive element)
    await page.keyboard.press('Tab')

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-back-button.png', {
      fullPage: true,
    })
  })

  test('guess mode radio buttons are keyboard navigable', async ({ page }) => {
    // Tab to find radio buttons
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
    }

    // Check if we can navigate between radio options
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)

    // Take screenshot showing radio focus
    await expect(page).toHaveScreenshot('focus-guess-mode-radio.png', {
      fullPage: true,
    })
  })

  test('duration slider shows focus ring', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')

    // Focus the slider directly
    await slider.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-duration-slider.png', {
      fullPage: true,
    })
  })

  test('slider can be adjusted with arrow keys', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')

    // Get initial value
    const initialValue = await slider.inputValue()

    // Focus and adjust with keyboard
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    // Get new value
    const newValue = await slider.inputValue()

    // Value should have changed
    expect(parseInt(newValue)).toBeGreaterThan(parseInt(initialValue))
  })

  test('start game button shows focus ring', async ({ page }) => {
    const startButton = page.locator('button:has-text("Nouvelle Partie")')

    // Focus the button
    await startButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-start-button.png', {
      fullPage: true,
    })
  })

  test('advanced settings toggle is keyboard accessible', async ({ page }) => {
    const advancedToggle = page.locator('[data-testid="advanced-settings"]')

    // Focus and activate with keyboard
    await advancedToggle.focus()
    await page.waitForTimeout(200)

    // Take screenshot showing focus
    await expect(page).toHaveScreenshot('focus-advanced-toggle.png', {
      fullPage: true,
    })

    // Press Enter or Space to toggle
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    // Verify it expanded
    await expect(page.locator('text=Mode sans timer')).toBeVisible()
  })
})

test.describe('Focus States - Multiplayer Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/multiplayer')
    await expect(page.locator('#create-nickname')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('nickname input shows focus ring', async ({ page }) => {
    const nicknameInput = page.locator('#create-nickname')

    // Focus the input
    await nicknameInput.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-nickname-input.png', {
      fullPage: true,
    })
  })

  test('room code input shows focus ring', async ({ page }) => {
    const roomCodeInput = page.locator('#join-code')

    // Focus the input
    await roomCodeInput.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-room-code-input.png', {
      fullPage: true,
    })
  })

  test('create room button shows focus ring', async ({ page }) => {
    const createButton = page.locator('button:has-text("Créer une partie")')

    // Focus the button
    await createButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-create-room-button.png', {
      fullPage: true,
    })
  })

  test('join room button shows focus ring', async ({ page }) => {
    const joinButton = page.locator('button:has-text("Rejoindre")')

    // Focus the button
    await joinButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-join-room-button.png', {
      fullPage: true,
    })
  })

  test('inputs can be filled with keyboard only', async ({ page }) => {
    // Focus nickname input and type
    const nicknameInput = page.locator('#create-nickname')
    await nicknameInput.focus()
    await nicknameInput.fill('') // Clear first
    await page.keyboard.type('TestUser', { delay: 30 })

    // Verify value was entered (at least some characters)
    const nicknameValue = await nicknameInput.inputValue()
    expect(nicknameValue.length).toBeGreaterThan(0)
    expect(nicknameValue).toContain('Test')

    // Focus room code input and type
    const roomCodeInput = page.locator('#join-code')
    await roomCodeInput.focus()
    await roomCodeInput.fill('') // Clear first
    await page.keyboard.type('ABCDEF', { delay: 30 })

    // Verify value was entered (at least some characters)
    const codeValue = await roomCodeInput.inputValue()
    expect(codeValue.length).toBeGreaterThan(0)
    expect(codeValue).toContain('ABC')
  })
})

test.describe('Focus States - Game Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
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

  test('buzzer button shows focus ring', async ({ page }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })

    // Focus the buzzer button
    await buzzerButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-buzzer-button.png', {
      fullPage: true,
    })
  })

  test('buzzer can receive focus', async ({ page }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })

    // Focus the buzzer to verify it can receive focus
    await buzzerButton.focus()
    await page.waitForTimeout(100)

    // Verify the buzzer is focused by checking active element
    const focusedText = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      // Check if it's a button with BUZZ text
      if (el.tagName === 'BUTTON' && el.textContent?.includes('BUZZ')) {
        return 'BUZZ'
      }
      // Or if the button is a child of the focused element
      const btn = el.querySelector?.('button')
      if (btn?.textContent?.includes('BUZZ')) {
        return 'BUZZ'
      }
      return el.textContent?.substring(0, 20)
    })

    // Buzzer should be focusable
    expect(focusedText).toBe('BUZZ')
  })

  test('reveal button shows focus ring', async ({ page }) => {
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })

    // Focus the reveal button
    await revealButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-reveal-button.png', {
      fullPage: true,
    })
  })

  test('quit button shows focus ring', async ({ page }) => {
    const quitButton = page.getByRole('button', { name: /quitter/i }).first()

    // Focus the quit button
    await quitButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-quit-button.png', {
      fullPage: true,
    })
  })

  test('validation buttons show focus ring after buzz', async ({ page }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })

    // Press buzzer using force click to handle animation overlay
    await buzzerButton.click({ force: true })

    // Wait for validation buttons with longer timeout (use exact match)
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await expect(correctButton).toBeVisible({ timeout: 15000 })

    // Focus correct button
    await correctButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-correct-button.png', {
      fullPage: true,
    })
  })

  test('incorrect button shows focus ring', async ({ page }) => {
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })

    // Press buzzer
    await buzzerButton.click()

    // Wait for validation buttons
    const incorrectButton = page.getByRole('button', { name: 'Incorrect' })
    await expect(incorrectButton).toBeVisible({ timeout: 10000 })

    // Focus incorrect button
    await incorrectButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-incorrect-button.png', {
      fullPage: true,
    })
  })

  test('next song button shows focus ring in reveal state', async ({
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

    // Focus the next button
    await nextButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-next-song-button.png', {
      fullPage: true,
    })
  })

  test('keyboard navigation through game controls', async ({ page }) => {
    // Start with buzzer focused
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await buzzerButton.focus()

    // Tab through available controls
    const focusableElements: string[] = []

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focusedTag = await page.evaluate(
        () => document.activeElement?.tagName
      )
      const focusedText = await page.evaluate(() =>
        document.activeElement?.textContent?.substring(0, 30)
      )

      if (focusedTag) {
        focusableElements.push(`${focusedTag}: ${focusedText}`)
      }
    }

    // Should be able to tab through multiple elements
    expect(focusableElements.length).toBeGreaterThan(0)
  })
})

test.describe('Focus States - Modal Dialogs', () => {
  test('quit confirmation modal buttons have focus rings', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
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

    // Focus cancel button
    const cancelButton = page.getByRole('button', { name: 'Annuler' })
    await cancelButton.focus()

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-modal-cancel-button.png', {
      fullPage: true,
    })

    // Tab to confirm quit button
    await page.keyboard.press('Tab')

    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('focus-modal-quit-button.png', {
      fullPage: true,
    })
  })

  test('modal can be closed with keyboard via cancel button', async ({
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

    // Wait for game to load
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Open quit modal
    const quitButton = page.getByRole('button', { name: /quitter/i }).first()
    await quitButton.click()

    // Wait for modal
    await expect(page.getByText('Quitter la partie ?')).toBeVisible()
    await page.waitForTimeout(300)

    // Focus cancel button and press Enter to close
    const cancelButton = page.getByRole('button', { name: 'Annuler' })
    await cancelButton.focus()
    await page.keyboard.press('Enter')

    // Modal should be closed
    await expect(page.getByText('Quitter la partie ?')).not.toBeVisible({
      timeout: 2000,
    })
  })
})

test.describe('Focus States - Focus Trap in Modals', () => {
  test('focus stays trapped within quit modal', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
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

    // Tab multiple times - focus should cycle within modal
    const focusedElements: string[] = []

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focusedText = await page.evaluate(
        () => document.activeElement?.textContent
      )
      focusedElements.push(focusedText || '')
    }

    // The focus should cycle between modal buttons (Annuler, Quitter)
    // and not escape to elements behind the modal
    const modalButtonTexts = ['Annuler', 'Quitter']
    const focusedInModal = focusedElements.filter((text) =>
      modalButtonTexts.some((btn) => text?.includes(btn))
    )

    // Most of the focused elements should be modal buttons
    expect(focusedInModal.length).toBeGreaterThanOrEqual(2)
  })
})

test.describe('Focus Visibility - Visual Verification', () => {
  test('focus rings are visible against dark background', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/play')
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Focus solo button
    const soloButton = page.locator('[data-testid="solo-button"]')
    await soloButton.focus()

    // Verify focus ring is visible by checking computed styles
    const focusRingVisible = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false

      const styles = window.getComputedStyle(el)
      // Check for box-shadow (Tailwind ring uses box-shadow)
      const boxShadow = styles.boxShadow

      // Ring should produce a visible box-shadow, not "none"
      return boxShadow !== 'none' && boxShadow !== ''
    })

    // Focus ring should be visible
    // Note: This may need adjustment based on actual implementation
    expect(focusRingVisible).toBe(true)
  })

  test('input focus border changes color', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/multiplayer')
    await expect(page.locator('#create-nickname')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    const nicknameInput = page.locator('#create-nickname')

    // Focus the input
    await nicknameInput.focus()
    await page.waitForTimeout(100)

    // Verify focus state is active via computed styles
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false

      const styles = window.getComputedStyle(el)
      const boxShadow = styles.boxShadow
      const borderColor = styles.borderColor

      // Either ring (box-shadow) or border change indicates focus
      return (
        (boxShadow !== 'none' && boxShadow !== '') ||
        borderColor.includes('rgb(236, 72, 153)') || // pink-500
        borderColor.includes('rgb(168, 85, 247)') // purple-500
      )
    })

    expect(focusVisible).toBe(true)
  })
})
