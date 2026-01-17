// Placeholder - will be fully implemented in Epic 5
'use client'

interface TimerProps {
  duration: number
  remaining: number
}

export function Timer({ duration, remaining }: TimerProps) {
  const progress = (remaining / duration) * 100
  const isUrgent = remaining <= 2

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cercle de progression */}
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90 transform">
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
          {/* Progression */}
          <circle
            cx="64"
            cy="64"
            r="58"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * progress) / 100}
            strokeLinecap="round"
            className={`transition-all duration-200 ${
              isUrgent ? 'text-red-500' : 'text-yellow-400'
            }`}
          />
        </svg>
        {/* Nombre */}
        <div
          className={`absolute inset-0 flex items-center justify-center text-5xl font-bold ${
            isUrgent ? 'animate-pulse text-red-500' : 'text-white'
          }`}
        >
          {remaining}
        </div>
      </div>

      <p className="text-lg text-purple-200">Temps pour répondre...</p>
    </div>
  )
}
