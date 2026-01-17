'use client'

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-pink-500 to-purple-600
    hover:from-pink-400 hover:to-purple-500
    active:from-pink-600 active:to-purple-700
    text-white
    shadow-lg hover:shadow-xl
  `,
  secondary: `
    bg-white/10 hover:bg-white/20 active:bg-white/5
    text-purple-200 hover:text-white
  `,
  success: `
    bg-green-600 hover:bg-green-500 active:bg-green-700
    text-white
    shadow-lg
  `,
  danger: `
    bg-red-600 hover:bg-red-500 active:bg-red-700
    text-white
    shadow-lg
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-2 px-4 text-sm rounded-lg',
  md: 'py-3 px-5 text-base rounded-xl',
  lg: 'py-4 px-6 text-lg rounded-xl',
}

/**
 * Reusable Button component with 4 variants:
 * - primary: Pink-purple gradient for main CTAs (e.g., "Nouvelle partie")
 * - secondary: Transparent with hover effect for secondary actions (e.g., "Quitter")
 * - success: Green for positive actions (e.g., "Correct")
 * - danger: Red for negative/destructive actions (e.g., "Incorrect")
 *
 * All variants include:
 * - Hover state with visual feedback
 * - Active state for press feedback
 * - Disabled state with reduced opacity and no interactions
 * - Scale effect on hover (primary variant)
 * - Focus ring for accessibility
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      font-bold
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-purple-400/50
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      ${variant === 'primary' ? 'transform hover:scale-105 active:scale-95' : ''}
      ${fullWidth ? 'w-full' : ''}
    `

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `
          .replace(/\s+/g, ' ')
          .trim()}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
