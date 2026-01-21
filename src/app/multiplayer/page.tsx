'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/Button'
import { CreateRoomForm } from '@/components/multiplayer/CreateRoomForm'
import { JoinRoomForm } from '@/components/multiplayer/JoinRoomForm'
import { UserGroupIcon } from '@heroicons/react/24/solid'

export default function MultiplayerPage() {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }

  const fadeUpVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  const handleBack = () => {
    router.push('/play')
  }

  return (
    <motion.main
      className="flex min-h-screen w-full flex-1 flex-col items-center overflow-x-hidden p-4 pt-8 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back button */}
      <motion.div
        className="mb-6 w-full max-w-md"
        variants={fadeUpVariants}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        className="mb-8 text-center"
        variants={fadeUpVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4 flex items-center justify-center gap-3">
          <UsersIcon className="h-10 w-10 text-pink-400" />
          <h1 className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            Multijoueur
          </h1>
        </div>
        <p className="text-purple-200">
          Créez une partie ou rejoignez vos amis
        </p>
      </motion.div>

      {/* Forms container */}
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Create room section */}
        <motion.div
          variants={fadeUpVariants}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <PlusIcon className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-purple-200">
              Nouvelle partie
            </span>
          </div>
          <CreateRoomForm />
        </motion.div>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-4"
          variants={fadeUpVariants}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm text-purple-300/70">ou</span>
          <div className="h-px flex-1 bg-white/20" />
        </motion.div>

        {/* Join room section */}
        <motion.div
          variants={fadeUpVariants}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-purple-200">
              Rejoindre une partie
            </span>
          </div>
          <JoinRoomForm />
        </motion.div>
      </div>
    </motion.main>
  )
}
