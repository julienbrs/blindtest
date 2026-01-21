import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  LibraryFilters,
  defaultFilters,
  type LibraryFiltersState,
} from './LibraryFilters'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LibraryFilters', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        artists: ['ABBA', 'Beatles', 'Queen'],
        total: 3,
      }),
    })
  })

  it('renders toggle button', () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    expect(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    ).toBeInTheDocument()
  })

  it('shows filter badge when filters are active', () => {
    const filters: LibraryFiltersState = {
      selectedArtists: ['ABBA'],
      yearMin: null,
      yearMax: null,
    }

    render(
      <LibraryFilters
        filters={filters}
        onChange={mockOnChange}
        filteredCount={5}
        totalCount={10}
      />
    )

    // Badge should show filtered count
    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('expands to show filter options when clicked', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Click to expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for artists to load
    await waitFor(() => {
      expect(screen.getByText('Artistes')).toBeInTheDocument()
      expect(screen.getByText('Période')).toBeInTheDocument()
    })
  })

  it('loads and displays artists', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for artists to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ABBA' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Beatles' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Queen' })).toBeInTheDocument()
    })
  })

  it('calls onChange when artist is selected', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for artists and click one
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ABBA' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ABBA' }))

    expect(mockOnChange).toHaveBeenCalledWith({
      selectedArtists: ['ABBA'],
      yearMin: null,
      yearMax: null,
    })
  })

  it('calls onChange when artist is deselected', async () => {
    const filters: LibraryFiltersState = {
      selectedArtists: ['ABBA'],
      yearMin: null,
      yearMax: null,
    }

    render(
      <LibraryFilters
        filters={filters}
        onChange={mockOnChange}
        filteredCount={5}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for artists and click to deselect
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ABBA' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'ABBA' }))

    expect(mockOnChange).toHaveBeenCalledWith({
      selectedArtists: [],
      yearMin: null,
      yearMax: null,
    })
  })

  it('calls onChange when year min is changed', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for period section and change year min
    await waitFor(() => {
      expect(screen.getByText('Période')).toBeInTheDocument()
    })

    const minInput = screen.getByPlaceholderText('De')
    fireEvent.change(minInput, { target: { value: '1980' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      selectedArtists: [],
      yearMin: 1980,
      yearMax: null,
    })
  })

  it('calls onChange when year max is changed', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Wait for period section and change year max
    await waitFor(() => {
      expect(screen.getByText('Période')).toBeInTheDocument()
    })

    const maxInput = screen.getByPlaceholderText("Jusqu'à")
    fireEvent.change(maxInput, { target: { value: '1999' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      selectedArtists: [],
      yearMin: null,
      yearMax: 1999,
    })
  })

  it('shows clear filters button when filters are active', async () => {
    const filters: LibraryFiltersState = {
      selectedArtists: ['ABBA'],
      yearMin: 1980,
      yearMax: null,
    }

    render(
      <LibraryFilters
        filters={filters}
        onChange={mockOnChange}
        filteredCount={5}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /réinitialiser les filtres/i })
      ).toBeInTheDocument()
    })
  })

  it('clears all filters when clear button is clicked', async () => {
    const filters: LibraryFiltersState = {
      selectedArtists: ['ABBA', 'Queen'],
      yearMin: 1980,
      yearMax: 1999,
    }

    render(
      <LibraryFilters
        filters={filters}
        onChange={mockOnChange}
        filteredCount={5}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /réinitialiser les filtres/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: /réinitialiser les filtres/i })
    )

    expect(mockOnChange).toHaveBeenCalledWith(defaultFilters)
  })

  it('displays filtered count when filters are active', async () => {
    const filters: LibraryFiltersState = {
      selectedArtists: ['ABBA'],
      yearMin: null,
      yearMax: null,
    }

    render(
      <LibraryFilters
        filters={filters}
        onChange={mockOnChange}
        filteredCount={5}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    await waitFor(() => {
      // Check for the filtered count display in the bottom section
      expect(
        screen.getByText(/chansons sur 10 sélectionnées/i)
      ).toBeInTheDocument()
    })
  })

  it('displays total count when no filters are active', async () => {
    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
      expect(screen.getByText(/disponibles/i)).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(
      <LibraryFilters
        filters={defaultFilters}
        onChange={mockOnChange}
        filteredCount={10}
        totalCount={10}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole('button', { name: /filtrer la bibliothèque/i })
    )

    // Should show "no artists found" message
    await waitFor(() => {
      expect(screen.getByText(/aucun artiste trouvé/i)).toBeInTheDocument()
    })
  })
})
