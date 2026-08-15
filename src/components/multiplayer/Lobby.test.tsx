import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Lobby } from './Lobby'
import { usePlaylistCatalog } from '@/hooks/usePlaylistCatalog'
import type { Player, Room } from '@/lib/types'

vi.mock('@/hooks/usePlaylistCatalog', () => ({
  usePlaylistCatalog: vi.fn(),
}))

const room: Room = {
  id: 'room',
  code: 'ABC123',
  hostId: 'host',
  status: 'waiting',
  settings: {
    guessMode: 'both',
    clipDuration: 15,
    timerDuration: 5,
    noTimer: false,
    revealDuration: 5,
    playlistId: 'party',
  },
  currentSongId: null,
  playedSongIds: [],
  currentSongStartedAt: null,
  createdAt: new Date(),
}

const players: Player[] = [
  {
    id: 'host',
    roomId: 'room',
    nickname: 'Host',
    avatar: '🎸',
    score: 0,
    isHost: true,
    isOnline: true,
    joinedAt: new Date(),
  },
  {
    id: 'guest',
    roomId: 'room',
    nickname: 'Guest',
    avatar: '🎤',
    score: 0,
    isHost: false,
    isOnline: true,
    joinedAt: new Date(),
  },
]

function props(isHost: boolean) {
  return {
    room,
    players,
    myPlayerId: isHost ? 'host' : 'guest',
    isHost,
    onStartGame: vi.fn().mockResolvedValue(true),
    onLeaveRoom: vi.fn().mockResolvedValue(undefined),
    onUpdateSettings: vi.fn().mockResolvedValue(true),
    onKickPlayer: vi.fn().mockResolvedValue(true),
  }
}

describe('Lobby playlists', () => {
  beforeEach(() => {
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

  it('permet uniquement à l’hôte de modifier la playlist de room', async () => {
    const lobbyProps = props(true)
    render(<Lobby {...lobbyProps} />)

    fireEvent.click(screen.getByRole('button', { name: /Configuration/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Toute la bibliothèque/ })
    )

    await waitFor(() => {
      expect(lobbyProps.onUpdateSettings).toHaveBeenCalledWith({
        playlistId: null,
      })
    })
  })

  it('affiche le choix en lecture seule aux autres joueurs', () => {
    render(<Lobby {...props(false)} />)

    expect(screen.getByText("Playlist choisie par l'hôte")).toBeInTheDocument()
    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Party/ })
    ).not.toBeInTheDocument()
  })
})
