import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingScreen } from './LoadingScreen'

describe('LoadingScreen', () => {
  it('renders spinner element', () => {
    render(<LoadingScreen />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders default loading message', () => {
    render(<LoadingScreen />)
    const messages = screen.getAllByText('Chargement de la bibliothèque...')
    expect(messages.length).toBeGreaterThan(0)
    // Check the visible message (p element, not sr-only)
    const visibleMessage = messages.find((el) => el.tagName === 'P')
    expect(visibleMessage).toBeInTheDocument()
  })

  it('renders custom loading message', () => {
    render(<LoadingScreen message="Scan en cours..." />)
    const messages = screen.getAllByText('Scan en cours...')
    expect(messages.length).toBeGreaterThan(0)
    // Check the visible message (p element, not sr-only)
    const visibleMessage = messages.find((el) => el.tagName === 'P')
    expect(visibleMessage).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<LoadingScreen />)
    const container = screen.getByRole('status')
    expect(container).toHaveAttribute('aria-live', 'polite')
    expect(container).toHaveAttribute('aria-busy', 'true')
  })

  it('includes screen reader only text', () => {
    render(<LoadingScreen />)
    const srText = document.querySelector('.sr-only')
    expect(srText).toBeInTheDocument()
    expect(srText).toHaveTextContent('Chargement de la bibliothèque...')
  })

  it('renders with min-h-screen for full height', () => {
    render(<LoadingScreen />)
    const container = screen.getByRole('status')
    expect(container).toHaveClass('min-h-screen')
  })

  it('centers content with flex', () => {
    render(<LoadingScreen />)
    const container = screen.getByRole('status')
    expect(container).toHaveClass('flex')
    expect(container).toHaveClass('items-center')
    expect(container).toHaveClass('justify-center')
  })

  it('spinner has correct styling', () => {
    render(<LoadingScreen />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-16')
    expect(spinner).toHaveClass('w-16')
    expect(spinner).toHaveClass('border-4')
    expect(spinner).toHaveClass('border-purple-500')
    expect(spinner).toHaveClass('rounded-full')
  })

  it('message has pulse animation', () => {
    render(<LoadingScreen />)
    const messages = screen.getAllByText('Chargement de la bibliothèque...')
    const visibleMessage = messages.find((el) => el.tagName === 'P')
    expect(visibleMessage).toHaveClass('animate-pulse')
  })

  it('message has correct color', () => {
    render(<LoadingScreen />)
    const messages = screen.getAllByText('Chargement de la bibliothèque...')
    const visibleMessage = messages.find((el) => el.tagName === 'P')
    expect(visibleMessage).toHaveClass('text-purple-300')
  })
})
