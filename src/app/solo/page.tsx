'use client'

import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import { GameConfigForm } from '@/components/game/GameConfigForm'
import { LibraryStats } from '@/components/game/LibraryStats'
import { EmptyLibraryError } from '@/components/game/EmptyLibraryError'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Button } from '@/components/ui/Button'
import { PageTransition } from '@/components/ui/PageTransition'

export default function SoloPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(true)
  const [emptyLibraryState, setEmptyLibraryState] = useState<{
    isEmpty: boolean
    audioFolderPath: string | null
  }>({ isEmpty: false, audioFolderPath: null })

  const handleEmptyLibrary = useCallback(
    (isEmpty: boolean, audioFolderPath: string | null) => {
      setEmptyLibraryState((prev) => {
        if (
          prev.isEmpty === isEmpty &&
          prev.audioFolderPath === audioFolderPath
        ) {
          return prev
        }
        return { isEmpty, audioFolderPath }
      })
    },
    []
  )

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading((prev) => (prev === loading ? prev : loading))
  }, [])

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

  if (isLoading) {
    return (
      <PageTransition>
        <LoadingScreen message="Chargement de la bibliothèque..." />
        <div className="hidden">
          <LibraryStats
            onEmptyLibrary={handleEmptyLibrary}
            onLoadingChange={handleLoadingChange}
          />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <motion.main
        className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4 lg:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Back button */}
      <motion.div
        className="mb-4 w-full max-w-md px-2 sm:px-0"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <Button
          onClick={() => router.push('/play')}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
      </motion.div>

      {/* Logo / Title */}
      <motion.div
        className="mb-6 text-center sm:mb-8"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <h1 className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl md:text-7xl">
          Blindtest
        </h1>
        <p className="mt-2 text-base text-purple-200 sm:text-lg">
          Mode Solo - Configurez votre partie
        </p>
      </motion.div>

      {/* Decorative music icons */}
      <motion.div
        className="mb-6 flex items-center gap-3 opacity-60 sm:mb-8 sm:gap-4"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <MusicalNoteIcon
          className="h-8 w-8 animate-bounce text-pink-400 sm:h-10 sm:w-10"
          style={{ animationDelay: '0s' }}
        />
        <SpeakerWaveIcon
          className="h-8 w-8 animate-bounce text-purple-400 sm:h-10 sm:w-10"
          style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}
        />
        <MicrophoneIcon
          className="h-8 w-8 animate-bounce text-yellow-400 sm:h-10 sm:w-10"
          style={{ animationDelay: '0.4s' }}
        />
      </motion.div>

      {/* Show EmptyLibraryError if library is empty */}
      {emptyLibraryState.isEmpty && (
        <motion.div
          variants={fadeUpVariants}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-2 sm:px-0"
        >
          <EmptyLibraryError
            audioFolderPath={emptyLibraryState.audioFolderPath || 'Non défini'}
          />
        </motion.div>
      )}

      {/* Game configuration form - hidden when library is empty */}
      {!emptyLibraryState.isEmpty && (
        <motion.div
          variants={fadeUpVariants}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md px-2 sm:px-0"
        >
          <GameConfigForm />
        </motion.div>
      )}

      {/* Library stats - always rendered but hidden when empty to detect library state */}
      <motion.div
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md px-2 sm:px-0 ${emptyLibraryState.isEmpty ? 'hidden' : ''}`}
      >
        <LibraryStats
          onEmptyLibrary={handleEmptyLibrary}
          onLoadingChange={handleLoadingChange}
        />
      </motion.div>
      </motion.main>
    </PageTransition>
  )
}
