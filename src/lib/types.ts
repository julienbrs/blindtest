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

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'm4a' | 'aac'

// ============================================
// Types pour la configuration de partie
// ============================================

export interface GameConfig {
  guessMode: GuessMode // Ce qu'il faut deviner
  clipDuration: number // Durée de l'extrait en secondes
  timerDuration: number // Temps pour répondre après buzz
  noTimer: boolean // Si true, pas de timer - validation manuelle uniquement
  revealDuration: number // Durée d'affichage de la révélation avant auto-advance (mode découverte)
}

export type GuessMode = 'title' | 'artist' | 'both'

/**
 * StartPosition - Options for where to start playback in a song
 *
 * - `beginning`: Start from the beginning of the song (0 seconds)
 * - `random`: Start at a random point between 10% and 50% of the song duration
 * - `skip_intro`: Skip the intro - start after the first 30 seconds (or 20% of song if shorter)
 */
export type StartPosition = 'beginning' | 'random' | 'skip_intro'

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
  previousStatus: 'playing' | 'timer' | 'buzzed' | null // État avant pause (pour resume)
  revealCountdown: number // Secondes avant passage auto à la chanson suivante (mode découverte)
  isListeningToRest: boolean // Si l'utilisateur écoute le reste de la chanson
}

/**
 * GameStatus - États possibles de la machine d'état du jeu
 *
 * ## Diagramme d'état
 * ```
 *                     ┌──────────┐
 *                     │   IDLE   │ ← État initial / Fin de partie
 *                     └────┬─────┘
 *                          │ START_GAME
 *                          ▼
 *                     ┌──────────┐
 *          ┌─────────│ LOADING  │←─────────────────────┐
 *          │         └────┬─────┘                      │
 *          │              │ Song loaded                │
 *          │              ▼                            │
 *          │         ┌──────────┐                      │
 *          │         │ PLAYING  │                      │
 *          │         └────┬─────┘                      │
 *          │              │ BUZZ                       │
 *          │              ▼                            │
 *          │         ┌──────────┐                      │
 *          │         │  BUZZED  │                      │
 *          │         └────┬─────┘                      │
 *          │              │ (immédiat)                 │
 *          │              ▼                            │
 *          │         ┌──────────┐                      │
 *          │         │  TIMER   │──── VALIDATE(true) ──┤
 *          │         └────┬─────┘                      │
 *          │              │ Timeout ou VALIDATE(false) │
 *          │              ▼                            │
 *          │         ┌──────────┐                      │
 *          └─────────│  REVEAL  │                      │
 *            QUIT    └────┬─────┘                      │
 *                         │ NEXT_SONG                  │
 *                         └────────────────────────────┘
 * ```
 *
 * ## Table des états et transitions
 *
 * | État      | Description                        | Actions possibles              |
 * |-----------|------------------------------------|---------------------------------|
 * | `idle`    | En attente, avant de démarrer      | START_GAME                     |
 * | `loading` | Chargement d'une chanson           | - (automatique vers PLAYING)   |
 * | `playing` | Musique en lecture                 | BUZZ, REVEAL, CLIP_ENDED       |
 * | `buzzed`  | Transition après buzz (transitoire)| - (immédiat vers TIMER)        |
 * | `timer`   | Countdown pour répondre            | VALIDATE, REVEAL, TICK_TIMER   |
 * | `reveal`  | Réponse affichée                   | NEXT_SONG, END_GAME            |
 * | `ended`   | Partie terminée                    | RESET                          |
 *
 * ## Détail des états
 *
 * - **idle**: État initial au chargement de la page. Attend START_GAME pour démarrer.
 * - **loading**: Récupération de la chanson depuis l'API. Transition automatique vers PLAYING quand l'audio est prêt.
 * - **playing**: L'extrait musical est en cours de lecture. Le joueur peut buzzer ou attendre la fin de l'extrait.
 * - **buzzed**: État transitoire après un buzz. Passe immédiatement à TIMER (peut servir pour animations).
 * - **timer**: Le countdown est actif. Le joueur doit donner sa réponse avant que le timer atteigne 0.
 * - **reveal**: La réponse (titre/artiste) est affichée. La pochette n'est plus floutée.
 * - **ended**: Partie terminée. Affiche le récapitulatif avec score final.
 */
export type GameStatus =
  | 'idle' // En attente de démarrage
  | 'loading' // Chargement d'une chanson
  | 'playing' // Musique en lecture
  | 'buzzed' // Quelqu'un a buzzé (transitoire)
  | 'timer' // Timer en cours
  | 'paused' // Jeu en pause (perte de focus)
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
  totalInLibrary?: number // Total songs in library before filtering
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
  | { type: 'PAUSE'; previousStatus: 'playing' | 'timer' | 'buzzed' }
  | { type: 'RESUME' }
  | { type: 'BUZZ'; timerDuration: number; noTimer: boolean }
  | { type: 'TICK_TIMER' }
  | { type: 'VALIDATE'; correct: boolean }
  | { type: 'REVEAL' }
  | { type: 'NEXT_SONG'; timerDuration: number }
  | { type: 'END_GAME' }
  | { type: 'RESET' }
  | { type: 'CLIP_ENDED'; revealDuration: number }
  | { type: 'REPLAY' }
  | { type: 'TICK_REVEAL'; revealDuration: number } // Countdown pendant reveal (mode découverte)
  | { type: 'LISTEN_TO_REST' } // Écouter le reste de la chanson
  | { type: 'QUICK_SCORE'; knew: boolean } // Score rapide pendant reveal
  | { type: 'SONG_ENDED'; revealDuration: number } // Fin de la chanson complète

// ============================================
// Types pour les playlists personnalisées
// ============================================

/**
 * Playlist - A custom collection of songs for themed games
 *
 * Playlists allow users to create curated subsets of their music library
 * for specific game sessions (e.g., "80s Hits", "Party Mix", "Rock Classics")
 */
export interface Playlist {
  id: string // Unique identifier (generated UUID)
  name: string // Display name of the playlist
  songIds: string[] // Array of song IDs included in this playlist
  createdAt: number // Unix timestamp when created
  updatedAt?: number // Unix timestamp when last modified
}

// ============================================
// Types pour le mode multijoueur
// ============================================

/**
 * RoomStatus - Possible states of a multiplayer room
 *
 * - `waiting`: Room is in lobby, waiting for players to join and host to start
 * - `playing`: Game is in progress
 * - `ended`: Game has ended, showing final scores
 */
export type RoomStatus = 'waiting' | 'playing' | 'ended'

/**
 * Room - A multiplayer game room
 *
 * Represents a game session that players can join via a 6-character code.
 * The host controls game settings and validates answers.
 */
export interface Room {
  id: string // UUID from Supabase
  code: string // 6-character room code (e.g., "ABC123")
  hostId: string // UUID of the host player
  status: RoomStatus // Current room status
  settings: GameConfig // Game configuration (guessMode, clipDuration, timerDuration, noTimer)
  currentSongId: string | null // ID of the song currently being played
  currentSongStartedAt: Date | null // Timestamp when current song started (for sync)
  createdAt: Date // When the room was created
}

/**
 * Player - A participant in a multiplayer game
 *
 * Each player has a unique ID stored in localStorage for reconnection.
 * The host player has special permissions (start game, validate answers).
 */
export interface Player {
  id: string // UUID from Supabase
  roomId: string // UUID of the room this player belongs to
  nickname: string // Display name (max 20 characters)
  avatar: string | null // Emoji avatar (unique within the room)
  score: number // Current score in this game
  isHost: boolean // Whether this player is the room host
  isOnline: boolean // Whether this player is currently connected (via presence)
  joinedAt: Date // When the player joined the room
}

/**
 * Buzz - A player's buzz attempt during a round
 *
 * Records when a player buzzed to answer. The first buzz (by timestamp)
 * wins the right to answer.
 */
export interface Buzz {
  id: string // UUID from Supabase
  roomId: string // UUID of the room
  playerId: string // UUID of the player who buzzed
  songId: string // ID of the song being played
  buzzedAt: Date // Server timestamp of the buzz
  isWinner: boolean // Whether this buzz was first (wins the round)
}

/**
 * RoomState - Combined state for multiplayer UI
 *
 * Aggregates room data, player list, and current player info
 * for easy consumption by React components.
 */
export interface RoomState {
  room: Room | null // The current room (null if not loaded/joined)
  players: Player[] // All players in the room
  myPlayerId: string | null // The current user's player ID (from localStorage)
}

/**
 * RoundHistory - Records details of a completed round for end-game recap
 *
 * Captures who buzzed, whether they answered correctly, and timing data
 * for display in the game history timeline.
 */
export interface RoundHistory {
  songId: string // ID of the song that was played
  songTitle: string // Title of the song
  songArtist: string // Artist of the song
  buzzWinner: {
    playerId: string // ID of the player who won the buzz
    nickname: string // Nickname of the player
    avatar: string | null // Emoji avatar of the player
    buzzTime: number // Time in ms from song start to buzz
  } | null // null if no one buzzed
  wasCorrect: boolean // Whether the answer was correct (false if no buzz)
  roundNumber: number // Round number (1-indexed)
}
