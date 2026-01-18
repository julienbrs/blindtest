'use client'

import { type ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { FestiveBackground } from '@/components/ui/FestiveBackground'

interface ThemedLayoutProps {
  children: ReactNode
}

export function ThemedLayout({ children }: ThemedLayoutProps) {
  const { isDark } = useTheme()

  return (
    <>
      <FestiveBackground isDark={isDark} />
      <div
        className={`min-h-screen flex flex-col relative transition-colors duration-500 ${
          isDark ? 'dark' : ''
        }`}
      >
        {children}
      </div>
    </>
  )
}
