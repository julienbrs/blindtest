// Placeholder - will be fully implemented in Epic 5
'use client'

interface AudioPlayerProps {
  songId: string | undefined
  isPlaying: boolean
  maxDuration: number
  onEnded: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioPlayer({
  songId: _songId,
  isPlaying: _isPlaying,
  maxDuration,
  onEnded: _onEnded,
}: AudioPlayerProps) {
  const currentTime = 0
  const progress = 0

  return (
    <div className="w-full max-w-md">
      {/* Barre de progression */}
      <div className="h-2 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-200"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Temps */}
      <div className="mt-2 flex justify-between text-sm text-purple-300">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(maxDuration)}</span>
      </div>
    </div>
  )
}
