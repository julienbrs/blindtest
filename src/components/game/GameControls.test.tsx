import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameControls } from './GameControls'

describe('GameControls', () => {
  const defaultProps = {
    status: 'idle' as const,
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

  describe('Status indicator', () => {
    it('displays current status', () => {
      render(<GameControls {...defaultProps} status="buzzed" />)
      expect(screen.getByText('État: buzzed')).toBeInTheDocument()
    })
  })
})
