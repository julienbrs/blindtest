import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameConfigForm } from './GameConfigForm'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { usePlaylistCatalog } from '@/hooks/usePlaylistCatalog'

const push = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/hooks/usePlaylistCatalog', () => ({
  usePlaylistCatalog: vi.fn(),
}))

describe('GameConfigForm playlists', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total: 82, totalInLibrary: 82 }),
      })
    )
    vi.mocked(usePlaylistCatalog).mockReturnValue({
      playlists: [
        {
          id: 'party',
          name: 'Party',
          songCount: 2,
          missingSongCount: 0,
        },
      ],
      isLoading: false,
      isLoaded: true,
      error: null,
      refresh: vi.fn(),
    })
  })

  it('mémorise l’ID validé et le transmet à la partie solo', async () => {
    render(
      <ThemeProvider>
        <GameConfigForm />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByTestId('advanced-settings'))
    fireEvent.click(screen.getByRole('button', { name: /Party/ }))

    expect(push).not.toHaveBeenCalled()
    expect(localStorage.getItem('blindtest_selected_playlist')).toBe('party')

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle Partie' }))
    await waitFor(() => {
      expect(push).toHaveBeenCalledTimes(1)
    })

    const destination = push.mock.calls[0][0] as string
    expect(destination).toContain('/game?')
    expect(destination).toContain('playlist=party')
    expect(destination).not.toContain('include=')
  })

  it('efface une ancienne sélection devenue invalide', async () => {
    localStorage.setItem('blindtest_selected_playlist', 'deleted')

    render(
      <ThemeProvider>
        <GameConfigForm />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(localStorage.getItem('blindtest_selected_playlist')).toBeNull()
    })
  })
})
