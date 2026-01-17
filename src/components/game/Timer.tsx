'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface TimerProps {
  duration: number
  remaining: number
}

export function Timer({ duration, remaining }: TimerProps) {
  const progress = (remaining / duration) * 100
  const prefersReducedMotion = useReducedMotion()

  // Color transitions: green (> 60%) → yellow (30-60%) → orange (10-30%) → red (<= 10%)
  const getProgressColor = (progressPercent: number): string => {
    if (progressPercent > 60) return '#22c55e' // green-500
    if (progressPercent > 30) return '#facc15' // yellow-400
    if (progressPercent > 10) return '#f97316' // orange-500
    return '#ef4444' // red-500
  }

  // Urgency states
  const isWarning = remaining <= 3 && remaining > 1
  const isCritical = remaining <= 1

  const progressColor = getProgressColor(progress)
  const circumference = 2 * Math.PI * 58 // ~364

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cercle de progression */}
      <motion.div
        className="relative h-32 w-32"
        animate={
          prefersReducedMotion
            ? {}
            : isCritical
              ? {
                  scale: [1, 1.05, 1],
                }
              : {}
        }
        transition={
          isCritical
            ? {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 128 128"
        >
          {/* Fond */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/20"
          />
          {/* Progression avec animation fluide */}
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset:
                circumference - (circumference * progress) / 100,
              stroke: progressColor,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    strokeDashoffset: {
                      duration: 0.3,
                      ease: 'linear',
                    },
                    stroke: {
                      duration: 0.3,
                      ease: 'easeOut',
                    },
                  }
            }
          />
        </svg>

        {/* Nombre avec animation */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
          animate={
            prefersReducedMotion
              ? { color: progressColor }
              : isCritical
                ? {
                    color: progressColor,
                    scale: [1, 1.15, 1],
                  }
                : isWarning
                  ? {
                      color: progressColor,
                      opacity: [1, 0.7, 1],
                    }
                  : {
                      color: progressColor,
                    }
          }
          transition={
            isCritical
              ? {
                  scale: {
                    duration: 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  color: { duration: 0.3 },
                }
              : isWarning
                ? {
                    opacity: {
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    color: { duration: 0.3 },
                  }
                : { duration: 0.3 }
          }
        >
          {remaining}
        </motion.div>

        {/* Glow effect when critical */}
        {isCritical && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 20px rgba(239, 68, 68, 0.3)',
                '0 0 40px rgba(239, 68, 68, 0.6)',
                '0 0 20px rgba(239, 68, 68, 0.3)',
              ],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      <motion.p
        className="text-lg"
        animate={{
          color: isCritical ? '#ef4444' : '#e9d5ff', // red-500 or purple-200
        }}
        transition={{ duration: 0.3 }}
      >
        {isCritical ? 'Vite !' : 'Temps pour répondre...'}
      </motion.p>
    </div>
  )
}
