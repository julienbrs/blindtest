'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface CorrectAnswerFlashProps {
  show: boolean
}

/**
 * Full-screen green flash overlay that appears briefly when a correct answer is given.
 * Respects prefers-reduced-motion accessibility setting.
 */
export function CorrectAnswerFlash({ show }: CorrectAnswerFlashProps) {
  const shouldReduceMotion = useReducedMotion()

  if (!show || shouldReduceMotion) {
    return null
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-40 bg-green-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      data-testid="correct-answer-flash"
    />
  )
}
