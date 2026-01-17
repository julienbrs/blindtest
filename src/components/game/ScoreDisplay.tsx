interface ScoreDisplayProps {
  score: number
  songsPlayed: number
  currentSongNumber?: number
}

export function ScoreDisplay({
  score,
  songsPlayed,
  currentSongNumber,
}: ScoreDisplayProps) {
  // If currentSongNumber is provided, use it; otherwise calculate as songsPlayed + 1
  const songNumber = currentSongNumber ?? songsPlayed + 1

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-lg bg-white/10 px-4 py-2">
        <div className="text-sm text-purple-300">Score</div>
        <div className="text-2xl font-bold">{score}</div>
      </div>
      <div className="flex flex-col text-purple-300">
        <span className="font-semibold text-white">Chanson {songNumber}</span>
        <span className="text-sm">
          {songsPlayed} jouée{songsPlayed !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
