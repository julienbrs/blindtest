import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'
import { SongSkeleton } from './SongSkeleton'
import { PlayerListSkeleton } from './PlayerListSkeleton'
import { LeaderboardSkeleton } from './LeaderboardSkeleton'

describe('Skeleton', () => {
  it('renders with default styles', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstChild as HTMLElement
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('rounded-lg')
    expect(skeleton).toHaveClass('bg-white/10')
    expect(skeleton).toHaveClass('backdrop-blur-sm')
  })

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="w-32 h-6" />)
    const skeleton = container.firstChild as HTMLElement
    expect(skeleton).toHaveClass('w-32')
    expect(skeleton).toHaveClass('h-6')
  })
})

describe('SongSkeleton', () => {
  it('renders album cover and info skeletons', () => {
    const { container } = render(<SongSkeleton />)
    // Should have main container
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('flex')
    expect(mainContainer).toHaveClass('flex-col')
    expect(mainContainer).toHaveClass('items-center')
    // Should have multiple skeleton elements (cover + info placeholders)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(4) // cover + title + artist + album
  })
})

describe('PlayerListSkeleton', () => {
  it('renders default 3 player card skeletons', () => {
    const { container } = render(<PlayerListSkeleton />)
    // Target the specific card elements with border styling
    const cards = container.querySelectorAll('.rounded-xl.border')
    expect(cards.length).toBe(3)
  })

  it('renders custom count of player cards', () => {
    const { container } = render(<PlayerListSkeleton count={5} />)
    // Target the specific card elements with border styling
    const cards = container.querySelectorAll('.rounded-xl.border')
    expect(cards.length).toBe(5)
  })

  it('shows host badge skeleton on first card', () => {
    const { container } = render(<PlayerListSkeleton count={2} />)
    // First card should have host badge (rounded-full skeleton)
    const cards = container.querySelectorAll('.rounded-xl')
    const firstCardBadge = cards[0].querySelector('.rounded-full')
    expect(firstCardBadge).toBeTruthy()
  })
})

describe('LeaderboardSkeleton', () => {
  it('renders with trophy icon and header', () => {
    render(<LeaderboardSkeleton />)
    // Should have header text
    expect(screen.getByText('Classement')).toBeTruthy()
  })

  it('renders default 4 entries', () => {
    const { container } = render(<LeaderboardSkeleton />)
    // Target the specific entry rows that have bg-white/5 class
    const entries = container.querySelectorAll('.rounded-lg.bg-white\\/5')
    expect(entries.length).toBe(4)
  })

  it('renders custom count of entries', () => {
    const { container } = render(<LeaderboardSkeleton count={6} />)
    // Target the specific entry rows that have bg-white/5 class
    const entries = container.querySelectorAll('.rounded-lg.bg-white\\/5')
    expect(entries.length).toBe(6)
  })

  it('applies compact styling when compact prop is true', () => {
    const { container } = render(<LeaderboardSkeleton compact />)
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('p-2')
  })

  it('applies custom className', () => {
    const { container } = render(<LeaderboardSkeleton className="custom-class" />)
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('custom-class')
  })
})
