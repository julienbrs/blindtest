import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SongReveal } from './SongReveal'
import type { Song } from '@/lib/types'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    fill?: boolean
    className?: string
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-testid="cover-image" />
  ),
}))

const mockSong: Song = {
  id: 'abc123def456',
  title: 'Test Song Title',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  filePath: '/path/to/song.mp3',
  format: 'mp3',
  hasCover: true,
}

describe('SongReveal', () => {
  describe('loading state', () => {
    it('shows loading message when song is null', () => {
      render(<SongReveal song={null} isRevealed={false} guessMode="both" />)

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })

    it('applies correct styling to loading container', () => {
      render(<SongReveal song={null} isRevealed={false} guessMode="both" />)

      const container = screen.getByText('Chargement...').parentElement
      expect(container).toHaveClass('bg-white/10', 'rounded-2xl')
    })
  })

  describe('cover image', () => {
    it('displays album cover with correct src', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)

      const image = screen.getByTestId('cover-image')
      expect(image).toHaveAttribute('src', `/api/cover/${mockSong.id}`)
    })

    it('applies blur effect when not revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)

      const image = screen.getByTestId('cover-image')
      expect(image).toHaveClass('blur-xl', 'scale-110')
    })

    it('removes blur effect when revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      const image = screen.getByTestId('cover-image')
      expect(image).not.toHaveClass('blur-xl')
      expect(image).not.toHaveClass('scale-110')
    })

    it('shows music note icon when not revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)

      // MusicalNoteIcon from Heroicons is rendered as an SVG
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('h-16', 'w-16', 'text-white/80')
    })

    it('hides music note icon when revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      // The music note icon should not be present when revealed
      const icon = document.querySelector('.h-16.w-16')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('song information reveal', () => {
    it('shows title and artist in "both" mode when revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      expect(screen.getByText('Test Song Title')).toBeInTheDocument()
      expect(screen.getByText('Test Artist')).toBeInTheDocument()
    })

    it('shows only title in "title" mode when revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="title" />)

      expect(screen.getByText('Test Song Title')).toBeInTheDocument()
      expect(screen.queryByText('Test Artist')).not.toBeInTheDocument()
    })

    it('shows only artist in "artist" mode when revealed', () => {
      render(
        <SongReveal song={mockSong} isRevealed={true} guessMode="artist" />
      )

      expect(screen.queryByText('Test Song Title')).not.toBeInTheDocument()
      expect(screen.getByText('Test Artist')).toBeInTheDocument()
    })

    it('shows album when revealed and album exists', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      expect(screen.getByText('Test Album')).toBeInTheDocument()
    })

    it('does not show album when song has no album', () => {
      const songWithoutAlbum: Song = { ...mockSong, album: undefined }
      render(
        <SongReveal
          song={songWithoutAlbum}
          isRevealed={true}
          guessMode="both"
        />
      )

      expect(screen.queryByText('Test Album')).not.toBeInTheDocument()
    })

    it('hides all information when not revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)

      expect(screen.queryByText('Test Song Title')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Artist')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Album')).not.toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('applies fade-in animation to info container when revealed', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      const infoContainer = screen.getByText('Test Song Title').closest('div')
      expect(infoContainer).toHaveClass('animate-fade-in')
    })

    it('applies transition classes to cover image', () => {
      render(<SongReveal song={mockSong} isRevealed={false} guessMode="both" />)

      const image = screen.getByTestId('cover-image')
      expect(image).toHaveClass('transition-all', 'duration-500')
    })
  })

  describe('styling', () => {
    it('title uses correct heading styling', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      const title = screen.getByText('Test Song Title')
      expect(title.tagName).toBe('H2')
      expect(title).toHaveClass('text-2xl', 'font-bold')
    })

    it('artist uses correct styling', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      const artist = screen.getByText('Test Artist')
      expect(artist).toHaveClass('text-xl', 'text-purple-200')
    })

    it('album uses correct styling', () => {
      render(<SongReveal song={mockSong} isRevealed={true} guessMode="both" />)

      const album = screen.getByText('Test Album')
      expect(album).toHaveClass('text-sm', 'text-purple-400')
    })
  })
})
