import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { SyncedAudioPlayer } from './SyncedAudioPlayer'

// Store original HTMLMediaElement prototype methods
const originalVolumeSetter = Object.getOwnPropertyDescriptor(
  HTMLMediaElement.prototype,
  'volume'
)?.set

describe('SyncedAudioPlayer', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
  })

  describe('Basic rendering', () => {
    it('should render with time display showing maxDuration', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Should show max duration in time display (0:20 for 20 seconds)
      expect(screen.getByText('0:20')).toBeInTheDocument()
      // Current time starts at 0
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })

    it('should display progress bar at 0% initially', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Progress bar should be at 0%
      const progressBar = document.querySelector('[style*="width"]')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('should format time correctly for 60 seconds', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={60}
          onEnded={onEnded}
        />
      )

      expect(screen.getByText('1:00')).toBeInTheDocument()
    })

    it('should have audio element rendered', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Audio element should exist
      const audio = document.querySelector('audio')
      expect(audio).toBeInTheDocument()
    })

    it('should handle null songId gracefully', () => {
      const onEnded = vi.fn()

      // Should not throw when songId is null
      expect(() => {
        render(
          <SyncedAudioPlayer
            songId={null}
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
          />
        )
      }).not.toThrow()

      // Should still show time display
      expect(screen.getByText('0:20')).toBeInTheDocument()
    })

    it('should use pink-purple gradient initially (not near end)', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Progress bar should have pink-purple gradient initially (not near end)
      const progressBar = document.querySelector('.bg-gradient-to-r')
      expect(progressBar).toHaveClass('from-pink-500', 'to-purple-500')
    })
  })

  describe('onReady callback', () => {
    it('should accept optional onReady prop with songId parameter', () => {
      const onEnded = vi.fn()
      const onReady = vi.fn()

      // Should not throw when onReady is provided
      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
            onReady={onReady}
          />
        )
      }).not.toThrow()
    })

    it('should render without onReady prop', () => {
      const onEnded = vi.fn()

      // Should not throw when onReady is not provided
      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Volume control', () => {
    let volumeSetterSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      volumeSetterSpy = vi.fn()
      Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
        set: volumeSetterSpy,
        configurable: true,
      })
    })

    afterEach(() => {
      cleanup()
      // Restore original volume setter
      if (originalVolumeSetter) {
        Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
          set: originalVolumeSetter,
          configurable: true,
        })
      }
    })

    it('should accept optional volume prop', () => {
      const onEnded = vi.fn()

      // Should not throw when volume is provided
      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
            volume={0.5}
          />
        )
      }).not.toThrow()
    })

    it('should render without volume prop (uses default 0.7)', () => {
      const onEnded = vi.fn()

      // Should not throw when volume is not provided
      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
          />
        )
      }).not.toThrow()

      // Default volume should be applied
      expect(volumeSetterSpy).toHaveBeenCalledWith(0.7)
    })

    it('should apply volume to audio element', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
          volume={0.5}
        />
      )

      // Volume should be set to 0.5
      expect(volumeSetterSpy).toHaveBeenCalledWith(0.5)
    })

    it('should clamp volume to range 0-1 (minimum)', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
          volume={-0.5}
        />
      )

      // Volume should be clamped to 0
      expect(volumeSetterSpy).toHaveBeenCalledWith(0)
    })

    it('should clamp volume to range 0-1 (maximum)', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
          volume={1.5}
        />
      )

      // Volume should be clamped to 1
      expect(volumeSetterSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('Sync timing logic', () => {
    it('should accept startedAt prop as Date', () => {
      const onEnded = vi.fn()
      const startTime = new Date(Date.now() + 1000) // 1 second in future

      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={startTime}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
          />
        )
      }).not.toThrow()
    })

    it('should accept null startedAt prop', () => {
      const onEnded = vi.fn()

      expect(() => {
        render(
          <SyncedAudioPlayer
            songId="abc123def456"
            startedAt={null}
            isPlaying={false}
            maxDuration={20}
            onEnded={onEnded}
          />
        )
      }).not.toThrow()
    })

    it('should render with startedAt prop for future sync', () => {
      const onEnded = vi.fn()
      const startTime = new Date(Date.now() + 1000) // 1 second in future

      // Should render without errors with future startedAt
      render(
        <SyncedAudioPlayer
          songId="abc123def456"
          startedAt={startTime}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      expect(screen.getByText('0:20')).toBeInTheDocument()
    })

    it('should accept startPosition prop', () => {
      const onEnded = vi.fn()

      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
          startPosition={10}
        />
      )

      // Should render successfully
      expect(screen.getByText('0:20')).toBeInTheDocument()
    })
  })

  describe('Synchronization scenarios', () => {
    it('should handle song not started yet (offset < 0)', () => {
      // When startedAt is in the future, offset will be negative
      // The component should wait and then play
      const onEnded = vi.fn()
      const futureStart = new Date(Date.now() + 5000) // 5 seconds in future

      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={futureStart}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Component should be ready to sync once isPlaying becomes true
      expect(document.querySelector('audio')).toBeInTheDocument()
    })

    it('should handle song in progress (offset > 0 and < maxDuration)', () => {
      // When startedAt is in the past but within maxDuration
      // The component should seek to the correct position
      const onEnded = vi.fn()
      const pastStart = new Date(Date.now() - 5000) // 5 seconds ago

      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={pastStart}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Component should be ready to sync once isPlaying becomes true
      expect(document.querySelector('audio')).toBeInTheDocument()
    })

    it('should handle song already ended (offset >= maxDuration)', () => {
      const onEnded = vi.fn()
      // 30 seconds ago, but maxDuration is 20 - song should be ended
      const pastStart = new Date(Date.now() - 30000)

      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={pastStart}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      // Component should detect that the clip has already ended
      // and will call onEnded when sync logic runs
      expect(document.querySelector('audio')).toBeInTheDocument()
    })
  })

  describe('Props interface compliance', () => {
    it('should have all required props: songId, startedAt, isPlaying, maxDuration, onEnded', () => {
      const onEnded = vi.fn()

      // All required props provided (with null songId to avoid audio loading)
      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={new Date()}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
        />
      )

      expect(screen.getByText('0:20')).toBeInTheDocument()
    })

    it('should accept all optional props: onReady, volume, startPosition', () => {
      const onEnded = vi.fn()
      const onReady = vi.fn()

      render(
        <SyncedAudioPlayer
          songId={null}
          startedAt={null}
          isPlaying={false}
          maxDuration={20}
          onEnded={onEnded}
          onReady={onReady}
          volume={0.8}
          startPosition={5}
        />
      )

      expect(screen.getByText('0:20')).toBeInTheDocument()
    })
  })
})
