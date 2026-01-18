'use client'

import { useMemo, useSyncExternalStore, useState, useEffect } from 'react'

interface Orb {
  id: number
  left: string
  top: string
  size: string
  color: string
  darkColor: string
  animationDelay: string
  animationDuration: string
}

const ORB_COLORS = [
  'bg-pink-500/30',
  'bg-purple-500/30',
  'bg-indigo-500/30',
  'bg-fuchsia-500/25',
  'bg-violet-500/25',
]

const DARK_ORB_COLORS = [
  'bg-purple-900/20',
  'bg-indigo-900/20',
  'bg-slate-800/20',
  'bg-violet-900/15',
  'bg-blue-900/15',
]

// Pre-generated orb configurations with deterministic values for SSR compatibility
const PRE_GENERATED_ORBS: Orb[] = [
  {
    id: 0,
    left: '15%',
    top: '20%',
    size: '250px',
    color: ORB_COLORS[0],
    darkColor: DARK_ORB_COLORS[0],
    animationDelay: '-5s',
    animationDuration: '25s',
  },
  {
    id: 1,
    left: '70%',
    top: '10%',
    size: '200px',
    color: ORB_COLORS[1],
    darkColor: DARK_ORB_COLORS[1],
    animationDelay: '-12s',
    animationDuration: '30s',
  },
  {
    id: 2,
    left: '40%',
    top: '60%',
    size: '300px',
    color: ORB_COLORS[2],
    darkColor: DARK_ORB_COLORS[2],
    animationDelay: '-8s',
    animationDuration: '22s',
  },
  {
    id: 3,
    left: '85%',
    top: '50%',
    size: '180px',
    color: ORB_COLORS[3],
    darkColor: DARK_ORB_COLORS[3],
    animationDelay: '-15s',
    animationDuration: '28s',
  },
  {
    id: 4,
    left: '25%',
    top: '80%',
    size: '220px',
    color: ORB_COLORS[4],
    darkColor: DARK_ORB_COLORS[4],
    animationDelay: '-3s',
    animationDuration: '32s',
  },
  {
    id: 5,
    left: '60%',
    top: '35%',
    size: '280px',
    color: ORB_COLORS[0],
    darkColor: DARK_ORB_COLORS[0],
    animationDelay: '-18s',
    animationDuration: '26s',
  },
]

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

// Festive gradient (colorful, vibrant)
const FESTIVE_GRADIENT =
  'linear-gradient(-45deg, #1e1b4b, #581c87, #be185d, #1e1b4b)'

// Dark gradient (much darker, low luminosity)
const DARK_GRADIENT =
  'linear-gradient(-45deg, #0f0a1f, #1a1333, #0d0d1a, #0f0a1f)'

interface FestiveBackgroundProps {
  isDark?: boolean
}

export function FestiveBackground({ isDark = false }: FestiveBackgroundProps) {
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  // Mobile optimization: reduce number of orbs from 6 to 3
  const orbs = useMemo(
    () => (isMobile ? PRE_GENERATED_ORBS.slice(0, 3) : PRE_GENERATED_ORBS),
    [isMobile]
  )

  const gradient = isDark ? DARK_GRADIENT : FESTIVE_GRADIENT

  // Don't render animations if user prefers reduced motion
  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10 transition-all duration-500"
        style={{
          background: gradient,
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient base */}
      <div
        className="absolute inset-0 animate-gradient-shift transition-all duration-500"
        style={{
          background: gradient,
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating orbs - reduced on mobile for performance */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={`absolute rounded-full ${isDark ? orb.darkColor : orb.color} animate-float-orb transition-colors duration-500`}
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            filter: isMobile ? 'blur(40px)' : 'blur(60px)', // Lighter blur on mobile
            animationDelay: orb.animationDelay,
            animationDuration: orb.animationDuration,
          }}
        />
      ))}

      {/* Subtle vignette overlay for depth - darker in dark mode */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${isDark ? '0.5' : '0.3'}) 100%)`,
        }}
      />
    </div>
  )
}
