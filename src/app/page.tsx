'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/solid'
import { GameConfigForm } from '@/components/game/GameConfigForm'
import { LibraryStats } from '@/components/game/LibraryStats'

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion()

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.15,
          },
        },
      }

  return (
    <motion.main
      className="flex flex-1 flex-col items-center justify-center p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo / Titre */}
      <motion.div
        className="mb-8 text-center"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <h1 className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl">
          Blindtest
        </h1>
        <p className="mt-2 text-lg text-purple-200">
          Testez vos connaissances musicales !
        </p>
      </motion.div>

      {/* Decorative music icons */}
      <motion.div
        className="mb-8 flex items-center gap-4 opacity-60"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <MusicalNoteIcon
          className="h-10 w-10 animate-bounce text-pink-400"
          style={{ animationDelay: '0s' }}
        />
        <SpeakerWaveIcon
          className="h-10 w-10 animate-bounce text-purple-400"
          style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}
        />
        <MicrophoneIcon
          className="h-10 w-10 animate-bounce text-yellow-400"
          style={{ animationDelay: '0.4s' }}
        />
      </motion.div>

      {/* Game configuration form */}
      <motion.div
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GameConfigForm />
      </motion.div>

      {/* Library stats */}
      <motion.div variants={fadeUpVariants} transition={{ duration: 0.5 }}>
        <LibraryStats />
      </motion.div>
    </motion.main>
  )
}
