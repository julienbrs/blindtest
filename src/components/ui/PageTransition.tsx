'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * PageTransition - Wraps page content with a fade transition animation
 *
 * Features:
 * - Simple fade-in animation with 250ms duration
 * - Respects prefers-reduced-motion (no animation if enabled)
 * - Uses GPU-accelerated opacity property for smooth 60fps
 */
export function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex min-h-screen w-full flex-col"
    >
      {children}
    </motion.div>
  )
}
