import { GameConfigForm } from '@/components/game/GameConfigForm'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      {/* Logo / Titre */}
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl">
          Blindtest
        </h1>
        <p className="mt-2 text-lg text-purple-200">
          Testez vos connaissances musicales !
        </p>
      </div>

      {/* Decorative music icons */}
      <div className="mb-8 flex items-center gap-4 text-4xl opacity-60">
        <span className="animate-bounce" style={{ animationDelay: '0s' }}>
          🎵
        </span>
        <span
          className="animate-bounce"
          style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}
        >
          🎶
        </span>
        <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>
          🎤
        </span>
      </div>

      {/* Game configuration form */}
      <GameConfigForm />

      {/* Placeholder for LibraryStats - will be added in issue 4.6 */}
      <div className="mt-8 text-center text-purple-200">
        <p className="text-sm">Statistiques de la bibliothèque (à venir)</p>
      </div>
    </main>
  )
}
