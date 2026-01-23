import { test, expect, Page } from '@playwright/test'

/**
 * UX Flow Tests for Multiplayer Room Join
 *
 * Tests the user experience of joining a multiplayer room:
 * - Room code input is easy to use (auto-uppercase, character validation)
 * - Errors are displayed clearly
 * - Loading state is visible during join process
 */

/**
 * Helper to create a room and get the room code
 */
async function createRoom(page: Page, nickname: string): Promise<string> {
  await page.goto('/play')
  await expect(page.getByText('Multijoueur')).toBeVisible({ timeout: 10000 })

  // Click multiplayer button
  await page.getByRole('button', { name: 'Multijoueur' }).click()

  // Wait for the create room form
  await expect(
    page.getByRole('heading', { name: 'Créer une partie' })
  ).toBeVisible()

  // Fill in nickname using the specific ID for create form
  await page.locator('#create-nickname').fill(nickname)

  // Click create
  await page.getByRole('button', { name: 'Créer une partie' }).click()

  // Wait for lobby and get room code
  await expect(page.getByText('Code de la room')).toBeVisible({
    timeout: 10000,
  })

  // Extract room code from URL or displayed text
  const roomCodeElement = page
    .locator('[data-testid="room-code"]')
    .or(page.locator('text=/[A-Z0-9]{6}/'))
  const roomCode = await roomCodeElement.first().textContent()

  if (!roomCode) {
    // Try getting from URL
    const url = page.url()
    const match = url.match(/\/multiplayer\/([A-Z0-9]+)/)
    if (match) return match[1]
    throw new Error('Could not find room code')
  }

  return roomCode.trim()
}

test.describe('Room Join UX - Code Input', () => {
  test('room code input auto-converts to uppercase', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')
    await expect(input).toBeVisible()

    // Type lowercase characters
    await input.type('abc123')

    // Verify uppercase transformation
    await expect(input).toHaveValue('ABC123')
  })

  test('room code input filters invalid characters', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')

    // Type characters including invalid ones (O, I, L, 0, 1 are not allowed)
    await input.fill('O1LAB2')

    // Verify only valid characters remain (OIL01 filtered out)
    // The form filters O, I, L, 0, 1 - so from "O1LAB2" we get "AB2"
    await expect(input).toHaveValue('AB2')
  })

  test('room code input limits to 6 characters', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')

    // Type more than 6 characters
    await input.fill('ABCD1234567')

    // Verify limited to 6
    const value = await input.inputValue()
    expect(value.length).toBeLessThanOrEqual(6)
  })

  test('room code input has monospace font for readability', async ({
    page,
  }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')

    // Check for monospace font class
    await expect(input).toHaveClass(/font-mono/)
  })

  test('room code input has large, centered text', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')

    // Check for text centering and size classes
    await expect(input).toHaveClass(/text-center/)
    await expect(input).toHaveClass(/text-2xl/)
  })

  test('room code input has letter-spacing for clarity', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const input = page.locator('[data-testid="room-code-input"]')

    // Check for tracking (letter-spacing) class
    await expect(input).toHaveClass(/tracking-widest/)
  })
})

test.describe('Room Join UX - Error Messages', () => {
  test('shows error for invalid room code', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Fill in an invalid room code and nickname
    await page.locator('[data-testid="room-code-input"]').fill('ZZZZZZ')
    await page.locator('#join-nickname').fill('TestPlayer')

    // Click join
    await page.locator('[data-testid="join-button"]').click()

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Error should mention room not found
    await expect(errorMessage).toContainText(/introuvable|invalide/i)
  })

  test('error message has red styling for visibility', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Trigger an error
    await page.locator('[data-testid="room-code-input"]').fill('ZZZZZZ')
    await page.locator('#join-nickname').fill('TestPlayer')
    await page.locator('[data-testid="join-button"]').click()

    // Check error styling
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Should have red background and text color classes
    await expect(errorMessage).toHaveClass(/bg-red-500/)
    await expect(errorMessage).toHaveClass(/text-red-300/)
  })

  test('error message clears when typing new code', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Trigger an error
    await page.locator('[data-testid="room-code-input"]').fill('ZZZZZZ')
    await page.locator('#join-nickname').fill('TestPlayer')
    await page.locator('[data-testid="join-button"]').click()

    // Wait for error
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Type new character
    await page.locator('[data-testid="room-code-input"]').fill('ABC')

    // Error should be gone
    await expect(errorMessage).not.toBeVisible()
  })

  test('shows error when room code is too short', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Fill in a short code
    await page.locator('[data-testid="room-code-input"]').fill('ABC')
    await page.locator('#join-nickname').fill('TestPlayer')

    // Join button should be disabled
    const joinButton = page.locator('[data-testid="join-button"]')
    await expect(joinButton).toBeDisabled()
  })

  test('shows error when nickname is empty', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Fill in room code but no nickname
    await page.locator('[data-testid="room-code-input"]').fill('ABCDE2')

    // Join button should be disabled
    const joinButton = page.locator('[data-testid="join-button"]')
    await expect(joinButton).toBeDisabled()
  })
})

test.describe('Room Join UX - Loading State', () => {
  test('shows loading spinner during join process', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Add delay to the Supabase request to catch loading state
    await page.route('**/rest/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    // Fill in form
    await page.locator('[data-testid="room-code-input"]').fill('ABCDE2')
    await page.locator('#join-nickname').fill('TestPlayer')

    // Click join
    await page.locator('[data-testid="join-button"]').click()

    // Loading spinner should appear
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    await expect(loadingSpinner).toBeVisible({ timeout: 1000 })
  })

  test('button shows "Connexion en cours..." during loading', async ({
    page,
  }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Add delay to catch loading text
    await page.route('**/rest/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.continue()
    })

    // Fill in form
    await page.locator('[data-testid="room-code-input"]').fill('ABCDE2')
    await page.locator('#join-nickname').fill('TestPlayer')

    // Click join
    await page.locator('[data-testid="join-button"]').click()

    // Button should show loading text
    await expect(page.getByText('Connexion en cours...')).toBeVisible({
      timeout: 1000,
    })
  })

  test('input fields are disabled during loading', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Add delay to catch disabled state
    await page.route('**/rest/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.continue()
    })

    // Fill in form
    const codeInput = page.locator('[data-testid="room-code-input"]')
    const nicknameInput = page.locator('#join-nickname')

    await codeInput.fill('ABCDE2')
    await nicknameInput.fill('TestPlayer')

    // Click join
    await page.locator('[data-testid="join-button"]').click()

    // Inputs should be disabled
    await expect(codeInput).toBeDisabled({ timeout: 1000 })
    await expect(nicknameInput).toBeDisabled({ timeout: 1000 })
  })
})

test.describe('Room Join UX - Successful Join', () => {
  test('successful join redirects to lobby', async ({ browser }) => {
    // Create two browser contexts
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Host creates room
      const roomCode = await createRoom(hostPage, 'TestHost')

      // Player navigates to multiplayer page
      await playerPage.goto('/multiplayer')
      await expect(
        playerPage.getByRole('heading', { name: 'Rejoindre une partie' })
      ).toBeVisible({ timeout: 10000 })

      // Fill in room code and nickname
      await playerPage.locator('[data-testid="room-code-input"]').fill(roomCode)
      await playerPage.locator('#join-nickname').fill('TestPlayer')

      // Click join
      await playerPage.locator('[data-testid="join-button"]').click()

      // Should be redirected to lobby
      await playerPage.waitForURL(`/multiplayer/${roomCode}`, {
        timeout: 10000,
      })

      // Should see lobby content
      await expect(playerPage.getByText('Code de la room')).toBeVisible({
        timeout: 5000,
      })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('player sees host in lobby after joining', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Host creates room
      const roomCode = await createRoom(hostPage, 'HostUser')

      // Player joins
      await playerPage.goto('/multiplayer')
      await playerPage.locator('[data-testid="room-code-input"]').fill(roomCode)
      await playerPage.locator('#join-nickname').fill('PlayerUser')
      await playerPage.locator('[data-testid="join-button"]').click()

      // Wait for lobby
      await playerPage.waitForURL(`/multiplayer/${roomCode}`, {
        timeout: 10000,
      })

      // Player should see host in the players list
      await expect(playerPage.getByText('HostUser')).toBeVisible({
        timeout: 10000,
      })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })
})

test.describe('Room Join UX - Focus and Keyboard', () => {
  test('tab order is logical (code -> nickname -> button)', async ({
    page,
  }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Focus on the code input first
    const codeInput = page.locator('[data-testid="room-code-input"]')
    await codeInput.focus()
    await expect(codeInput).toBeFocused()

    // Tab to nickname
    await page.keyboard.press('Tab')
    const nicknameInput = page.locator('#join-nickname')
    await expect(nicknameInput).toBeFocused()

    // Tab to button (may need to skip character counter)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should eventually reach the join button
    const joinButton = page.locator('[data-testid="join-button"]')
    await expect(joinButton).toBeFocused()
  })

  test('Enter key submits form when valid', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // Fill in form
    await page.locator('[data-testid="room-code-input"]').fill('ZZZZZZ')
    await page.locator('#join-nickname').fill('TestPlayer')

    // Press Enter
    await page.keyboard.press('Enter')

    // Should attempt to join (will show error for invalid room)
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('focus ring visible on inputs', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const codeInput = page.locator('[data-testid="room-code-input"]')

    // Focus the input
    await codeInput.focus()

    // Check for focus ring class
    await expect(codeInput).toHaveClass(/focus:ring/)
  })
})

test.describe('Room Join UX - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('form is usable on mobile viewport', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    // All form elements should be visible without scrolling
    const codeInput = page.locator('[data-testid="room-code-input"]')
    const nicknameInput = page.locator('#join-nickname')
    const joinButton = page.locator('[data-testid="join-button"]')

    await expect(codeInput).toBeVisible()
    await expect(nicknameInput).toBeVisible()
    await expect(joinButton).toBeVisible()

    // Form should be functional
    await codeInput.fill('ABC123')
    await expect(codeInput).toHaveValue('ABC23') // 1 is filtered
  })

  test('touch targets are large enough', async ({ page }) => {
    await page.goto('/multiplayer')
    await expect(
      page.getByRole('heading', { name: 'Rejoindre une partie' })
    ).toBeVisible({ timeout: 10000 })

    const codeInput = page.locator('[data-testid="room-code-input"]')
    const joinButton = page.locator('[data-testid="join-button"]')

    // Input height should be at least 44px (Apple guideline)
    const inputBox = await codeInput.boundingBox()
    expect(inputBox).not.toBeNull()
    expect(inputBox!.height).toBeGreaterThanOrEqual(44)

    // Button height should be at least 44px
    const buttonBox = await joinButton.boundingBox()
    expect(buttonBox).not.toBeNull()
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44)
  })
})
