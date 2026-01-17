// Placeholder - will be fully implemented in Epic 5 issues
import type { GameStatus } from '@/lib/types'

interface GameControlsProps {
  status: GameStatus
  onValidate: (correct: boolean) => void
  onReveal: () => void
  onNext: () => void
  onPlay: () => void
  onPause: () => void
}

export function GameControls({
  status,
  onValidate: _onValidate,
  onReveal: _onReveal,
  onNext: _onNext,
  onPlay: _onPlay,
  onPause: _onPause,
}: GameControlsProps) {
  return (
    <footer className="mt-6 flex justify-center gap-4">
      <div className="text-sm text-purple-300">
        Contrôles MJ - État: {status}
      </div>
    </footer>
  )
}
