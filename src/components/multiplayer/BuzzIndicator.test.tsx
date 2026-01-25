import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuzzIndicator } from './BuzzIndicator'
import type { Player, Buzz } from '@/lib/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    span: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
    h2: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <h2 className={className} {...props}>
        {children}
      </h2>
    ),
    p: ({
      children,
      className,
      ...props
    }: {
      children?: React.ReactNode
      className?: string
    }) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

describe('BuzzIndicator', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      roomId: 'room-1',
      nickname: 'Alice',
      avatar: '🎸',
      score: 5,
      isHost: true,
      isOnline: true,
      joinedAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'player-2',
      roomId: 'room-1',
      nickname: 'Bob',
      avatar: '🎤',
      score: 3,
      isHost: false,
      isOnline: true,
      joinedAt: new Date('2024-01-01T10:01:00Z'),
    },
    {
      id: 'player-3',
      roomId: 'room-1',
      nickname: 'Charlie',
      avatar: '🎹',
      score: 7,
      isHost: false,
      isOnline: true,
      joinedAt: new Date('2024-01-01T10:02:00Z'),
    },
  ]

  it('shows waiting state when no buzzes', () => {
    render(
      <BuzzIndicator
        buzzes={[]}
        players={mockPlayers}
        currentBuzzer={null}
        myPlayerId="player-1"
      />
    )

    expect(
      screen.getByText('Appuyez sur BUZZ! pour répondre en premier')
    ).toBeInTheDocument()
  })

  it('shows the current buzzer when someone buzzed', () => {
    const buzzes: Buzz[] = [
      {
        id: 'buzz-1',
        roomId: 'room-1',
        playerId: 'player-2',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:00Z'),
        isWinner: true,
      },
    ]

    render(
      <BuzzIndicator
        buzzes={buzzes}
        players={mockPlayers}
        currentBuzzer={mockPlayers[1]} // Bob
        myPlayerId="player-1"
      />
    )

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Répond actuellement')).toBeInTheDocument()
  })

  it('shows "VOUS" when current player is the buzzer', () => {
    const buzzes: Buzz[] = [
      {
        id: 'buzz-1',
        roomId: 'room-1',
        playerId: 'player-1',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:00Z'),
        isWinner: true,
      },
    ]

    render(
      <BuzzIndicator
        buzzes={buzzes}
        players={mockPlayers}
        currentBuzzer={mockPlayers[0]} // Alice (current player)
        myPlayerId="player-1"
      />
    )

    expect(screen.getByText('VOUS')).toBeInTheDocument()
    expect(screen.getByText("C'est à vous !")).toBeInTheDocument()
    expect(
      screen.getByText("Donnez votre réponse à l'hôte !")
    ).toBeInTheDocument()
  })

  it('shows other buzzers who also buzzed after the winner', () => {
    const buzzes: Buzz[] = [
      {
        id: 'buzz-1',
        roomId: 'room-1',
        playerId: 'player-2',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:00Z'),
        isWinner: true,
      },
      {
        id: 'buzz-2',
        roomId: 'room-1',
        playerId: 'player-3',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:01Z'),
        isWinner: false,
      },
      {
        id: 'buzz-3',
        roomId: 'room-1',
        playerId: 'player-1',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:02Z'),
        isWinner: false,
      },
    ]

    render(
      <BuzzIndicator
        buzzes={buzzes}
        players={mockPlayers}
        currentBuzzer={mockPlayers[1]} // Bob is the winner
        myPlayerId="player-1"
      />
    )

    // Winner
    expect(screen.getByText('Bob')).toBeInTheDocument()

    // Other buzzers section
    expect(screen.getByText('Ont aussi buzzé')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Vous')).toBeInTheDocument() // Current player also buzzed
  })

  it('does not show "Ont aussi buzzé" section when no other buzzers', () => {
    const buzzes: Buzz[] = [
      {
        id: 'buzz-1',
        roomId: 'room-1',
        playerId: 'player-2',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:00Z'),
        isWinner: true,
      },
    ]

    render(
      <BuzzIndicator
        buzzes={buzzes}
        players={mockPlayers}
        currentBuzzer={mockPlayers[1]} // Bob
        myPlayerId="player-1"
      />
    )

    expect(screen.queryByText('Ont aussi buzzé')).not.toBeInTheDocument()
  })

  it('handles unknown player gracefully', () => {
    const buzzes: Buzz[] = [
      {
        id: 'buzz-1',
        roomId: 'room-1',
        playerId: 'unknown-player',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:00Z'),
        isWinner: true,
      },
      {
        id: 'buzz-2',
        roomId: 'room-1',
        playerId: 'another-unknown',
        songId: 'song-1',
        buzzedAt: new Date('2024-01-01T10:05:01Z'),
        isWinner: false,
      },
    ]

    const unknownBuzzer: Player = {
      id: 'unknown-player',
      roomId: 'room-1',
      nickname: 'Unknown',
      avatar: null,
      score: 0,
      isHost: false,
      isOnline: true,
      joinedAt: new Date(),
    }

    render(
      <BuzzIndicator
        buzzes={buzzes}
        players={[unknownBuzzer]} // Only one player in list
        currentBuzzer={unknownBuzzer}
        myPlayerId="player-1"
      />
    )

    // Should show "Joueur inconnu" for player not in list
    expect(screen.getByText('Joueur inconnu')).toBeInTheDocument()
  })
})
