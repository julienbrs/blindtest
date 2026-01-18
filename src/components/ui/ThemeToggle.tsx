'use client'

import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative flex h-10 w-20 items-center rounded-full p-1 transition-colors duration-300 ${
        isDark ? 'bg-slate-800' : 'bg-purple-500/30'
      } ${className}`}
      aria-label={isDark ? 'Passer au thème festif' : 'Passer au thème sombre'}
    >
      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5">
        <SunIcon
          className={`h-4 w-4 transition-opacity duration-300 ${isDark ? 'text-slate-600' : 'text-yellow-300'}`}
        />
        <MoonIcon
          className={`h-4 w-4 transition-opacity duration-300 ${isDark ? 'text-purple-300' : 'text-purple-400/50'}`}
        />
      </div>

      {/* Toggle knob */}
      <motion.div
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors duration-300 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}
        animate={{ x: isDark ? 38 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <MoonIcon className="h-4 w-4 text-purple-400" />
        ) : (
          <SunIcon className="h-4 w-4 text-yellow-500" />
        )}
      </motion.div>
    </button>
  )
}
