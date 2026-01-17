'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GuessMode } from '@/lib/types'

export function GameConfigForm() {
  const router = useRouter()
  const [guessMode, _setGuessMode] = useState<GuessMode>('both')
  const [clipDuration, _setClipDuration] = useState(20)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Store config in query params for the game page
    const params = new URLSearchParams({
      mode: guessMode,
      duration: clipDuration.toString(),
    })

    router.push(`/game?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Mode de devinette - placeholder for issue 4.4 */}
      <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold">Que deviner ?</h2>
        <p className="text-sm text-purple-200">
          Mode actuel:{' '}
          {guessMode === 'both'
            ? 'Les deux'
            : guessMode === 'title'
              ? 'Titre'
              : 'Artiste'}
        </p>
        {/* Radio buttons will be added in issue 4.4 */}
      </div>

      {/* Durée des extraits - placeholder for issue 4.5 */}
      <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold">Durée des extraits</h2>
        <p className="text-sm text-purple-200">
          Durée actuelle: {clipDuration}s
        </p>
        {/* Slider will be added in issue 4.5 */}
      </div>

      {/* Bouton démarrer */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full transform rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 text-xl font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Chargement...' : 'Nouvelle Partie'}
      </button>
    </form>
  )
}
