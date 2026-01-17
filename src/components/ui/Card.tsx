'use client'

import { ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'glow'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-white/10
    backdrop-blur-sm
    rounded-2xl
    shadow-xl
    border border-white/10
  `,
  elevated: `
    bg-white/10
    backdrop-blur-sm
    rounded-2xl
    shadow-[0_20px_50px_rgba(0,0,0,0.3)]
    border border-white/10
  `,
  glow: `
    bg-white/10
    backdrop-blur-sm
    rounded-2xl
    shadow-[0_0_30px_rgba(236,72,153,0.3)]
    border border-pink-500/20
  `,
}

/**
 * Card component with depth and shadow effects for visual hierarchy.
 *
 * @param variant - Visual style variant:
 *   - 'default': Standard card with blur and subtle shadow
 *   - 'elevated': Card with stronger drop shadow for emphasis
 *   - 'glow': Card with colored glow effect for highlighting
 */
export function Card({
  children,
  className = '',
  variant = 'default',
}: CardProps) {
  // Clean up multiline styles for proper className application
  const baseStyles = variantStyles[variant].replace(/\s+/g, ' ').trim()

  return <div className={`${baseStyles} ${className}`}>{children}</div>
}
