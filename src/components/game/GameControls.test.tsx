import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameControls } from './GameControls'

describe('GameControls', () => {
  const defaultProps = {
    status: 'idle' as const,
    isRevealed: false,
    onValidate: vi.fn(),
    onReveal: vi.fn(),
    onNext: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Play/Pause button', () => {
    it('shows play button when not playing', () => {
      render(<GameControls {...defaultProps} status="idle" />)
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    })

    it('shows pause button when playing', () => {
      render(<GameControls {...defaultProps} status="playing" />)
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    })

    it('calls onPlay when play button is clicked', () => {
      render(<GameControls {...defaultProps} status="idle" />)
      fireEvent.click(screen.getByRole('button', { name: 'Play' }))
      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1)
    })

    it('calls onPause when pause button is clicked', () => {
      render(<GameControls {...defaultProps} status="playing" />)
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
      expect(defaultProps.onPause).toHaveBeenCalledTimes(1)
    })
  })

  describe('Validation buttons', () => {
    it('does not show validation buttons when status is idle', () => {
      render(<GameControls {...defaultProps} status="idle" />)
      expect(screen.queryByText('Correct')).not.toBeInTheDocument()
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    })

    it('does not show validation buttons when status is playing', () => {
      render(<GameControls {...defaultProps} status="playing" />)
      expect(screen.queryByText('Correct')).not.toBeInTheDocument()
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    })

    it('shows validation buttons when status is buzzed', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      expect(screen.getByText('Correct')).toBeInTheDocument()
      expect(screen.getByText('Incorrect')).toBeInTheDocument()
    })

    it('shows validation buttons when status is timer', () => {
      render(<GameControls {...defaultProps} status="timer" />)
      expect(screen.getByText('Correct')).toBeInTheDocument()
      expect(screen.getByText('Incorrect')).toBeInTheDocument()
    })

    it('does not show validation buttons when status is reveal', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      expect(screen.queryByText('Correct')).not.toBeInTheDocument()
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    })

    it('calls onValidate(true) when Correct button is clicked', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      fireEvent.click(screen.getByText('Correct'))
      expect(defaultProps.onValidate).toHaveBeenCalledWith(true)
    })

    it('calls onValidate(false) when Incorrect button is clicked', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      fireEvent.click(screen.getByText('Incorrect'))
      expect(defaultProps.onValidate).toHaveBeenCalledWith(false)
    })

    it('Correct button has green styling', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      const correctButton = screen.getByText('Correct').closest('button')
      expect(correctButton).toHaveClass('bg-green-600')
    })

    it('Incorrect button has red styling', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      const incorrectButton = screen.getByText('Incorrect').closest('button')
      expect(incorrectButton).toHaveClass('bg-red-600')
    })

    it('validation buttons have icons', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      const correctButton = screen.getByText('Correct').closest('button')
      const incorrectButton = screen.getByText('Incorrect').closest('button')
      // Check that buttons contain SVG icons
      expect(correctButton?.querySelector('svg')).toBeInTheDocument()
      expect(incorrectButton?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Next song button', () => {
    it('does not show next button when status is idle', () => {
      render(<GameControls {...defaultProps} status="idle" />)
      expect(screen.queryByText('Chanson suivante')).not.toBeInTheDocument()
    })

    it('does not show next button when status is playing', () => {
      render(<GameControls {...defaultProps} status="playing" />)
      expect(screen.queryByText('Chanson suivante')).not.toBeInTheDocument()
    })

    it('does not show next button when status is buzzed', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      expect(screen.queryByText('Chanson suivante')).not.toBeInTheDocument()
    })

    it('does not show next button when status is timer', () => {
      render(<GameControls {...defaultProps} status="timer" />)
      expect(screen.queryByText('Chanson suivante')).not.toBeInTheDocument()
    })

    it('shows next button when status is reveal', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      expect(screen.getByText('Chanson suivante')).toBeInTheDocument()
    })

    it('calls onNext when next button is clicked', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      fireEvent.click(screen.getByText('Chanson suivante'))
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1)
    })

    it('next button has gradient styling', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      const nextButton = screen.getByText('Chanson suivante').closest('button')
      expect(nextButton).toHaveClass(
        'bg-gradient-to-r',
        'from-pink-500',
        'to-purple-600'
      )
    })

    it('next button has arrow icon', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      const nextButton = screen.getByText('Chanson suivante').closest('button')
      expect(nextButton?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Replay button', () => {
    it('does not show replay button when status is idle', () => {
      render(
        <GameControls {...defaultProps} status="idle" onReplay={vi.fn()} />
      )
      expect(screen.queryByText("Rejouer l'extrait")).not.toBeInTheDocument()
    })

    it('does not show replay button when status is playing', () => {
      render(
        <GameControls {...defaultProps} status="playing" onReplay={vi.fn()} />
      )
      expect(screen.queryByText("Rejouer l'extrait")).not.toBeInTheDocument()
    })

    it('does not show replay button when status is buzzed', () => {
      render(
        <GameControls {...defaultProps} status="buzzed" onReplay={vi.fn()} />
      )
      expect(screen.queryByText("Rejouer l'extrait")).not.toBeInTheDocument()
    })

    it('does not show replay button when status is timer', () => {
      render(
        <GameControls {...defaultProps} status="timer" onReplay={vi.fn()} />
      )
      expect(screen.queryByText("Rejouer l'extrait")).not.toBeInTheDocument()
    })

    it('shows replay button when status is reveal and onReplay provided', () => {
      render(
        <GameControls {...defaultProps} status="reveal" onReplay={vi.fn()} />
      )
      expect(screen.getByText("Rejouer l'extrait")).toBeInTheDocument()
    })

    it('does not show replay button when status is reveal but no onReplay provided', () => {
      render(<GameControls {...defaultProps} status="reveal" />)
      expect(screen.queryByText("Rejouer l'extrait")).not.toBeInTheDocument()
    })

    it('calls onReplay when replay button is clicked', () => {
      const onReplay = vi.fn()
      render(
        <GameControls {...defaultProps} status="reveal" onReplay={onReplay} />
      )
      fireEvent.click(screen.getByText("Rejouer l'extrait"))
      expect(onReplay).toHaveBeenCalledTimes(1)
    })

    it('replay button has appropriate styling', () => {
      render(
        <GameControls {...defaultProps} status="reveal" onReplay={vi.fn()} />
      )
      const replayButton = screen
        .getByText("Rejouer l'extrait")
        .closest('button')
      expect(replayButton).toHaveClass('bg-white/10', 'text-purple-200')
    })

    it('replay button has replay icon', () => {
      render(
        <GameControls {...defaultProps} status="reveal" onReplay={vi.fn()} />
      )
      const replayButton = screen
        .getByText("Rejouer l'extrait")
        .closest('button')
      expect(replayButton?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Reveal button', () => {
    it('does not show reveal button when status is idle', () => {
      render(
        <GameControls {...defaultProps} status="idle" isRevealed={false} />
      )
      expect(screen.queryByText('Révéler la réponse')).not.toBeInTheDocument()
    })

    it('shows reveal button when status is playing and not revealed', () => {
      render(
        <GameControls {...defaultProps} status="playing" isRevealed={false} />
      )
      expect(screen.getByText('Révéler la réponse')).toBeInTheDocument()
    })

    it('shows reveal button when status is buzzed and not revealed', () => {
      render(
        <GameControls {...defaultProps} status="buzzed" isRevealed={false} />
      )
      expect(screen.getByText('Révéler la réponse')).toBeInTheDocument()
    })

    it('shows reveal button when status is timer and not revealed', () => {
      render(
        <GameControls {...defaultProps} status="timer" isRevealed={false} />
      )
      expect(screen.getByText('Révéler la réponse')).toBeInTheDocument()
    })

    it('does not show reveal button when status is reveal', () => {
      render(
        <GameControls {...defaultProps} status="reveal" isRevealed={true} />
      )
      expect(screen.queryByText('Révéler la réponse')).not.toBeInTheDocument()
    })

    it('does not show reveal button when already revealed', () => {
      render(
        <GameControls {...defaultProps} status="playing" isRevealed={true} />
      )
      expect(screen.queryByText('Révéler la réponse')).not.toBeInTheDocument()
    })

    it('calls onReveal when reveal button is clicked', () => {
      render(
        <GameControls {...defaultProps} status="playing" isRevealed={false} />
      )
      fireEvent.click(screen.getByText('Révéler la réponse'))
      expect(defaultProps.onReveal).toHaveBeenCalledTimes(1)
    })

    it('reveal button has appropriate styling', () => {
      render(
        <GameControls {...defaultProps} status="playing" isRevealed={false} />
      )
      const revealButton = screen
        .getByText('Révéler la réponse')
        .closest('button')
      expect(revealButton).toHaveClass('bg-white/10', 'text-purple-200')
    })

    it('reveal button has eye icon', () => {
      render(
        <GameControls {...defaultProps} status="playing" isRevealed={false} />
      )
      const revealButton = screen
        .getByText('Révéler la réponse')
        .closest('button')
      expect(revealButton?.querySelector('svg')).toBeInTheDocument()
    })
  })
})
