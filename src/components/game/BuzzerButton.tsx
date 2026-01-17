'use client'

interface BuzzerButtonProps {
  onBuzz: () => void
  disabled?: boolean
}

export function BuzzerButton({ onBuzz, disabled = false }: BuzzerButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      // Trigger mobile vibration if supported
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(100)
      }
      onBuzz()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        h-40 w-40 md:h-48 md:w-48
        rounded-full
        border-4 border-red-400
        bg-gradient-to-br from-red-500 to-red-700
        text-2xl font-bold text-white
        shadow-[0_0_60px_rgba(239,68,68,0.5)]
        transition-all duration-150
        hover:scale-105 hover:shadow-[0_0_80px_rgba(239,68,68,0.7)]
        focus:outline-none focus:ring-4 focus:ring-red-400/50
        active:scale-95 active:shadow-[0_0_40px_rgba(239,68,68,0.3)]
        disabled:cursor-not-allowed disabled:opacity-50
      `}
    >
      BUZZ!
    </button>
  )
}
