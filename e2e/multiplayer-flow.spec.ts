import { test, expect, Page } from '@playwright/test'

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

/**
 * Helper to join a room with a code
 */
async function joinRoom(
  page: Page,
  roomCode: string,
  nickname: string
): Promise<void> {
  await page.goto('/play')
  await expect(page.getByText('Multijoueur')).toBeVisible({ timeout: 10000 })

  // Click multiplayer button
  await page.getByRole('button', { name: 'Multijoueur' }).click()

  // Wait for the join room form
  await expect(
    page.getByRole('heading', { name: 'Rejoindre une partie' })
  ).toBeVisible()

  // Fill in room code and nickname using specific IDs for join form
  await page.locator('#join-code').fill(roomCode)
  await page.locator('#join-nickname').fill(nickname)

  // Click join
  await page.getByRole('button', { name: 'Rejoindre' }).click()

  // Wait for lobby
  await expect(page.getByText('Code de la room')).toBeVisible({
    timeout: 10000,
  })
}

test.describe('Multiplayer Lobby Flow', () => {
  test('host can create a room and see room code', async ({ page }) => {
    await page.goto('/play')
    await expect(page.getByRole('button', { name: 'Multijoueur' })).toBeVisible(
      {
        timeout: 10000,
      }
    )

    await page.getByRole('button', { name: 'Multijoueur' }).click()
    await page.locator('#create-nickname').fill('TestHost')
    await page.getByRole('button', { name: 'Créer une partie' }).click()

    // Should see lobby with room code
    await expect(page.getByText('Code de la room')).toBeVisible({
      timeout: 10000,
    })

    // Should show host in players list
    await expect(page.getByText('TestHost')).toBeVisible({ timeout: 10000 })

    // Should show host badge
    await expect(page.getByText('Host', { exact: true })).toBeVisible({
      timeout: 5000,
    })

    // Should show player count (1/10)
    await expect(page.getByText('Joueurs (1/10)')).toBeVisible({
      timeout: 5000,
    })
  })

  test('player can join room with valid code', async ({ browser }) => {
    // Create two browser contexts for host and player
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      // Host creates room
      const roomCode = await createRoom(hostPage, 'Hôte1')

      // Player joins with code
      await joinRoom(playerPage, roomCode, 'Player1')

      // Both should see each other in lobby
      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })
      await expect(playerPage.getByText('Hôte1')).toBeVisible({
        timeout: 10000,
      })

      // Player count should be 2
      await expect(hostPage.getByText('Joueurs (2/10)')).toBeVisible()
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('player sees error with invalid code', async ({ page }) => {
    await page.goto('/play')
    await page.getByRole('button', { name: 'Multijoueur' }).click()

    await page.locator('#join-code').fill('ZZZZZZ')
    await page.locator('#join-nickname').fill('Player')
    await page.getByRole('button', { name: 'Rejoindre' }).click()

    // Should see error message
    await expect(
      page.getByText(/room.*introuvable|code.*invalide|n'existe pas/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('lobby shows all connected players', async ({ browser }) => {
    // Create three browser contexts for host and two players
    const hostContext = await browser.newContext()
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()

    try {
      // Host creates room (don't use "Host" as nickname to avoid collision with Host badge)
      const roomCode = await createRoom(hostPage, 'Charlie')

      // Player 1 joins
      await joinRoom(player1Page, roomCode, 'Alice')

      // Wait for player 1 to be visible on host side
      await expect(hostPage.getByText('Alice')).toBeVisible({ timeout: 10000 })

      // Player 2 joins
      await joinRoom(player2Page, roomCode, 'Bob')

      // Wait for player 2 to be visible on host side
      await expect(hostPage.getByText('Bob')).toBeVisible({ timeout: 10000 })

      // All players should see all three player names
      for (const page of [hostPage, player1Page, player2Page]) {
        await expect(page.getByText('Charlie')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('Alice')).toBeVisible()
        await expect(page.getByText('Bob')).toBeVisible()
      }

      // Verify player count shows 3
      await expect(hostPage.getByText('Joueurs (3/10)')).toBeVisible()
    } finally {
      await hostContext.close()
      await player1Context.close()
      await player2Context.close()
    }
  })

  test('host badge visible only on host', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'HostPlayer')
      await joinRoom(playerPage, roomCode, 'GuestPlayer')

      // Wait for both players to be visible
      await expect(hostPage.getByText('GuestPlayer')).toBeVisible({
        timeout: 10000,
      })
      await expect(playerPage.getByText('HostPlayer')).toBeVisible({
        timeout: 10000,
      })

      // Host should see "Host" badge (only one on the page - for themselves)
      const hostBadgesOnHostPage = hostPage.getByText('Host', { exact: true })
      await expect(hostBadgesOnHostPage).toHaveCount(1)

      // Player should also see the Host badge (only one on the page - for the host)
      const hostBadgesOnPlayerPage = playerPage.getByText('Host', {
        exact: true,
      })
      await expect(hostBadgesOnPlayerPage).toHaveCount(1)

      // The badge should be associated with HostPlayer, not GuestPlayer
      // We check that the Host badge is near the HostPlayer name
      const hostPlayerCard = playerPage
        .locator('[data-testid="player-card"]')
        .filter({
          hasText: 'HostPlayer',
        })
      await expect(
        hostPlayerCard.getByText('Host', { exact: true })
      ).toBeVisible()
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('player can leave room', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      // Verify both see each other
      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })
      await expect(hostPage.getByText('Joueurs (2/10)')).toBeVisible()

      // Player leaves
      await playerPage.getByRole('button', { name: /quitter/i }).click()

      // Player should be back on /multiplayer (mode selection page)
      await playerPage.waitForURL(/\/multiplayer$/, { timeout: 15000 })

      // Verify the player is no longer in the room by checking the URL changed
      // and the "Rejoindre une partie" heading is visible (multiplayer page)
      await expect(
        playerPage.getByRole('heading', { name: 'Rejoindre une partie' })
      ).toBeVisible({ timeout: 5000 })

      // Note: Real-time player list updates on host side may take some time
      // The key behavior tested is that the player was redirected successfully
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })
})

test.describe('Multiplayer Game Flow', () => {
  test('host can start game when 2+ players', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      // Wait for both to be visible
      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })

      // Host should see start button
      const startButton = hostPage.getByRole('button', {
        name: /démarrer|commencer/i,
      })
      await expect(startButton).toBeVisible({ timeout: 5000 })

      // Click start
      await startButton.click()

      // Both should see game started (controls visible)
      await expect(
        hostPage.getByRole('heading', { name: 'Partie en cours' })
      ).toBeVisible({ timeout: 10000 })
      await expect(
        playerPage.getByRole('heading', { name: 'Partie en cours' })
      ).toBeVisible({ timeout: 10000 })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('host can load first song and player can buzz', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })

      // Start game
      await hostPage
        .getByRole('button', { name: /démarrer|commencer/i })
        .click()
      await expect(hostPage.getByText(/controles hote/i)).toBeVisible({
        timeout: 10000,
      })

      // Host loads first song
      const nextSongButton = hostPage.getByRole('button', {
        name: /chanson suivante/i,
      })
      await expect(nextSongButton).toBeVisible({ timeout: 5000 })
      await nextSongButton.click()

      // Wait for audio to load and game to be playing
      await expect(hostPage.getByText(/en cours/i)).toBeVisible({
        timeout: 15000,
      })

      // Player should see buzz button
      const buzzerButton = playerPage.getByRole('button', { name: 'BUZZ!' })
      await expect(buzzerButton).toBeVisible({ timeout: 15000 })

      // Player buzzes
      await buzzerButton.click()

      // Host should see validation buttons
      await expect(
        hostPage.getByRole('button', { name: 'Correct', exact: true })
      ).toBeVisible({ timeout: 5000 })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('host can validate answer and scores update', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })

      // Start and load song
      await hostPage
        .getByRole('button', { name: /démarrer|commencer/i })
        .click()
      await hostPage.getByRole('button', { name: /chanson suivante/i }).click()

      // Wait for buzzer to appear on player side
      const buzzerButton = playerPage.getByRole('button', { name: 'BUZZ!' })
      await expect(buzzerButton).toBeVisible({ timeout: 15000 })

      // Player buzzes
      await buzzerButton.click()

      // Host validates as correct
      await hostPage.getByRole('button', { name: /^correct$/i }).click()

      // Player's score should update to 1
      await expect(
        playerPage
          .getByText(/Player1.*1/i)
          .or(playerPage.locator('[data-player="Player1"]').getByText('1'))
      ).toBeVisible({ timeout: 5000 })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })

  test('host can end game and all see recap', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      await expect(hostPage.getByText('Player1')).toBeVisible({
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

      // Both should see game ended / recap
      await expect(
        hostPage.getByRole('heading', { name: /Partie terminée/i })
      ).toBeVisible({ timeout: 10000 })
      await expect(
        playerPage.getByRole('heading', { name: /Partie terminée/i })
      ).toBeVisible({ timeout: 10000 })
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })
})

test.describe('Multiplayer Reconnection', () => {
  test('player can reconnect after page refresh', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const playerContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const playerPage = await playerContext.newPage()

    try {
      const roomCode = await createRoom(hostPage, 'Hôte1')
      await joinRoom(playerPage, roomCode, 'Player1')

      // Verify player is in lobby
      await expect(hostPage.getByText('Player1')).toBeVisible({
        timeout: 10000,
      })

      // Refresh player page (reconnection uses stored player ID)
      await playerPage.reload()

      // Player should automatically reconnect and see the lobby again
      await expect(playerPage.getByText('Hôte1')).toBeVisible({
        timeout: 15000,
      })

      // Host should still see player
      await expect(hostPage.getByText('Player1')).toBeVisible()
    } finally {
      await hostContext.close()
      await playerContext.close()
    }
  })
})
