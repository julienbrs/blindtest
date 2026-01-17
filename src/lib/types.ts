// ============================================
// Types pour les chansons
// ============================================

export interface Song {
  id: string // Hash unique du fichier
  title: string // Titre de la chanson
  artist: string // Artiste/groupe
  album?: string // Nom de l'album (optionnel)
  year?: number // Année de sortie (optionnel)
  duration: number // Durée en secondes
  filePath: string // Chemin absolu du fichier
  format: AudioFormat // Format du fichier
  hasCover: boolean // Si une pochette est disponible
}

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac'

// ============================================
// Types pour la configuration de partie
// ============================================

export interface GameConfig {
  guessMode: GuessMode // Ce qu'il faut deviner
  clipDuration: number // Durée de l'extrait en secondes
  timerDuration: number // Temps pour répondre après buzz
}

export type GuessMode = 'title' | 'artist' | 'both'

// ============================================
// Types pour l'état du jeu
// ============================================

export interface GameState {
  status: GameStatus // État actuel de la machine
  currentSong: Song | null // Chanson en cours
  score: number // Score actuel
  songsPlayed: number // Nombre de chansons jouées
  playedSongIds: string[] // IDs des chansons déjà jouées
  timerRemaining: number // Secondes restantes sur le timer
  isRevealed: boolean // Si la réponse est révélée
}

export type GameStatus =
  | 'idle' // En attente de démarrage
  | 'loading' // Chargement d'une chanson
  | 'playing' // Musique en lecture
  | 'buzzed' // Quelqu'un a buzzé
  | 'timer' // Timer en cours
  | 'reveal' // Réponse révélée
  | 'ended' // Partie terminée

// ============================================
// Types pour les réponses API
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SongsListResponse {
  songs: Song[]
  total: number
}

export interface RandomSongResponse {
  song: Song
}

// ============================================
// Types pour les actions du jeu
// ============================================

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'LOAD_SONG'; song: Song }
  | { type: 'PLAY' }
  | { type: 'BUZZ' }
  | { type: 'TICK_TIMER' }
  | { type: 'VALIDATE'; correct: boolean }
  | { type: 'REVEAL' }
  | { type: 'NEXT_SONG' }
  | { type: 'END_GAME' }
  | { type: 'RESET' }
