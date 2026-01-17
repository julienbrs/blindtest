'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface TimerProps {
  duration: number
  remaining: number
}

export function Timer({ duration, remaining }: TimerProps) {
  const progress = (remaining / duration) * 100
  const prefersReducedMotion = useReducedMotion()

  // Color transitions based on absolute seconds (per epic 7.7):
  // 5-4s = Yellow (Normal)
  // 3-2s = Orange (Léger pulse)
  // 1s = Red (Pulse rapide + clignotement)
  // Also uses percentage-based fallback for long timers
  const getProgressColor = (remainingSeconds: number): string => {
    if (remainingSeconds <= 1) return '#ef4444' // red-500 - urgent
    if (remainingSeconds <= 3) return '#f97316' // orange-500 - warning
    if (remainingSeconds <= 5) return '#facc15' // yellow-400 - attention
    return '#22c55e' // green-500 - normal
  }

  // Urgency states based on absolute seconds
  // isNormal (remaining > 5): green, no special animation
  const isAttention = remaining <= 5 && remaining > 3 // 5-4s: yellow, normal
  const isWarning = remaining <= 3 && remaining > 1 // 3-2s: orange, léger pulse
  const isCritical = remaining <= 1 // 1s: red, pulse rapide + clignotement

  const progressColor = getProgressColor(remaining)
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
                  scale: [1, 1.1, 1],
                }
              : isWarning
                ? {
                    scale: [1, 1.03, 1],
                  }
                : {}
        }
        transition={
          isCritical
            ? {
                duration: 0.3, // Fast pulse
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : isWarning
              ? {
                  duration: 0.6, // Léger pulse
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

        {/* Nombre avec animation - urgency effects */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold"
          animate={
            prefersReducedMotion
              ? { color: progressColor }
              : isCritical
                ? {
                    color: progressColor,
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1], // Clignotement
                  }
                : isWarning
                  ? {
                      color: progressColor,
                      opacity: [1, 0.7, 1],
                    }
                  : isAttention
                    ? {
                        color: progressColor,
                      }
                    : {
                        color: progressColor,
                      }
          }
          transition={
            isCritical
              ? {
                  scale: {
                    duration: 0.25, // Pulse rapide
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  opacity: {
                    duration: 0.25, // Clignotement rapide
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  color: { duration: 0.3 },
                }
              : isWarning
                ? {
                    opacity: {
                      duration: 0.6, // Léger pulse
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

        {/* Glow effect - now also shows during warning with orange glow */}
        {isWarning && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 15px rgba(249, 115, 22, 0.2)',
                '0 0 25px rgba(249, 115, 22, 0.4)',
                '0 0 15px rgba(249, 115, 22, 0.2)',
              ],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        {isCritical && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 25px rgba(239, 68, 68, 0.4)',
                '0 0 50px rgba(239, 68, 68, 0.7)',
                '0 0 25px rgba(239, 68, 68, 0.4)',
              ],
            }}
            transition={{
              duration: 0.3, // Fast pulsing glow
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      <motion.p
        className="text-lg font-medium"
        animate={{
          color: isCritical
            ? '#ef4444' // red-500
            : isWarning
              ? '#f97316' // orange-500
              : isAttention
                ? '#facc15' // yellow-400
                : '#e9d5ff', // purple-200
        }}
        transition={{ duration: 0.3 }}
      >
        {isCritical
          ? 'VITE !'
          : isWarning
            ? 'Dépêchez-vous !'
            : 'Temps pour répondre...'}
      </motion.p>
    </div>
  )
}
