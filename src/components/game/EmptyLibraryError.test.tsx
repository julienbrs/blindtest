import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyLibraryError } from './EmptyLibraryError'

describe('EmptyLibraryError', () => {
  const mockReload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })
  })

  it('renders the empty library message', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    expect(screen.getByText('Aucune chanson trouvée')).toBeInTheDocument()
  })

  it('displays helpful instructions', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    expect(
      screen.getByText(/Vérifiez que le chemin vers votre bibliothèque/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/MP3, FLAC, OGG, WAV/i)).toBeInTheDocument()
  })

  it('displays the configured audio folder path', () => {
    render(<EmptyLibraryError audioFolderPath="/music/library" />)

    expect(screen.getByText('Chemin configuré :')).toBeInTheDocument()
    expect(screen.getByText('/music/library')).toBeInTheDocument()
  })

  it('displays "Non défini" when no path is set', () => {
    render(<EmptyLibraryError audioFolderPath="Non défini" />)

    expect(screen.getByText('Non défini')).toBeInTheDocument()
  })

  it('renders the retry button', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    const retryButton = screen.getByRole('button', { name: /réessayer/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('calls window.location.reload when retry button is clicked', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    const retryButton = screen.getByRole('button', { name: /réessayer/i })
    fireEvent.click(retryButton)

    expect(mockReload).toHaveBeenCalledTimes(1)
  })

  it('renders the music note icon', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    // MusicalNoteIcon from Heroicons should be rendered
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('has centered layout', () => {
    const { container } = render(
      <EmptyLibraryError audioFolderPath="/path/to/audio" />
    )

    // The root div should have centering classes
    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).toHaveClass('flex', 'flex-col', 'items-center')
  })

  it('applies proper styling to the path display', () => {
    render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)

    const pathContainer = screen.getByText('Chemin configuré :').closest('div')
    expect(pathContainer).toHaveClass('bg-white/10', 'rounded-lg')
  })

  it('does not crash the application', () => {
    // Test that the component renders without throwing errors
    expect(() =>
      render(<EmptyLibraryError audioFolderPath="/path/to/audio" />)
    ).not.toThrow()
  })
})
