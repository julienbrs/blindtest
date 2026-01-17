import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button component', () => {
  describe('Variants', () => {
    it('renders primary variant with gradient styling', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button', { name: 'Primary' })
      expect(button).toHaveClass('from-pink-500')
      expect(button).toHaveClass('to-purple-600')
    })

    it('renders secondary variant with transparent background', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button', { name: 'Secondary' })
      expect(button).toHaveClass('bg-white/10')
      expect(button).toHaveClass('text-purple-200')
    })

    it('renders success variant with green background', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button', { name: 'Success' })
      expect(button).toHaveClass('bg-green-600')
    })

    it('renders danger variant with red background', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button', { name: 'Danger' })
      expect(button).toHaveClass('bg-red-600')
    })

    it('defaults to primary variant when not specified', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button', { name: 'Default' })
      expect(button).toHaveClass('from-pink-500')
    })
  })

  describe('Hover states', () => {
    it('has hover styles for primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:from-pink-400')
      expect(button).toHaveClass('hover:to-purple-500')
      expect(button).toHaveClass('hover:shadow-xl')
    })

    it('has hover styles for secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-white/20')
      expect(button).toHaveClass('hover:text-white')
    })

    it('has hover styles for success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-green-500')
    })

    it('has hover styles for danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-red-500')
    })
  })

  describe('Active states', () => {
    it('has active styles for primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:from-pink-600')
      expect(button).toHaveClass('active:to-purple-700')
      expect(button).toHaveClass('active:scale-95')
    })

    it('has active styles for secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:bg-white/5')
    })

    it('has active styles for success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:bg-green-700')
    })

    it('has active styles for danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:bg-red-700')
    })
  })

  describe('Disabled state', () => {
    it('has disabled styling', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
      expect(button).toHaveClass('disabled:cursor-not-allowed')
    })

    it('prevents scale on hover when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:hover:scale-100')
    })

    it('does not trigger onClick when disabled', () => {
      const onClick = vi.fn()
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Scale effect on hover', () => {
    it('has scale hover effect for primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-105')
      expect(button).toHaveClass('transform')
    })

    it('does not have scale hover effect for secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('hover:scale-105')
    })

    it('does not have scale hover effect for success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('hover:scale-105')
    })

    it('does not have scale hover effect for danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('hover:scale-105')
    })
  })

  describe('Size variants', () => {
    it('renders small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('py-2')
      expect(button).toHaveClass('px-4')
      expect(button).toHaveClass('text-sm')
      expect(button).toHaveClass('rounded-lg')
    })

    it('renders medium size (default)', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('py-3')
      expect(button).toHaveClass('px-5')
      expect(button).toHaveClass('text-base')
      expect(button).toHaveClass('rounded-xl')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('py-4')
      expect(button).toHaveClass('px-6')
      expect(button).toHaveClass('text-lg')
    })

    it('defaults to medium size when not specified', () => {
      render(<Button>Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('py-3')
      expect(button).toHaveClass('text-base')
    })
  })

  describe('Full width', () => {
    it('renders full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('does not render full width by default', () => {
      render(<Button>Normal</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('w-full')
    })
  })

  describe('Accessibility', () => {
    it('has focus ring for accessibility', () => {
      render(<Button>Accessible</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:ring-4')
      expect(button).toHaveClass('focus:ring-purple-400/50')
    })

    it('has transition for smooth interactions', () => {
      render(<Button>Smooth</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('transition-all')
      expect(button).toHaveClass('duration-200')
    })
  })

  describe('Click handling', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('merges custom className with variant styles', () => {
      render(
        <Button variant="primary" className="custom-class">
          Custom
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('from-pink-500')
    })
  })

  describe('HTML attributes', () => {
    it('passes through HTML button attributes', () => {
      render(
        <Button type="submit" data-testid="submit-btn">
          Submit
        </Button>
      )
      const button = screen.getByTestId('submit-btn')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})
