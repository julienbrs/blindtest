'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface BuzzerButtonProps {
  onBuzz: () => void
  disabled?: boolean
}

export function BuzzerButton({ onBuzz, disabled = false }: BuzzerButtonProps) {
  const [justBuzzed, setJustBuzzed] = useState(false)

  const handleClick = useCallback(() => {
    if (!disabled) {
      // Trigger mobile vibration if supported
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(100)
      }

      // Trigger the buzz animation
      setJustBuzzed(true)
      setTimeout(() => setJustBuzzed(false), 300)

      onBuzz()
    }
  }, [disabled, onBuzz])

  return (
    <div className="relative">
      {/* Shockwave effect */}
      {justBuzzed && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-red-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}

      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        animate={
          justBuzzed
            ? {
                boxShadow: [
                  '0 0 60px rgba(239,68,68,0.5)',
                  '0 0 100px rgba(239,68,68,0.9)',
                  '0 0 60px rgba(239,68,68,0.5)',
                ],
              }
            : { boxShadow: '0 0 60px rgba(239,68,68,0.5)' }
        }
        transition={{ duration: 0.15 }}
        className={`
          relative
          h-40 w-40 md:h-48 md:w-48
          rounded-full
          border-4 border-red-400
          bg-gradient-to-br from-red-500 to-red-700
          text-2xl font-bold text-white
          focus:outline-none focus:ring-4 focus:ring-red-400/50
          disabled:cursor-not-allowed disabled:opacity-50
        `}
      >
        BUZZ!
      </motion.button>
    </div>
  )
}
