'use client'

import { useMemo, useSyncExternalStore } from 'react'

interface Orb {
  id: number
  left: string
  top: string
  size: string
  color: string
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

// Pre-generated orb configurations with deterministic values for SSR compatibility
const PRE_GENERATED_ORBS: Orb[] = [
  {
    id: 0,
    left: '15%',
    top: '20%',
    size: '250px',
    color: ORB_COLORS[0],
    animationDelay: '-5s',
    animationDuration: '25s',
  },
  {
    id: 1,
    left: '70%',
    top: '10%',
    size: '200px',
    color: ORB_COLORS[1],
    animationDelay: '-12s',
    animationDuration: '30s',
  },
  {
    id: 2,
    left: '40%',
    top: '60%',
    size: '300px',
    color: ORB_COLORS[2],
    animationDelay: '-8s',
    animationDuration: '22s',
  },
  {
    id: 3,
    left: '85%',
    top: '50%',
    size: '180px',
    color: ORB_COLORS[3],
    animationDelay: '-15s',
    animationDuration: '28s',
  },
  {
    id: 4,
    left: '25%',
    top: '80%',
    size: '220px',
    color: ORB_COLORS[4],
    animationDelay: '-3s',
    animationDuration: '32s',
  },
  {
    id: 5,
    left: '60%',
    top: '35%',
    size: '280px',
    color: ORB_COLORS[0],
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

export function FestiveBackground() {
  const orbs = useMemo(() => PRE_GENERATED_ORBS, [])
  const reducedMotion = useReducedMotion()

  // Don't render animations if user prefers reduced motion
  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(-45deg, #1e1b4b, #581c87, #be185d, #1e1b4b)',
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient base */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            'linear-gradient(-45deg, #1e1b4b, #581c87, #be185d, #1e1b4b)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={`absolute rounded-full ${orb.color} animate-float-orb`}
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            filter: 'blur(60px)',
            animationDelay: orb.animationDelay,
            animationDuration: orb.animationDuration,
          }}
        />
      ))}

      {/* Subtle vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  )
}
