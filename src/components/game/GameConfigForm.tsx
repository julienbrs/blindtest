'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { GuessMode } from '@/lib/types'

const STORAGE_KEY = 'blindtest_config'

const validGuessModes: GuessMode[] = ['title', 'artist', 'both']

interface SavedConfig {
  guessMode: GuessMode
  clipDuration: number
  timerDuration: number
  noTimer: boolean
  randomStartPoint: boolean
}

function loadSavedConfig(): SavedConfig | null {
  if (typeof window === 'undefined') return null

  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null

  try {
    const config = JSON.parse(saved)
    const result: SavedConfig = {
      guessMode: 'both',
      clipDuration: 20,
      timerDuration: 5,
      noTimer: false,
      randomStartPoint: false,
    }

    // Validate guessMode
    if (
      config.guessMode &&
      validGuessModes.includes(config.guessMode as GuessMode)
    ) {
      result.guessMode = config.guessMode as GuessMode
    }

    // Validate clipDuration (must be between 5-60 and multiple of 5)
    if (
      typeof config.clipDuration === 'number' &&
      config.clipDuration >= 5 &&
      config.clipDuration <= 60 &&
      config.clipDuration % 5 === 0
    ) {
      result.clipDuration = config.clipDuration
    }

    // Validate timerDuration (must be between 3-30)
    if (
      typeof config.timerDuration === 'number' &&
      config.timerDuration >= 3 &&
      config.timerDuration <= 30
    ) {
      result.timerDuration = config.timerDuration
    }

    // Validate noTimer (must be boolean)
    if (typeof config.noTimer === 'boolean') {
      result.noTimer = config.noTimer
    }

    // Validate randomStartPoint (must be boolean)
    if (typeof config.randomStartPoint === 'boolean') {
      result.randomStartPoint = config.randomStartPoint
    }

    return result
  } catch {
    // Invalid config, return null
    return null
  }
}

const modes: { value: GuessMode; label: string; description: string }[] = [
  {
    value: 'title',
    label: 'Titre',
    description: 'Deviner le nom de la chanson',
  },
  {
    value: 'artist',
    label: 'Artiste',
    description: "Deviner l'artiste ou le groupe",
  },
  {
    value: 'both',
    label: 'Les deux',
    description: 'Deviner titre ET artiste',
  },
]

export function GameConfigForm() {
  const router = useRouter()
  const [guessMode, setGuessMode] = useState<GuessMode>('both')
  const [clipDuration, setClipDuration] = useState(20)
  const [timerDuration, setTimerDuration] = useState(5)
  const [noTimer, setNoTimer] = useState(false)
  const [randomStartPoint, setRandomStartPoint] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)

  // Load saved config on mount (client-side only)
  // This is a legitimate use case for setState in useEffect - hydrating state from localStorage
  useEffect(() => {
    const savedConfig = loadSavedConfig()
    if (savedConfig) {
      /* eslint-disable react-hooks/set-state-in-effect -- Hydrating from localStorage on mount is standard */
      setGuessMode(savedConfig.guessMode)
      setClipDuration(savedConfig.clipDuration)
      setTimerDuration(savedConfig.timerDuration)
      setNoTimer(savedConfig.noTimer)
      setRandomStartPoint(savedConfig.randomStartPoint)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setHasMounted(true)
  }, [])

  // Save config to localStorage whenever it changes (after mount)
  const saveConfig = useCallback(
    (config: {
      guessMode: GuessMode
      clipDuration: number
      timerDuration: number
      noTimer: boolean
      randomStartPoint: boolean
    }) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    },
    []
  )

  // Helper to get current config for saving
  const getCurrentConfig = useCallback(
    (overrides?: Partial<SavedConfig>): SavedConfig => ({
      guessMode,
      clipDuration,
      timerDuration,
      noTimer,
      randomStartPoint,
      ...overrides,
    }),
    [guessMode, clipDuration, timerDuration, noTimer, randomStartPoint]
  )

  // Handler for guess mode changes - saves immediately
  const handleGuessModeChange = useCallback(
    (newMode: GuessMode) => {
      setGuessMode(newMode)
      if (hasMounted) {
        saveConfig(getCurrentConfig({ guessMode: newMode }))
      }
    },
    [hasMounted, saveConfig, getCurrentConfig]
  )

  // Handler for clip duration changes - saves immediately
  const handleClipDurationChange = useCallback(
    (newDuration: number) => {
      setClipDuration(newDuration)
      if (hasMounted) {
        saveConfig(getCurrentConfig({ clipDuration: newDuration }))
      }
    },
    [hasMounted, saveConfig, getCurrentConfig]
  )

  // Handler for timer duration changes - saves immediately
  const handleTimerDurationChange = useCallback(
    (newDuration: number) => {
      setTimerDuration(newDuration)
      if (hasMounted) {
        saveConfig(getCurrentConfig({ timerDuration: newDuration }))
      }
    },
    [hasMounted, saveConfig, getCurrentConfig]
  )

  // Handler for no-timer toggle - saves immediately
  const handleNoTimerChange = useCallback(
    (newValue: boolean) => {
      setNoTimer(newValue)
      if (hasMounted) {
        saveConfig(getCurrentConfig({ noTimer: newValue }))
      }
    },
    [hasMounted, saveConfig, getCurrentConfig]
  )

  // Handler for random start point toggle - saves immediately
  const handleRandomStartPointChange = useCallback(
    (newValue: boolean) => {
      setRandomStartPoint(newValue)
      if (hasMounted) {
        saveConfig(getCurrentConfig({ randomStartPoint: newValue }))
      }
    },
    [hasMounted, saveConfig, getCurrentConfig]
  )

  const validateForm = async (): Promise<boolean> => {
    // Check that there are songs available
    try {
      const res = await fetch('/api/songs')
      const data = await res.json()
      if (data.total === 0) {
        setValidationError(
          'Aucune chanson disponible. Vérifiez votre dossier audio.'
        )
        return false
      }
    } catch {
      setValidationError('Impossible de vérifier la bibliothèque.')
      return false
    }

    // Validate parameters
    if (clipDuration < 5 || clipDuration > 60) {
      setValidationError('La durée doit être entre 5 et 60 secondes.')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const isValid = await validateForm()
    if (!isValid) {
      setIsLoading(false)
      return
    }

    // Store config in query params for the game page
    const params = new URLSearchParams({
      mode: guessMode,
      duration: clipDuration.toString(),
      timer: noTimer ? '0' : timerDuration.toString(),
      randomStart: randomStartPoint ? '1' : '0',
    })

    router.push(`/game?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Mode de devinette */}
      <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold">Que deviner ?</h2>
        <div className="space-y-3">
          {modes.map((mode) => (
            <label
              key={mode.value}
              className={`flex cursor-pointer items-center rounded-lg p-4 transition-all ${
                guessMode === mode.value
                  ? 'border-2 border-purple-400 bg-purple-500/30'
                  : 'border-2 border-transparent bg-white/5 hover:bg-white/10'
              }`}
            >
              <input
                type="radio"
                name="guessMode"
                value={mode.value}
                checked={guessMode === mode.value}
                onChange={(e) =>
                  handleGuessModeChange(e.target.value as GuessMode)
                }
                className="sr-only"
              />
              <div className="flex-1">
                <div className="font-semibold">{mode.label}</div>
                <div className="text-sm text-purple-200">
                  {mode.description}
                </div>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  guessMode === mode.value
                    ? 'border-purple-400 bg-purple-400'
                    : 'border-white/50'
                }`}
              >
                {guessMode === mode.value && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Durée des extraits */}
      <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold">Durée des extraits</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-purple-200">Durée</span>
            <span className="text-2xl font-bold">{clipDuration}s</span>
          </div>

          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={clipDuration}
            onChange={(e) => handleClipDurationChange(Number(e.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/20 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:shadow-lg"
          />

          <div className="flex justify-between text-sm text-purple-300">
            <span>5s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>
      </div>

      {/* Paramètres avancés */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-center gap-2 text-purple-300 transition-colors hover:text-white"
        >
          <span
            className={`transform transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
          Paramètres avancés
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4 rounded-xl border border-white/20 bg-white/5 p-6">
            {/* Timer duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-200">Temps pour répondre</span>
                <span className="font-bold">
                  {noTimer ? 'Illimité' : `${timerDuration}s`}
                </span>
              </div>

              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={timerDuration}
                onChange={(e) =>
                  handleTimerDurationChange(Number(e.target.value))
                }
                disabled={noTimer}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-lg"
              />

              <div className="flex justify-between text-xs text-purple-300">
                <span>3s</span>
                <span>15s</span>
                <span>30s</span>
              </div>
            </div>

            {/* No timer toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
              <div>
                <div className="font-medium">Mode sans timer</div>
                <div className="text-sm text-purple-200">
                  Temps illimité pour répondre
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={noTimer}
                  onChange={(e) => handleNoTimerChange(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${noTimer ? 'bg-purple-500' : 'bg-white/20'}`}
                >
                  <div
                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${noTimer ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}
                  />
                </div>
              </div>
            </label>

            {/* Random start point toggle */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
              <div>
                <div className="font-medium">Départ aléatoire</div>
                <div className="text-sm text-purple-200">
                  Commencer à un point aléatoire de la chanson
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={randomStartPoint}
                  onChange={(e) =>
                    handleRandomStartPointChange(e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${randomStartPoint ? 'bg-purple-500' : 'bg-white/20'}`}
                >
                  <div
                    className={`h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${randomStartPoint ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}
                  />
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Validation error message */}
      {validationError && (
        <div className="rounded-lg bg-red-500/20 p-4 text-center text-red-200">
          {validationError}
        </div>
      )}

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
