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

interface BackgroundParticlesProps {
  isDark?: boolean
}

export function BackgroundParticles({
  isDark = false,
}: BackgroundParticlesProps) {
  const [init, setInit] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    // Don't initialize if reduced motion is preferred
    if (reducedMotion) return

    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [reducedMotion])

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      particles: {
        number: {
          value: 30,
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
            enable: true,
            speed: 0.3,
            sync: false,
          },
        },
        size: {
          value: { min: 2, max: 6 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 0.4,
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
            enable: true,
            frequency: 0.03,
            opacity: 1,
            color: {
              value: isDark ? '#6366f1' : '#fbbf24',
            },
          },
        },
      },
      detectRetina: true,
    }),
    [isDark]
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
