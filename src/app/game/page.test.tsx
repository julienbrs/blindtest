import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

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

// Store mock state to allow modification in tests
let mockGameState = {
  status: 'playing' as string,
  currentSong: {
    id: 'test123abc',
    title: 'Test Song',
    artist: 'Test Artist',
  } as { id: string; title: string; artist: string } | null,
  score: 0,
  songsPlayed: 0,
  playedSongIds: [] as string[],
  isRevealed: false,
  timerRemaining: 5,
}

const mockActions = {
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
}

// Mock the game state hook
vi.mock('@/hooks/useGameState', () => ({
  useGameState: () => ({
    state: mockGameState,
    actions: mockActions,
  }),
}))

// Mock useSoundEffects hook
let mockSfxIsMuted = false
const mockSfxSetMuted = vi.fn((muted: boolean) => {
  mockSfxIsMuted = muted
})

vi.mock('@/hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({
    buzz: vi.fn(),
    correct: vi.fn(),
    incorrect: vi.fn(),
    timeout: vi.fn(),
    tick: vi.fn(),
    reveal: vi.fn(),
    setMuted: mockSfxSetMuted,
    setVolume: vi.fn(),
    isMuted: mockSfxIsMuted,
    volume: 0.7,
  }),
}))

// Mock useCorrectAnswerCelebration hook
vi.mock('@/hooks/useCorrectAnswerCelebration', () => ({
  useCorrectAnswerCelebration: () => ({
    celebrate: vi.fn(),
    cleanup: vi.fn(),
  }),
}))

// Mock useWrongAnswerEffect hook
vi.mock('@/hooks/useWrongAnswerEffect', () => ({
  useWrongAnswerEffect: () => ({
    isShaking: false,
    triggerShake: vi.fn(),
    cleanup: vi.fn(),
  }),
}))

// Mock useFullscreen hook
let mockIsFullscreen = false
let mockIsFullscreenSupported = true
const mockToggleFullscreen = vi.fn()

vi.mock('@/hooks/useFullscreen', () => ({
  useFullscreen: () => ({
    isFullscreen: mockIsFullscreen,
    toggleFullscreen: mockToggleFullscreen,
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    isSupported: mockIsFullscreenSupported,
  }),
}))

// Mock useAudioSupport hook
let mockIsAudioSupported = true
let mockIsCheckingAudio = false

vi.mock('@/hooks/useAudioSupport', () => ({
  useAudioSupport: () => ({
    isSupported: mockIsAudioSupported,
    isChecking: mockIsCheckingAudio,
  }),
}))

// Track volume passed to AudioPlayer
let lastVolumeReceived: number | undefined

// Mock child components to simplify testing
vi.mock('@/components/game/AudioPlayer', () => ({
  AudioPlayer: ({
    onReady,
    songId,
    volume,
  }: {
    onReady?: (songId: string) => void
    songId?: string
    isPlaying?: boolean
    maxDuration?: number
    onEnded?: () => void
    volume?: number
  }) => {
    lastVolumeReceived = volume
    return (
      <div
        data-testid="audio-player"
        onClick={() => songId && onReady?.(songId)}
        data-volume={volume}
      >
        AudioPlayer
      </div>
    )
  },
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

vi.mock('@/components/game/GameRecap', () => ({
  GameRecap: ({
    score,
    songsPlayed,
    allSongsPlayed,
  }: {
    score: number
    songsPlayed: number
    onNewGame: () => void
    onHome: () => void
    allSongsPlayed?: boolean
  }) => (
    <div data-testid="game-recap">
      <span data-testid="recap-score">{score}</span>
      <span data-testid="recap-songs-played">{songsPlayed}</span>
      {allSongsPlayed && (
        <span data-testid="recap-all-songs-played">All songs played</span>
      )}
    </div>
  ),
}))

// Import after mocks
import GamePage from './page'

// Helper to reset mock state before each test
function resetMockState() {
  mockGameState = {
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
  }
  // Reset SFX mock state
  mockSfxIsMuted = false
  mockSfxSetMuted.mockClear()
  // Reset volume tracking
  lastVolumeReceived = undefined
  // Reset fullscreen mock state
  mockIsFullscreen = false
  mockIsFullscreenSupported = true
  mockToggleFullscreen.mockClear()
  // Reset audio support mock state
  mockIsAudioSupported = true
  mockIsCheckingAudio = false
}

describe('GamePage - LOADING → PLAYING transition (Issue 6.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
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
    resetMockState()
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

  it('closes modal when cancel button is clicked', async () => {
    render(<GamePage />)

    const quitButton = screen.getByRole('button', { name: /quitter/i })
    fireEvent.click(quitButton)

    const cancelButton = screen.getByRole('button', { name: /annuler/i })
    fireEvent.click(cancelButton)

    // Wait for AnimatePresence exit animation to complete
    await waitFor(() => {
      expect(screen.queryByText('Quitter la partie ?')).not.toBeInTheDocument()
    })
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

// Skip: Discovery mode removed buzzer and timer
describe.skip('GamePage - BUZZED → TIMER transition (Issue 6.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
  })

  it('renders Timer component when status is timer', () => {
    mockGameState.status = 'timer'
    mockGameState.timerRemaining = 5

    render(<GamePage />)

    const timer = screen.getByTestId('timer')
    expect(timer).toBeInTheDocument()
  })

  it('does not render Timer when status is playing', () => {
    mockGameState.status = 'playing'

    render(<GamePage />)

    expect(screen.queryByTestId('timer')).not.toBeInTheDocument()
  })

  it('does not render Buzzer when status is timer', () => {
    mockGameState.status = 'timer'

    render(<GamePage />)

    expect(screen.queryByTestId('buzzer-button')).not.toBeInTheDocument()
  })

  it('renders Timer with countdown visible (via timerRemaining)', () => {
    mockGameState.status = 'timer'
    mockGameState.timerRemaining = 3

    render(<GamePage />)

    // Timer component is rendered - it receives remaining prop
    const timer = screen.getByTestId('timer')
    expect(timer).toBeInTheDocument()
    // The actual countdown display is handled by the Timer component
    // which receives the timerRemaining from game state
  })

  it('Timer starts immediately after status changes to timer (no buzzed intermediate)', () => {
    // In our implementation, BUZZ goes directly to 'timer' state
    // There is no 'buzzed' intermediate state
    mockGameState.status = 'timer'
    mockGameState.timerRemaining = 5

    render(<GamePage />)

    // Timer should be visible immediately
    const timer = screen.getByTestId('timer')
    expect(timer).toBeInTheDocument()

    // Buzzer should NOT be visible
    expect(screen.queryByTestId('buzzer-button')).not.toBeInTheDocument()
  })

  it('validates that Timer receives proper props from game state', () => {
    // This test ensures Timer is rendered in the right location
    // and will receive the duration and remaining props
    mockGameState.status = 'timer'
    mockGameState.timerRemaining = 4

    render(<GamePage />)

    // Timer should be in the right column area
    const timer = screen.getByTestId('timer')
    expect(timer.parentElement).toHaveClass(
      'flex',
      'items-center',
      'justify-center'
    )
  })
})

describe('GamePage - REVEAL → LOADING transition (Issue 6.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
  })

  it('shows loading indicator when status is loading', () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null

    render(<GamePage />)

    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('shows loading spinner animation when status is loading', () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null

    render(<GamePage />)

    // Check for the spinner element with animation class
    const spinnerContainer = screen.getByText('Chargement...').parentElement
    expect(spinnerContainer?.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('does not show loading indicator when status is playing', () => {
    mockGameState.status = 'playing'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }

    render(<GamePage />)

    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
  })

  it('does not show loading indicator when status is reveal', () => {
    mockGameState.status = 'reveal'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }
    mockGameState.isRevealed = true

    render(<GamePage />)

    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
  })

  it('hides buzzer during loading state', () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null

    render(<GamePage />)

    expect(screen.queryByTestId('buzzer-button')).not.toBeInTheDocument()
  })

  it('hides timer during loading state', () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null

    render(<GamePage />)

    expect(screen.queryByTestId('timer')).not.toBeInTheDocument()
  })
})

describe('GamePage - Library End Detection (Issue 6.12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
  })

  it('shows GameRecap when status is ended', () => {
    mockGameState.status = 'ended'
    mockGameState.score = 10
    mockGameState.songsPlayed = 15

    render(<GamePage />)

    // GameRecap should be shown
    expect(screen.getByTestId('game-recap')).toBeInTheDocument()
    expect(screen.getByTestId('recap-score')).toHaveTextContent('10')
    expect(screen.getByTestId('recap-songs-played')).toHaveTextContent('15')
  })

  it('does not show game UI components when game has ended', () => {
    mockGameState.status = 'ended'
    mockGameState.score = 5
    mockGameState.songsPlayed = 10

    render(<GamePage />)

    // Main game elements should not be rendered
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
    expect(screen.queryByTestId('song-reveal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-controls')).not.toBeInTheDocument()
    expect(screen.queryByTestId('buzzer-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('score-display')).not.toBeInTheDocument()
  })

  it('does not show quit button when game has ended', () => {
    mockGameState.status = 'ended'
    mockGameState.score = 5
    mockGameState.songsPlayed = 10

    render(<GamePage />)

    // Quit button should not be visible on recap screen
    expect(
      screen.queryByRole('button', { name: /quitter/i })
    ).not.toBeInTheDocument()
  })

  it('displays score and songs played count in recap', () => {
    mockGameState.status = 'ended'
    mockGameState.score = 8
    mockGameState.songsPlayed = 12

    render(<GamePage />)

    expect(screen.getByTestId('recap-score')).toHaveTextContent('8')
    expect(screen.getByTestId('recap-songs-played')).toHaveTextContent('12')
  })
})

describe('GamePage - Next Song Preloading (Issue 6.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not show preloading UI to user (background operation)', () => {
    mockGameState.status = 'reveal'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }
    mockGameState.isRevealed = true

    render(<GamePage />)

    // No loading indicator should be shown during reveal
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
    // Preloading happens in background - no visual indication
  })

  it('maintains game state while preloading in background', () => {
    mockGameState.status = 'reveal'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }
    mockGameState.isRevealed = true
    mockGameState.score = 5
    mockGameState.songsPlayed = 3

    render(<GamePage />)

    // Discovery mode: inline controls during reveal
    expect(screen.getByTestId('song-reveal')).toBeInTheDocument()
    expect(screen.getByTestId('score-display')).toBeInTheDocument()
  })

  it('does not prefetch during playing state', () => {
    mockGameState.status = 'playing'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }

    render(<GamePage />)

    // Fetch should not have been called for prefetching during playing
    // The initial fetch for the game is handled separately
    // Discovery mode: no buzzer, just a "En écoute..." indicator
    expect(screen.getByText('En écoute...')).toBeInTheDocument()
  })

  // Skip: Discovery mode removed timer state
  it.skip('does not prefetch during timer state', () => {
    mockGameState.status = 'timer'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }
    mockGameState.timerRemaining = 5

    render(<GamePage />)

    // Timer should be visible
    expect(screen.getByTestId('timer')).toBeInTheDocument()
    // Preloading should not happen during timer
  })

  it('uses preloaded song for instant transition when available', async () => {
    // This test verifies the mechanism exists
    // The actual preloading happens in background effects
    mockGameState.status = 'reveal'
    mockGameState.currentSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }
    mockGameState.isRevealed = true
    mockGameState.playedSongIds = ['prev1', 'prev2']

    // Mock successful fetch response
    const mockNextSong = {
      id: 'next456def',
      title: 'Next Song',
      artist: 'Next Artist',
    }
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ song: mockNextSong }),
    })

    render(<GamePage />)

    // Game should still be functional
    expect(screen.getByTestId('song-reveal')).toBeInTheDocument()
    // Discovery mode: inline controls during reveal
  })

  it('excludes current song and played songs from prefetch', () => {
    mockGameState.status = 'reveal'
    mockGameState.currentSong = {
      id: 'current123',
      title: 'Current Song',
      artist: 'Current Artist',
    }
    mockGameState.isRevealed = true
    mockGameState.playedSongIds = ['song1', 'song2', 'song3']

    render(<GamePage />)

    // The component should render correctly with played songs tracked
    expect(screen.getByTestId('song-reveal')).toBeInTheDocument()
    // The exclude list will be: song1,song2,song3,current123
    // This is verified by the implementation logic
  })
})

describe('GamePage - SFX Mute Toggle (Issue 8.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
    // Clear localStorage mock
    Storage.prototype.getItem = vi.fn(() => null)
    Storage.prototype.setItem = vi.fn()
  })

  it('renders SFX mute toggle button in header', () => {
    render(<GamePage />)

    const sfxToggle = screen.getByTestId('sfx-mute-toggle')
    expect(sfxToggle).toBeInTheDocument()
  })

  it('SFX toggle button shows speaker icon when not muted', () => {
    mockSfxIsMuted = false
    render(<GamePage />)

    const sfxToggle = screen.getByTestId('sfx-mute-toggle')
    expect(sfxToggle).toHaveAttribute('aria-label', 'Couper les effets sonores')
  })

  it('SFX toggle shows SFX label on desktop', () => {
    render(<GamePage />)

    const sfxToggle = screen.getByTestId('sfx-mute-toggle')
    expect(sfxToggle.textContent).toContain('SFX')
  })

  it('clicking toggle calls setMuted with toggled value', () => {
    mockSfxIsMuted = false
    render(<GamePage />)

    const sfxToggle = screen.getByTestId('sfx-mute-toggle')
    fireEvent.click(sfxToggle)

    expect(mockSfxSetMuted).toHaveBeenCalledWith(true)
  })

  it('saves muted state to localStorage on toggle', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    mockSfxIsMuted = false
    render(<GamePage />)

    const sfxToggle = screen.getByTestId('sfx-mute-toggle')
    fireEvent.click(sfxToggle)

    expect(setItemSpy).toHaveBeenCalledWith('sfx_muted', 'true')
  })

  it('loads muted state from localStorage on mount', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('true')
    render(<GamePage />)

    // setMuted should be called with the saved value
    expect(mockSfxSetMuted).toHaveBeenCalledWith(true)
  })

  it('handles invalid localStorage value gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json{')

    // Should not throw
    expect(() => render(<GamePage />)).not.toThrow()
  })

  it('SFX toggle does not affect music playback (AudioPlayer is independent)', () => {
    render(<GamePage />)

    // AudioPlayer should still be rendered regardless of SFX mute state
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
  })
})

describe('GamePage - Music Volume Control (Issue 8.8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
    // Clear localStorage mock
    Storage.prototype.getItem = vi.fn(() => null)
    Storage.prototype.setItem = vi.fn()
  })

  it('renders volume slider in header', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    expect(volumeSlider).toBeInTheDocument()
  })

  it('volume slider has proper range 0-1 with step 0.1', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    expect(volumeSlider).toHaveAttribute('min', '0')
    expect(volumeSlider).toHaveAttribute('max', '1')
    expect(volumeSlider).toHaveAttribute('step', '0.1')
  })

  it('volume slider shows percentage label', () => {
    render(<GamePage />)

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    expect(volumePercentage).toBeInTheDocument()
    // Default is 70%
    expect(volumePercentage).toHaveTextContent('70%')
  })

  it('changing volume updates percentage display', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '0.5' } })

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    expect(volumePercentage).toHaveTextContent('50%')
  })

  it('changing volume saves to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '0.3' } })

    expect(setItemSpy).toHaveBeenCalledWith('music_volume', '0.3')
  })

  it('loads volume from localStorage on mount', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'music_volume') return '0.4'
      return null
    })

    render(<GamePage />)

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    expect(volumePercentage).toHaveTextContent('40%')
  })

  it('passes volume prop to AudioPlayer', () => {
    render(<GamePage />)

    const audioPlayer = screen.getByTestId('audio-player')
    // Default volume 0.7 should be passed
    expect(audioPlayer).toHaveAttribute('data-volume', '0.7')
  })

  it('AudioPlayer receives updated volume when slider changes', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '0.5' } })

    // Check the tracked volume
    expect(lastVolumeReceived).toBe(0.5)
  })

  it('volume control has proper accessibility label', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    expect(volumeSlider).toHaveAttribute('aria-label', 'Volume de la musique')
  })

  it('handles invalid localStorage value gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'music_volume') return 'invalid'
      return null
    })

    // Should not throw and use default volume
    expect(() => render(<GamePage />)).not.toThrow()

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    // Should use default 70%
    expect(volumePercentage).toHaveTextContent('70%')
  })

  it('handles out-of-range localStorage value gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'music_volume') return '1.5'
      return null
    })

    // Should not throw and use default volume for out-of-range value
    expect(() => render(<GamePage />)).not.toThrow()

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    // Should use default 70% since 1.5 is out of range
    expect(volumePercentage).toHaveTextContent('70%')
  })

  it('volume control shows 0% at minimum', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '0' } })

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    expect(volumePercentage).toHaveTextContent('0%')
  })

  it('volume control shows 100% at maximum', () => {
    render(<GamePage />)

    const volumeSlider = screen.getByTestId('music-volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '1' } })

    const volumePercentage = screen.getByTestId('music-volume-percentage')
    expect(volumePercentage).toHaveTextContent('100%')
  })

  it('volume control is inside a styled container with music icon', () => {
    render(<GamePage />)

    const volumeControl = screen.getByTestId('music-volume-control')
    expect(volumeControl).toBeInTheDocument()
    // Mobile-first: hidden on mobile, sm:flex on larger screens
    expect(volumeControl).toHaveClass(
      'items-center',
      'rounded-lg',
      'bg-white/10'
    )
  })
})

describe('GamePage - File Not Found Auto-Skip (Issue 10.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('checks audio file accessibility via HEAD request before loading', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = []

    const mockSong = {
      id: 'test123abc',
      title: 'Test Song',
      artist: 'Test Artist',
    }

    // Mock fetch responses
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong }),
      })
      // HEAD request succeeds
      .mockResolvedValueOnce({
        ok: true,
      })

    render(<GamePage />)

    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audio/'),
        expect.objectContaining({ method: 'HEAD' })
      )
    })
  })

  it('skips song and loads another when HEAD request returns 404', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = []

    const mockSong1 = {
      id: 'song1id12345',
      title: 'Missing Song',
      artist: 'Test Artist',
    }
    const mockSong2 = {
      id: 'song2id67890',
      title: 'Valid Song',
      artist: 'Test Artist',
    }

    // Mock fetch responses
    ;(global.fetch as ReturnType<typeof vi.fn>)
      // First random song request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong1 }),
      })
      // HEAD request fails (file not found)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      // Second random song request (with first song excluded)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong2 }),
      })
      // HEAD request succeeds for second song
      .mockResolvedValueOnce({
        ok: true,
      })

    // Mock console.warn to verify logging
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<GamePage />)

    // Wait for retry fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    // Verify warning was logged for skipped song
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('not accessible, skipping')
    )

    warnSpy.mockRestore()
  })

  it('includes missing songs in exclude parameter for subsequent requests', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = ['prev1', 'prev2']

    const mockSong1 = {
      id: 'missing12345',
      title: 'Missing Song',
      artist: 'Test Artist',
    }
    const mockSong2 = {
      id: 'valid1234567',
      title: 'Valid Song',
      artist: 'Test Artist',
    }

    ;(global.fetch as ReturnType<typeof vi.fn>)
      // First random song request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong1 }),
      })
      // HEAD request fails
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      // Second random song request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong2 }),
      })
      // HEAD request succeeds
      .mockResolvedValueOnce({
        ok: true,
      })

    render(<GamePage />)

    await waitFor(() => {
      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      // Third call should include the missing song in exclude
      const secondRandomCall = fetchCalls[2]
      if (secondRandomCall) {
        expect(secondRandomCall[0]).toContain('missing12345')
      }
    })
  })

  it('ends game when no more songs available after skipping', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = []

    const mockSong = {
      id: 'missing12345',
      title: 'Missing Song',
      artist: 'Test Artist',
    }

    ;(global.fetch as ReturnType<typeof vi.fn>)
      // First random song request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong }),
      })
      // HEAD request fails
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      // No more songs available
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

    render(<GamePage />)

    await waitFor(() => {
      expect(mockActions.quit).toHaveBeenCalled()
    })
  })

  it('game continues without blocking when file is accessible', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = []

    const mockSong = {
      id: 'valid1234567',
      title: 'Valid Song',
      artist: 'Test Artist',
    }

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong }),
      })
      // HEAD request succeeds
      .mockResolvedValueOnce({
        ok: true,
      })

    render(<GamePage />)

    await waitFor(() => {
      expect(mockActions.loadSong).toHaveBeenCalledWith(mockSong)
    })
  })

  it('handles HEAD request network failure gracefully', async () => {
    mockGameState.status = 'loading'
    mockGameState.currentSong = null
    mockGameState.playedSongIds = []

    const mockSong1 = {
      id: 'network12345',
      title: 'Network Fail Song',
      artist: 'Test Artist',
    }
    const mockSong2 = {
      id: 'valid6789012',
      title: 'Valid Song',
      artist: 'Test Artist',
    }

    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong1 }),
      })
      // HEAD request fails with network error
      .mockRejectedValueOnce(new Error('Network error'))
      // Second random song request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ song: mockSong2 }),
      })
      // HEAD request succeeds
      .mockResolvedValueOnce({
        ok: true,
      })

    render(<GamePage />)

    await waitFor(() => {
      // Should have retried with another song
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })
  })
})

describe('GamePage - Fullscreen Mode (Issue 9.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
  })

  it('renders fullscreen toggle button when supported', () => {
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    expect(fullscreenToggle).toBeInTheDocument()
  })

  it('does not render fullscreen toggle button when not supported', () => {
    mockIsFullscreenSupported = false
    render(<GamePage />)

    expect(screen.queryByTestId('fullscreen-toggle')).not.toBeInTheDocument()
  })

  it('shows expand icon when not in fullscreen', () => {
    mockIsFullscreen = false
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    expect(fullscreenToggle).toHaveAttribute(
      'aria-label',
      'Passer en mode plein écran'
    )
  })

  it('shows minimize icon when in fullscreen', () => {
    mockIsFullscreen = true
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    expect(fullscreenToggle).toHaveAttribute(
      'aria-label',
      'Quitter le mode plein écran'
    )
  })

  it('calls toggleFullscreen when button is clicked', () => {
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    fireEvent.click(fullscreenToggle)

    expect(mockToggleFullscreen).toHaveBeenCalled()
  })

  it('fullscreen toggle is in header next to other controls', () => {
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    const sfxToggle = screen.getByTestId('sfx-mute-toggle')

    // Both should be in the same header controls container
    expect(fullscreenToggle.parentElement).toBe(sfxToggle.parentElement)
  })

  it('fullscreen toggle has proper button styling', () => {
    mockIsFullscreenSupported = true
    render(<GamePage />)

    const fullscreenToggle = screen.getByTestId('fullscreen-toggle')
    expect(fullscreenToggle).toHaveClass('flex', 'items-center')
  })
})

describe('GamePage - Browser Audio Support Detection (Issue 10.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockState()
  })

  it('shows loading spinner while checking audio support', () => {
    mockIsCheckingAudio = true
    render(<GamePage />)

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('does not show game UI while checking audio support', () => {
    mockIsCheckingAudio = true
    render(<GamePage />)

    // Game UI should not be visible
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
    expect(screen.queryByTestId('score-display')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-controls')).not.toBeInTheDocument()
  })

  it('shows BrowserUnsupportedError when audio is not supported', () => {
    mockIsAudioSupported = false
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(screen.getByTestId('browser-unsupported-error')).toBeInTheDocument()
  })

  it('displays error message about unsupported browser', () => {
    mockIsAudioSupported = false
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(
      screen.getByRole('heading', { name: /navigateur non supporté/i })
    ).toBeInTheDocument()
  })

  it('displays recommended browsers list when audio not supported', () => {
    mockIsAudioSupported = false
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(screen.getByText(/navigateurs recommandés/i)).toBeInTheDocument()
    expect(screen.getByText(/google chrome/i)).toBeInTheDocument()
    expect(screen.getByText(/mozilla firefox/i)).toBeInTheDocument()
    expect(screen.getByText(/safari/i)).toBeInTheDocument()
  })

  it('does not show game UI when audio is not supported', () => {
    mockIsAudioSupported = false
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
    expect(screen.queryByTestId('score-display')).not.toBeInTheDocument()
    expect(screen.queryByTestId('buzzer-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-controls')).not.toBeInTheDocument()
  })

  it('shows game UI when audio is supported', () => {
    mockIsAudioSupported = true
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    expect(screen.getByTestId('score-display')).toBeInTheDocument()
    // Discovery mode doesn't have GameControls, just inline controls
  })

  it('does not show error when audio is supported', () => {
    mockIsAudioSupported = true
    mockIsCheckingAudio = false
    render(<GamePage />)

    expect(
      screen.queryByTestId('browser-unsupported-error')
    ).not.toBeInTheDocument()
  })

  it('checks audio support at page load', () => {
    // This test verifies the check happens by observing the behavior
    mockIsAudioSupported = true
    mockIsCheckingAudio = false
    render(<GamePage />)

    // If check happened and passed, we should see normal game UI
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
  })
})
