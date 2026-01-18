import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Card>Test Content</Card>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Card className="p-6 custom-class">Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveClass('custom-class')
      expect(card).toHaveClass('p-6')
    })
  })

  describe('default variant', () => {
    it('has bg-white/10 background', () => {
      render(<Card>Default Card</Card>)
      const card = screen.getByText('Default Card')
      expect(card).toHaveClass('bg-white/10')
    })

    it('has backdrop-blur-sm', () => {
      render(<Card>Default Card</Card>)
      const card = screen.getByText('Default Card')
      expect(card).toHaveClass('backdrop-blur-sm')
    })

    it('has rounded-2xl', () => {
      render(<Card>Default Card</Card>)
      const card = screen.getByText('Default Card')
      expect(card).toHaveClass('rounded-2xl')
    })

    it('has shadow-xl', () => {
      render(<Card>Default Card</Card>)
      const card = screen.getByText('Default Card')
      expect(card).toHaveClass('shadow-xl')
    })

    it('has border border-white/10', () => {
      render(<Card>Default Card</Card>)
      const card = screen.getByText('Default Card')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('border-white/10')
    })
  })

  describe('elevated variant', () => {
    it('has stronger shadow for emphasis', () => {
      render(<Card variant="elevated">Elevated Card</Card>)
      const card = screen.getByText('Elevated Card')
      expect(card.className).toContain('shadow-[0_20px_50px_rgba(0,0,0,0.3)]')
    })

    it('has blur and border', () => {
      render(<Card variant="elevated">Elevated Card</Card>)
      const card = screen.getByText('Elevated Card')
      expect(card).toHaveClass('backdrop-blur-sm')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('border-white/10')
    })

    it('has rounded corners', () => {
      render(<Card variant="elevated">Elevated Card</Card>)
      const card = screen.getByText('Elevated Card')
      expect(card).toHaveClass('rounded-2xl')
    })
  })

  describe('glow variant', () => {
    it('has pink glow shadow', () => {
      render(<Card variant="glow">Glow Card</Card>)
      const card = screen.getByText('Glow Card')
      expect(card.className).toContain('shadow-[0_0_30px_rgba(236,72,153,0.3)]')
    })

    it('has pink-tinted border', () => {
      render(<Card variant="glow">Glow Card</Card>)
      const card = screen.getByText('Glow Card')
      expect(card).toHaveClass('border-pink-500/20')
    })

    it('has blur and background', () => {
      render(<Card variant="glow">Glow Card</Card>)
      const card = screen.getByText('Glow Card')
      expect(card).toHaveClass('backdrop-blur-sm')
      expect(card).toHaveClass('bg-white/10')
    })
  })

  describe('visual hierarchy', () => {
    it('applies all depth styles consistently', () => {
      const { rerender } = render(<Card>Content</Card>)
      let card = screen.getByText('Content')
      expect(card).toHaveClass('bg-white/10')
      expect(card).toHaveClass('backdrop-blur-sm')
      expect(card).toHaveClass('rounded-2xl')
      expect(card).toHaveClass('border')

      rerender(<Card variant="elevated">Content</Card>)
      card = screen.getByText('Content')
      expect(card).toHaveClass('bg-white/10')
      expect(card).toHaveClass('backdrop-blur-sm')
      expect(card).toHaveClass('rounded-2xl')
      expect(card).toHaveClass('border')

      rerender(<Card variant="glow">Content</Card>)
      card = screen.getByText('Content')
      expect(card).toHaveClass('bg-white/10')
      expect(card).toHaveClass('backdrop-blur-sm')
      expect(card).toHaveClass('rounded-2xl')
      expect(card).toHaveClass('border')
    })
  })
})
