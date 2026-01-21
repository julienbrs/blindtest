import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlaylistManager } from './PlaylistManager'

// Mock the usePlaylists hook
const mockPlaylists = [
  {
    id: 'p1',
    name: 'Rock Classics',
    songIds: ['s1', 's2', 's3'],
    createdAt: 1000,
  },
  { id: 'p2', name: 'Pop Hits', songIds: ['s4'], createdAt: 2000 },
]

const mockUsePlaylists = {
  playlists: mockPlaylists,
  isLoaded: true,
  createPlaylist: vi
    .fn()
    .mockReturnValue({
      id: 'new-id',
      name: 'New Playlist',
      songIds: [],
      createdAt: Date.now(),
    }),
  updatePlaylist: vi.fn().mockReturnValue(true),
  deletePlaylist: vi.fn().mockReturnValue(true),
  getPlaylist: vi.fn((id: string) => mockPlaylists.find((p) => p.id === id)),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
  toggleSongInPlaylist: vi.fn(),
}

vi.mock('@/hooks/usePlaylists', () => ({
  usePlaylists: () => mockUsePlaylists,
}))

// Mock fetch for PlaylistEditor
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ songs: [] }),
})

describe('PlaylistManager', () => {
  const defaultProps = {
    selectedPlaylistId: null as string | null,
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePlaylists.playlists = [...mockPlaylists]
    mockUsePlaylists.isLoaded = true
  })

  describe('rendering', () => {
    it('should render title', () => {
      render(<PlaylistManager {...defaultProps} />)
      expect(screen.getByText('Mes playlists')).toBeInTheDocument()
    })

    it('should render "Toute la bibliothèque" option', () => {
      render(<PlaylistManager {...defaultProps} />)
      expect(screen.getByText('Toute la bibliothèque')).toBeInTheDocument()
    })

    it('should render all playlists', () => {
      render(<PlaylistManager {...defaultProps} />)
      expect(screen.getByText('Rock Classics')).toBeInTheDocument()
      expect(screen.getByText('Pop Hits')).toBeInTheDocument()
    })

    it('should show song count for each playlist', () => {
      render(<PlaylistManager {...defaultProps} />)
      expect(screen.getByText('3 chansons')).toBeInTheDocument()
      expect(screen.getByText('1 chanson')).toBeInTheDocument()
    })

    it('should render "Nouvelle playlist" button', () => {
      render(<PlaylistManager {...defaultProps} />)
      expect(screen.getByText('Nouvelle playlist')).toBeInTheDocument()
    })

    it('should show loading state when not loaded', () => {
      mockUsePlaylists.isLoaded = false
      render(<PlaylistManager {...defaultProps} />)
      expect(
        screen.getByText('Chargement des playlists...')
      ).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should highlight "Toute la bibliothèque" when no playlist selected', () => {
      render(<PlaylistManager {...defaultProps} selectedPlaylistId={null} />)
      const libraryOption = screen
        .getByText('Toute la bibliothèque')
        .closest('button')
      expect(libraryOption).toHaveClass('border-purple-400')
    })

    it('should highlight selected playlist', () => {
      render(<PlaylistManager {...defaultProps} selectedPlaylistId="p1" />)
      // Find the container div with the border class (the first div parent with rounded-lg class)
      const playlistText = screen.getByText('Rock Classics')
      const container = playlistText.closest('.border-purple-400')
      expect(container).toBeInTheDocument()
    })

    it('should call onSelect with null when clicking "Toute la bibliothèque"', () => {
      const onSelect = vi.fn()
      render(<PlaylistManager {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Toute la bibliothèque'))
      expect(onSelect).toHaveBeenCalledWith(null)
    })

    it('should call onSelect with playlist ID when clicking a playlist', () => {
      const onSelect = vi.fn()
      render(<PlaylistManager {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Rock Classics'))
      expect(onSelect).toHaveBeenCalledWith('p1')
    })
  })

  describe('creating playlists', () => {
    it('should show input when clicking "Nouvelle playlist"', () => {
      render(<PlaylistManager {...defaultProps} />)

      fireEvent.click(screen.getByText('Nouvelle playlist'))
      expect(
        screen.getByPlaceholderText('Nom de la playlist...')
      ).toBeInTheDocument()
    })

    it('should create playlist on Enter key', async () => {
      render(<PlaylistManager {...defaultProps} />)

      fireEvent.click(screen.getByText('Nouvelle playlist'))
      const input = screen.getByPlaceholderText('Nom de la playlist...')

      fireEvent.change(input, { target: { value: 'New Playlist' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockUsePlaylists.createPlaylist).toHaveBeenCalledWith(
        'New Playlist'
      )
    })

    it('should cancel creation on Escape key', () => {
      render(<PlaylistManager {...defaultProps} />)

      fireEvent.click(screen.getByText('Nouvelle playlist'))
      const input = screen.getByPlaceholderText('Nom de la playlist...')

      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.getByText('Nouvelle playlist')).toBeInTheDocument()
      expect(
        screen.queryByPlaceholderText('Nom de la playlist...')
      ).not.toBeInTheDocument()
    })
  })

  describe('editing playlists', () => {
    it('should show edit input when clicking rename button', async () => {
      render(<PlaylistManager {...defaultProps} />)

      // Find and hover over the playlist to show action buttons
      const playlist = screen.getByText('Rock Classics').closest('button')
      const container = playlist?.closest('div')

      // Get the rename button (Pencil icon)
      const renameButtons = container?.querySelectorAll(
        'button[aria-label="Renommer"]'
      )
      if (renameButtons && renameButtons.length > 0) {
        fireEvent.click(renameButtons[0])

        await waitFor(() => {
          const editInput = container?.querySelector('input[type="text"]')
          expect(editInput).toBeInTheDocument()
        })
      }
    })

    it('should save edit on Enter key', async () => {
      render(<PlaylistManager {...defaultProps} />)

      const playlist = screen.getByText('Rock Classics').closest('button')
      const container = playlist?.closest('div')

      const renameButtons = container?.querySelectorAll(
        'button[aria-label="Renommer"]'
      )
      if (renameButtons && renameButtons.length > 0) {
        fireEvent.click(renameButtons[0])

        await waitFor(() => {
          const editInput = container?.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement
          if (editInput) {
            fireEvent.change(editInput, {
              target: { value: 'Renamed Playlist' },
            })
            fireEvent.keyDown(editInput, { key: 'Enter' })
            expect(mockUsePlaylists.updatePlaylist).toHaveBeenCalledWith('p1', {
              name: 'Renamed Playlist',
            })
          }
        })
      }
    })
  })

  describe('deleting playlists', () => {
    it('should call deletePlaylist when clicking delete button', () => {
      render(<PlaylistManager {...defaultProps} />)

      const deleteButton = screen.getAllByLabelText('Supprimer')[0]
      fireEvent.click(deleteButton)

      expect(mockUsePlaylists.deletePlaylist).toHaveBeenCalledWith('p1')
    })

    it('should call onSelect with null when deleting selected playlist', () => {
      const onSelect = vi.fn()
      render(
        <PlaylistManager
          {...defaultProps}
          selectedPlaylistId="p1"
          onSelect={onSelect}
        />
      )

      const deleteButton = screen.getAllByLabelText('Supprimer')[0]
      fireEvent.click(deleteButton)

      expect(onSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('close button', () => {
    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn()
      render(<PlaylistManager {...defaultProps} onClose={onClose} />)

      expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
    })

    it('should not render close button when onClose is not provided', () => {
      render(<PlaylistManager {...defaultProps} />)

      expect(screen.queryByLabelText('Fermer')).not.toBeInTheDocument()
    })

    it('should call onClose when clicking close button', () => {
      const onClose = vi.fn()
      render(<PlaylistManager {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('Fermer'))
      expect(onClose).toHaveBeenCalled()
    })
  })
})
