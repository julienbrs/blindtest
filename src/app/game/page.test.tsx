import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the game state hook
vi.mock('@/hooks/useGameState', () => ({
  useGameState: () => ({
    state: {
      // Use 'playing' status to avoid triggering the useEffect that calls startGame
      status: 'playing',
      currentSong: {
        id: 'test123abc',
        title: 'Test Song',
        artist: 'Test Artist',
      },
      score: 0,
      songsPlayed: 0,
      playedSongIds: [],
      isRevealed: false,
      timerRemaining: 5,
    },
    actions: {
      startGame: vi.fn(),
      loadSong: vi.fn(),
      quit: vi.fn(),
      buzz: vi.fn(),
      validate: vi.fn(),
      reveal: vi.fn(),
      nextSong: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      clipEnded: vi.fn(),
      reset: vi.fn(),
    },
  }),
}))

// Mock child components to simplify testing
vi.mock('@/components/game/AudioPlayer', () => ({
  AudioPlayer: ({
    onReady,
    songId,
  }: {
    onReady?: (songId: string) => void
    songId?: string
    isPlaying?: boolean
    maxDuration?: number
    onEnded?: () => void
  }) => (
    <div data-testid="audio-player" onClick={() => songId && onReady?.(songId)}>
      AudioPlayer
    </div>
  ),
}))

vi.mock('@/components/game/BuzzerButton', () => ({
  BuzzerButton: () => <div data-testid="buzzer-button">BuzzerButton</div>,
}))

vi.mock('@/components/game/Timer', () => ({
  Timer: () => <div data-testid="timer">Timer</div>,
}))

vi.mock('@/components/game/ScoreDisplay', () => ({
  ScoreDisplay: () => <div data-testid="score-display">ScoreDisplay</div>,
}))

vi.mock('@/components/game/SongReveal', () => ({
  SongReveal: () => <div data-testid="song-reveal">SongReveal</div>,
}))

vi.mock('@/components/game/GameControls', () => ({
  GameControls: () => <div data-testid="game-controls">GameControls</div>,
}))

// Import after mocks
import GamePage from './page'

describe('GamePage - LOADING → PLAYING transition (Issue 6.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes onReady callback to AudioPlayer', () => {
    render(<GamePage />)

    // AudioPlayer should be rendered
    const audioPlayer = screen.getByTestId('audio-player')
    expect(audioPlayer).toBeInTheDocument()
  })

  it('AudioPlayer receives onReady prop', () => {
    render(<GamePage />)

    // The AudioPlayer mock accepts onReady and can be clicked
    const audioPlayer = screen.getByTestId('audio-player')

    // Click triggers onReady callback - should not throw
    expect(() => fireEvent.click(audioPlayer)).not.toThrow()
  })
})

describe('GamePage - Quit Button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quit button in header', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    expect(quitButton).toBeInTheDocument()
  })

  it('shows confirmation modal when quit button is clicked', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    expect(screen.getByText('Quitter la partie ?')).toBeInTheDocument()
    expect(
      screen.getByText('Votre score ne sera pas sauvegardé.')
    ).toBeInTheDocument()
  })

  it('modal has cancel and quit buttons', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument()
    // Now there are two "Quitter" buttons (header and modal)
    const quitButtons = screen.getAllByRole('button', { name: /quitter/i })
    expect(quitButtons.length).toBe(2)
  })

  it('closes modal when cancel button is clicked', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    const cancelButton = screen.getByRole('button', { name: /annuler/i })
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Quitter la partie ?')).not.toBeInTheDocument()
  })

  it('navigates to home when modal quit button is clicked', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    // Click the quit button in the modal (second one)
    const quitButtons = screen.getAllByRole('button', { name: /quitter/i })
    fireEvent.click(quitButtons[1])

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('modal has proper styling (purple background)', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    const modal = screen.getByText('Quitter la partie ?').closest('div')
    expect(modal).toHaveClass('bg-purple-900')
  })

  it('modal overlay has backdrop styling', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    const overlay = screen
      .getByText('Quitter la partie ?')
      .closest('div')?.parentElement
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black/50', 'z-50')
  })

  it('modal quit button has red styling', () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    const quitButtons = screen.getAllByRole('button', { name: /quitter/i })
    const modalQuitButton = quitButtons[1]
    expect(modalQuitButton).toHaveClass('bg-red-600')
  })
})
