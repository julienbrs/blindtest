'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ConfettiParticle {
  id: number
  color: string
  left: string
  duration: number
  delay: number
  xOffset: number
  rotation: number
}

// Generate confetti particles outside of component to avoid impure render calls
function generateConfettiParticles(): ConfettiParticle[] {
  const colors = ['#f472b6', '#a855f7', '#fbbf24', '#34d399', '#60a5fa']
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    color: colors[i % 5],
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 0.5,
    xOffset: (Math.random() - 0.5) * 200,
    rotation: Math.random() * 720,
  }))
}

interface GameRecapProps {
  score: number
  songsPlayed: number
  onNewGame: () => void
  onHome: () => void
}

export function GameRecap({
  score,
  songsPlayed,
  onNewGame,
  onHome,
}: GameRecapProps) {
  const shouldReduceMotion = useReducedMotion()

  // Calculate success rate
  const successRate =
    songsPlayed > 0 ? Math.round((score / songsPlayed) * 100) : 0

  // Determine if good score for confetti (50% or more)
  const isGoodScore = successRate >= 50 && !shouldReduceMotion

  // Use lazy initialization to generate particles once
  const [confettiParticles] = useState<ConfettiParticle[]>(() =>
    isGoodScore ? generateConfettiParticles() : []
  )
  const [showConfetti, setShowConfetti] = useState(isGoodScore)

  // Stop confetti after 4 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  // Get message based on score
  const getMessage = () => {
    if (songsPlayed === 0) return 'Aucune chanson jouée'
    if (successRate === 100) return 'Score parfait !'
    if (successRate >= 80) return 'Excellent !'
    if (successRate >= 60) return 'Bien joué !'
    if (successRate >= 40) return 'Pas mal !'
    if (successRate >= 20) return 'Continuez à vous entraîner !'
    return 'La prochaine fois sera meilleure !'
  }

  const animationProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5 },
      }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-3 w-3 rounded-full"
              style={{
                backgroundColor: particle.color,
                left: particle.left,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y:
                  typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
                x: particle.xOffset,
                rotate: particle.rotation,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Recap card */}
      <motion.div
        {...animationProps}
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 p-6 shadow-2xl md:p-8"
      >
        {/* Title */}
        <h2 className="mb-6 text-center font-heading text-3xl font-bold text-white md:text-4xl">
          Partie terminée !
        </h2>

        {/* Message */}
        <p className="mb-8 text-center text-xl text-purple-200">
          {getMessage()}
        </p>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          {/* Score */}
          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-sm text-purple-300">Score</div>
            <div className="text-4xl font-bold text-white">{score}</div>
          </div>

          {/* Songs played */}
          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-sm text-purple-300">Chansons jouées</div>
            <div className="text-4xl font-bold text-white">{songsPlayed}</div>
          </div>

          {/* Correct answers */}
          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-sm text-purple-300">Bonnes réponses</div>
            <div className="text-4xl font-bold text-green-400">{score}</div>
          </div>

          {/* Success rate */}
          <div className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-sm text-purple-300">Taux de réussite</div>
            <div
              className={`text-4xl font-bold ${
                successRate >= 50 ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {successRate}%
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onNewGame}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-bold text-white transition-all hover:from-pink-400 hover:to-purple-500 focus:outline-none focus:ring-4 focus:ring-pink-400/50"
          >
            Nouvelle partie
          </button>
          <button
            onClick={onHome}
            className="w-full rounded-xl bg-white/10 py-3 text-lg text-purple-200 transition-colors hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </motion.div>
    </div>
  )
}
