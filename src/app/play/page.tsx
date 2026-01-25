'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  UserIcon,
  UsersIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'

interface ModeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  delay: number
  gradient: string
  testId: string
}

function ModeCard({
  title,
  description,
  icon,
  onClick,
  delay,
  gradient,
  testId,
}: ModeCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const cardVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.5, delay }}
      className="w-full"
    >
      <Card
        variant="elevated"
        className="group cursor-pointer p-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] sm:p-8"
      >
        <button
          onClick={onClick}
          data-testid={testId}
          className="flex w-full flex-col items-center text-center focus:outline-none focus:ring-4 focus:ring-purple-400/50 rounded-xl"
        >
          <div
            className={`mb-4 rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg transition-transform duration-300 group-hover:scale-110`}
          >
            {icon}
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="min-h-[3rem] text-purple-200">{description}</p>
        </button>
      </Card>
    </motion.div>
  )
}

export default function PlayPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

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

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  const handleSoloClick = () => {
    router.push('/solo')
  }

  const handleMultiplayerClick = () => {
    router.push('/multiplayer')
  }

  return (
    <PageTransition>
      <motion.main
        className="flex min-h-screen w-full flex-1 flex-col items-center justify-center overflow-x-hidden p-4 lg:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
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
          Choisissez votre mode de jeu
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

      {/* Mode selection cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 px-2 sm:grid-cols-2 sm:gap-8 sm:px-0">
        <ModeCard
          title="Jouer seul"
          description="Testez vos connaissances musicales en solo"
          icon={<UserIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />}
          onClick={handleSoloClick}
          delay={0}
          gradient="from-blue-500 to-cyan-500"
          testId="solo-button"
        />
        <ModeCard
          title="Multijoueur"
          description="Affrontez vos amis en temps réel"
          icon={<UsersIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />}
          onClick={handleMultiplayerClick}
          delay={0.1}
          gradient="from-pink-500 to-purple-600"
          testId="multiplayer-button"
        />
      </div>
      </motion.main>
    </PageTransition>
  )
}
