import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserUnsupportedError } from './BrowserUnsupportedError'

describe('BrowserUnsupportedError', () => {
  it('renders the error container', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByTestId('browser-unsupported-error')).toBeInTheDocument()
  })

  it('displays the error title', () => {
    render(<BrowserUnsupportedError />)
    expect(
      screen.getByRole('heading', { name: /navigateur non supporté/i })
    ).toBeInTheDocument()
  })

  it('displays error message about HTML5 audio', () => {
    render(<BrowserUnsupportedError />)
    expect(
      screen.getByText(/ne supporte pas la lecture audio html5/i)
    ).toBeInTheDocument()
  })

  it('displays recommended browsers section', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/navigateurs recommandés/i)).toBeInTheDocument()
  })

  it('suggests Google Chrome', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/google chrome/i)).toBeInTheDocument()
  })

  it('suggests Mozilla Firefox', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/mozilla firefox/i)).toBeInTheDocument()
  })

  it('suggests Safari', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/safari/i)).toBeInTheDocument()
  })

  it('suggests Microsoft Edge', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/microsoft edge/i)).toBeInTheDocument()
  })

  it('suggests Opera', () => {
    render(<BrowserUnsupportedError />)
    expect(screen.getByText(/opera/i)).toBeInTheDocument()
  })

  it('displays update suggestion', () => {
    render(<BrowserUnsupportedError />)
    expect(
      screen.getByText(/veuillez mettre à jour votre navigateur/i)
    ).toBeInTheDocument()
  })

  it('has correct styling for error title', () => {
    render(<BrowserUnsupportedError />)
    const heading = screen.getByRole('heading', {
      name: /navigateur non supporté/i,
    })
    expect(heading).toHaveClass('text-red-400')
  })

  it('displays warning icon container', () => {
    render(<BrowserUnsupportedError />)
    const container = screen.getByTestId('browser-unsupported-error')
    // Check for the icon wrapper with red background
    const iconWrapper = container.querySelector('.bg-red-500\\/20')
    expect(iconWrapper).toBeInTheDocument()
  })
})
