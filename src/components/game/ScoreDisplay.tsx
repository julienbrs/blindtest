// Placeholder - will be fully styled in Epic 5
interface ScoreDisplayProps {
  score: number
  songsPlayed: number
}

export function ScoreDisplay({ score, songsPlayed }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-lg bg-white/10 px-4 py-2">
        <div className="text-sm text-purple-300">Score</div>
        <div className="text-2xl font-bold">{score}</div>
      </div>
      <div className="text-purple-300">
        {songsPlayed} chanson{songsPlayed !== 1 ? 's' : ''} jouée
        {songsPlayed !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
