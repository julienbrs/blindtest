'use client'

import { MusicalNoteIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface EmptyLibraryErrorProps {
  audioFolderPath: string
}

export function EmptyLibraryError({ audioFolderPath }: EmptyLibraryErrorProps) {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="text-6xl mb-4">
        <MusicalNoteIcon className="h-16 w-16 text-purple-400 mx-auto" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-white">
        Aucune chanson trouvée
      </h2>
      <p className="text-purple-300 mb-6 max-w-md">
        Vérifiez que le chemin vers votre bibliothèque musicale est correct et
        que le dossier contient des fichiers audio (MP3, FLAC, OGG, WAV).
      </p>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left font-mono text-sm mb-6 border border-white/10">
        <p className="text-purple-400">Chemin configuré :</p>
        <p className="text-white break-all">{audioFolderPath}</p>
      </div>
      <Button variant="primary" onClick={handleRetry}>
        <ArrowPathIcon className="h-5 w-5 mr-2" />
        Réessayer
      </Button>
    </div>
  )
}
