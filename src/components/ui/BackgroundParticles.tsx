'use client'

import { useEffect, useState, useMemo, useSyncExternalStore } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerSnapshot() {
  return false
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  )
}

// Detect mobile devices for performance optimization
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width and touch support for mobile detection
      const hasTouchScreen =
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(hasTouchScreen && isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

interface BackgroundParticlesProps {
  isDark?: boolean
}

export function BackgroundParticles({
  isDark = false,
}: BackgroundParticlesProps) {
  const [init, setInit] = useState(false)
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  useEffect(() => {
    // Don't initialize if reduced motion is preferred
    if (reducedMotion) return

    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [reducedMotion])

  // Mobile performance optimization: reduce particle count and FPS
  const particleCount = isMobile ? 15 : 30
  const fpsLimit = isMobile ? 30 : 60
  const particleSpeed = isMobile ? 0.3 : 0.4

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit,
      particles: {
        number: {
          value: particleCount,
          density: {
            enable: true,
          },
        },
        color: {
          value: isDark
            ? ['#4338ca', '#6b21a8', '#374151']
            : ['#ec4899', '#8b5cf6', '#fbbf24', '#ffffff'],
        },
        opacity: {
          value: { min: 0.05, max: isDark ? 0.12 : 0.2 },
          animation: {
            enable: !isMobile, // Disable opacity animation on mobile
            speed: 0.3,
            sync: false,
          },
        },
        size: {
          value: { min: 2, max: 6 },
          animation: {
            enable: !isMobile, // Disable size animation on mobile
            speed: 1,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: particleSpeed,
          direction: 'none',
          random: true,
          straight: false,
          outModes: {
            default: 'out',
          },
        },
        shape: {
          type: 'circle',
        },
        twinkle: {
          particles: {
            enable: !isMobile, // Disable twinkle on mobile for performance
            frequency: 0.03,
            opacity: 1,
            color: {
              value: isDark ? '#6366f1' : '#fbbf24',
            },
          },
        },
      },
      detectRetina: !isMobile, // Disable retina on mobile to reduce rendering load
    }),
    [isDark, isMobile, particleCount, fpsLimit, particleSpeed]
  )

  // Don't render if reduced motion is preferred or not initialized
  if (reducedMotion || !init) {
    return null
  }

  return (
    <Particles
      id="background-particles"
      className="fixed inset-0 -z-5 pointer-events-none"
      options={options}
    />
  )
}
