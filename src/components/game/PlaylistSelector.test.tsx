import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaylistSelector } from './PlaylistSelector'

const playlists = [
  {
    id: 'party',
    name: 'Party',
    songCount: 2,
    missingSongCount: 1,
  },
  {
    id: 'empty',
    name: 'Vide',
    songCount: 0,
    missingSongCount: 3,
  },
]

describe('PlaylistSelector', () => {
  it('ne soumet pas le formulaire parent lors de la sélection', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    const onSelect = vi.fn()
    render(
      <form onSubmit={onSubmit}>
        <PlaylistSelector
          playlists={playlists}
          selectedPlaylistId={null}
          onSelect={onSelect}
        />
      </form>
    )

    fireEvent.click(screen.getByRole('button', { name: /Party/ }))

    expect(onSelect).toHaveBeenCalledWith('party')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('désactive les playlists vides et avertit pour les morceaux manquants', () => {
    render(
      <PlaylistSelector playlists={playlists} selectedPlaylistId="party" />
    )

    expect(screen.getByRole('button', { name: /Vide/ })).toBeDisabled()
    expect(screen.getByText('1 morceau introuvable')).toBeInTheDocument()
    expect(screen.getByText('3 morceaux introuvables')).toBeInTheDocument()
  })
})
