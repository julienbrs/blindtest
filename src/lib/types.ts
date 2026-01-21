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
  | { type: 'CLIP_ENDED' }
  | { type: 'REPLAY' }
