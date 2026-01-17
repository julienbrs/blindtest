import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameRecap } from './GameRecap'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
    }: {
      children?: React.ReactNode
      className?: string
      style?: React.CSSProperties
    }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}))

describe('GameRecap', () => {
  const mockOnNewGame = vi.fn()
  const mockOnHome = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the recap title', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Partie terminée !')).toBeInTheDocument()
  })

  it('displays the score correctly', () => {
    render(
      <GameRecap
        score={7}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    // Score appears twice: once in Score box, once in Bonnes réponses box
    const scoreElements = screen.getAllByText('7')
    expect(scoreElements.length).toBe(2)
  })

  it('displays the songs played correctly', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={12}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Chansons jouées')).toBeInTheDocument()
  })

  it('calculates success rate correctly', () => {
    render(
      <GameRecap
        score={3}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('shows 0% rate when no songs played', () => {
    render(
      <GameRecap
        score={0}
        songsPlayed={0}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Aucune chanson jouée')).toBeInTheDocument()
  })

  it('shows perfect score message at 100%', () => {
    render(
      <GameRecap
        score={10}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Score parfait !')).toBeInTheDocument()
  })

  it('shows excellent message at 80%+', () => {
    render(
      <GameRecap
        score={8}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Excellent !')).toBeInTheDocument()
  })

  it('shows good job message at 60%+', () => {
    render(
      <GameRecap
        score={6}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Bien joué !')).toBeInTheDocument()
  })

  it('shows not bad message at 40%+', () => {
    render(
      <GameRecap
        score={4}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Pas mal !')).toBeInTheDocument()
  })

  it('shows encouragement message at 20%+', () => {
    render(
      <GameRecap
        score={2}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Continuez à vous entraîner !')).toBeInTheDocument()
  })

  it('shows encouraging message below 20%', () => {
    render(
      <GameRecap
        score={1}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(
      screen.getByText('La prochaine fois sera meilleure !')
    ).toBeInTheDocument()
  })

  it('calls onNewGame when new game button is clicked', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    fireEvent.click(screen.getByText('Nouvelle partie'))
    expect(mockOnNewGame).toHaveBeenCalledTimes(1)
  })

  it('calls onHome when home button is clicked', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    fireEvent.click(screen.getByText("Retour à l'accueil"))
    expect(mockOnHome).toHaveBeenCalledTimes(1)
  })

  it('applies green color for success rate >= 50%', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    const rateElement = screen.getByText('50%')
    expect(rateElement).toHaveClass('text-green-400')
  })

  it('applies yellow color for success rate < 50%', () => {
    render(
      <GameRecap
        score={4}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    const rateElement = screen.getByText('40%')
    expect(rateElement).toHaveClass('text-yellow-400')
  })

  it('renders all stat labels', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Chansons jouées')).toBeInTheDocument()
    expect(screen.getByText('Bonnes réponses')).toBeInTheDocument()
    expect(screen.getByText('Taux de réussite')).toBeInTheDocument()
  })

  it('has proper button styling', () => {
    render(
      <GameRecap
        score={5}
        songsPlayed={10}
        onNewGame={mockOnNewGame}
        onHome={mockOnHome}
      />
    )

    const newGameButton = screen.getByText('Nouvelle partie')
    expect(newGameButton).toHaveClass('bg-gradient-to-r')
    expect(newGameButton).toHaveClass('from-pink-500')
    expect(newGameButton).toHaveClass('to-purple-600')
  })
})
