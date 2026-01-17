'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface IncorrectAnswerFlashProps {
  show: boolean
}

/**
 * Full-screen red flash overlay that appears briefly when an incorrect answer is given.
 * Respects prefers-reduced-motion accessibility setting.
 * Flash is subtle (lower opacity than correct answer) to avoid being punitive.
 */
export function IncorrectAnswerFlash({ show }: IncorrectAnswerFlashProps) {
  const shouldReduceMotion = useReducedMotion()

  if (!show || shouldReduceMotion) {
    return null
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-40 bg-red-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.2, 0] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-testid="incorrect-answer-flash"
    />
  )
}
