# Epic 11 : Configuration et personnalisation

## Objectif
Ajouter des options de configuration avancées pour personnaliser l'expérience de jeu.

## Dépendances
- MVP fonctionnel (Epics 1-6)
- Interface de base (Epic 4)

---

## Issues

### 11.1 Permettre de configurer le chemin audio
**Priorité** : P0 (Critique)

**Description**
Permettre de spécifier le chemin vers le dossier contenant les fichiers audio.

**Via variable d'environnement** (recommandé pour production)
```env
# .env.local
AUDIO_FOLDER_PATH=/volume1/music
```

**Via interface admin** (optionnel)
```tsx
// Page /admin ou /settings
function AudioPathSettings() {
  const [path, setPath] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  const testPath = async () => {
    setStatus('testing')
    try {
      const res = await fetch('/api/admin/test-path', {
        method: 'POST',
        body: JSON.stringify({ path }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm text-purple-300">Chemin du dossier audio</span>
        <input
          type="text"
          value={path}
          onChange={e => setPath(e.target.value)}
          placeholder="/chemin/vers/musique"
          className="mt-1 w-full p-3 bg-white/10 rounded-lg"
        />
      </label>
      <button onClick={testPath} disabled={status === 'testing'}>
        {status === 'testing' ? 'Test en cours...' : 'Tester le chemin'}
      </button>
      {status === 'success' && <p className="text-green-400">✓ Chemin valide</p>}
      {status === 'error' && <p className="text-red-400">✗ Chemin invalide</p>}
    </div>
  )
}
```

**API endpoint**
```typescript
// /api/admin/test-path
export async function POST(request: NextRequest) {
  const { path } = await request.json()

  try {
    const stats = await stat(path)
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 })
    }

    const files = await readdir(path)
    const audioFiles = files.filter(f =>
      ['.mp3', '.wav', '.flac', '.ogg'].some(ext => f.toLowerCase().endsWith(ext))
    )

    return NextResponse.json({
      success: true,
      filesFound: audioFiles.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
}
```

**Critères d'acceptation**
- [ ] Variable d'environnement fonctionnelle
- [ ] Validation du chemin
- [ ] Message d'erreur si invalide

---

### 11.2 Permettre de changer le timer (pas que 5s)
**Priorité** : P2 (Nice-to-have)

**Description**
Option pour modifier la durée du timer de réponse (ex: 3s, 5s, 10s).

**Dans GameConfig**
```typescript
interface GameConfig {
  guessMode: GuessMode
  clipDuration: number
  timerDuration: number  // Nouveau
}
```

**UI**
```tsx
<div className="space-y-2">
  <label className="text-sm text-purple-300">
    Temps pour répondre
  </label>
  <div className="flex gap-2">
    {[3, 5, 10, 15].map(seconds => (
      <button
        key={seconds}
        onClick={() => setTimerDuration(seconds)}
        className={`px-4 py-2 rounded-lg ${
          timerDuration === seconds
            ? 'bg-purple-500'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {seconds}s
      </button>
    ))}
  </div>
</div>
```

**Critères d'acceptation**
- [ ] Options 3s, 5s, 10s, 15s
- [ ] Valeur par défaut 5s
- [ ] Persistée avec les autres paramètres

---

### 11.3 Ajouter un mode "sans timer"
**Priorité** : P2 (Nice-to-have)

**Description**
Option pour désactiver le timer, le MJ valide quand il veut.

**Implémentation**
```typescript
interface GameConfig {
  // ...
  timerEnabled: boolean
}

// Dans le reducer
case 'BUZZ':
  if (!config.timerEnabled) {
    // Pas de timer, rester en état BUZZED
    return { ...state, status: 'buzzed' }
  }
  return { ...state, status: 'timer', timerRemaining: config.timerDuration }
```

**UI**
```tsx
<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={timerEnabled}
    onChange={e => setTimerEnabled(e.target.checked)}
    className="w-5 h-5 rounded"
  />
  <span>Activer le timer de réponse</span>
</label>
```

**Critères d'acceptation**
- [ ] Toggle on/off
- [ ] Timer masqué si désactivé
- [ ] Validation manuelle uniquement

---

### 11.4 Permettre de définir un point de départ dans la chanson
**Priorité** : P2 (Nice-to-have)

**Description**
Éviter les longues intros en commençant à un point aléatoire dans la chanson.

**Options**
1. **Début de la chanson** (actuel)
2. **Aléatoire** : Point entre 10% et 50% de la durée
3. **Skip intro** : Commencer après les premières 30 secondes

**Implémentation**
```typescript
type StartPosition = 'beginning' | 'random' | 'skip_intro'

function getStartPosition(song: Song, mode: StartPosition): number {
  switch (mode) {
    case 'beginning':
      return 0
    case 'random':
      const minStart = song.duration * 0.1
      const maxStart = song.duration * 0.5
      return minStart + Math.random() * (maxStart - minStart)
    case 'skip_intro':
      return Math.min(30, song.duration * 0.2)
  }
}

// Dans AudioPlayer
useEffect(() => {
  if (audioRef.current && startPosition > 0) {
    audioRef.current.currentTime = startPosition
  }
}, [startPosition])
```

**Critères d'acceptation**
- [ ] 3 options de départ
- [ ] Position correcte appliquée
- [ ] Pas de bug si chanson courte

---

### 11.5 Ajouter des filtres sur la bibliothèque
**Priorité** : P2 (Nice-to-have)

**Description**
Filtrer les chansons par artiste, année, genre avant de jouer.

**Interface**
```tsx
function LibraryFilters() {
  const [artists, setArtists] = useState<string[]>([])
  const [yearRange, setYearRange] = useState<[number, number]>([1960, 2024])
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])

  // Charger la liste des artistes
  useEffect(() => {
    fetch('/api/artists').then(r => r.json()).then(setArtists)
  }, [])

  return (
    <div className="space-y-4">
      {/* Filtre par artiste */}
      <div>
        <h3>Artistes</h3>
        <select
          multiple
          value={selectedArtists}
          onChange={e => setSelectedArtists(Array.from(e.target.selectedOptions, o => o.value))}
        >
          {artists.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Filtre par année */}
      <div>
        <h3>Période : {yearRange[0]} - {yearRange[1]}</h3>
        {/* Double slider */}
      </div>
    </div>
  )
}
```

**API**
```typescript
// GET /api/songs?artists=Queen,ABBA&yearMin=1970&yearMax=1989
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const artistsFilter = searchParams.get('artists')?.split(',')
  const yearMin = Number(searchParams.get('yearMin')) || 0
  const yearMax = Number(searchParams.get('yearMax')) || 9999

  let songs = await getSongsCache()

  if (artistsFilter?.length) {
    songs = songs.filter(s => artistsFilter.includes(s.artist))
  }
  if (yearMin || yearMax < 9999) {
    songs = songs.filter(s => s.year && s.year >= yearMin && s.year <= yearMax)
  }

  return NextResponse.json({ songs, total: songs.length })
}
```

**Critères d'acceptation**
- [ ] Filtre par artiste (multi-sélection)
- [ ] Filtre par période (range)
- [ ] Cumul des filtres
- [ ] Affichage du nombre de chansons filtrées

---

### 11.6 Créer des playlists personnalisées
**Priorité** : P2 (Nice-to-have)

**Description**
Permettre de créer des sous-ensembles de chansons pour des parties thématiques.

**Stockage** : localStorage ou fichier JSON

**Interface**
```tsx
function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

  return (
    <div>
      <h2>Mes playlists</h2>
      <ul>
        {playlists.map(p => (
          <li key={p.id}>
            {p.name} ({p.songIds.length} chansons)
            <button onClick={() => editPlaylist(p.id)}>Modifier</button>
          </li>
        ))}
      </ul>
      <button onClick={createNewPlaylist}>+ Nouvelle playlist</button>
    </div>
  )
}
```

**Type**
```typescript
interface Playlist {
  id: string
  name: string
  songIds: string[]
  createdAt: number
}
```

**Critères d'acceptation**
- [ ] Créer/modifier/supprimer des playlists
- [ ] Sélectionner des chansons
- [ ] Jouer uniquement la playlist
- [ ] Persistence localStorage

---

## Checklist de l'Epic

- [ ] 11.1 Chemin audio configurable
- [ ] 11.2 Timer personnalisable
- [ ] 11.3 Mode sans timer
- [ ] 11.4 Point de départ chanson
- [ ] 11.5 Filtres bibliothèque
- [ ] 11.6 Playlists personnalisées

## Estimation
~4-5 heures de travail
