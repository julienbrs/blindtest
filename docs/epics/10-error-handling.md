# Epic 10 : Gestion des erreurs et edge cases

## Objectif

Gérer gracieusement toutes les situations d'erreur possibles pour une expérience utilisateur robuste.

## Dépendances

- Application fonctionnelle (Epics 1-6)

---

## Issues

### 10.1 Gérer l'erreur "dossier audio vide"

**Priorité** : P0 (Critique)

**Description**
Afficher un message clair si la bibliothèque musicale est vide ou si le chemin est invalide.

**Détection**

```typescript
// Dans /api/songs
const songs = await getSongsCache()
if (songs.length === 0) {
  return NextResponse.json(
    { error: 'EMPTY_LIBRARY', message: 'Aucune chanson trouvée' },
    { status: 404 }
  )
}
```

**UI**

```tsx
function EmptyLibraryError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="text-6xl mb-4">🎵</div>
      <h2 className="text-2xl font-bold mb-2">Aucune chanson trouvée</h2>
      <p className="text-purple-300 mb-6 max-w-md">
        Vérifiez que le chemin vers votre bibliothèque musicale est correct et
        que le dossier contient des fichiers audio (MP3, FLAC, OGG, WAV).
      </p>
      <div className="bg-white/10 rounded-lg p-4 text-left font-mono text-sm">
        <p className="text-purple-400">Chemin configuré :</p>
        <p className="text-white">
          {process.env.AUDIO_FOLDER_PATH || 'Non défini'}
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}
```

**Critères d'acceptation**

- [ ] Message clair et utile
- [ ] Affiche le chemin configuré
- [ ] Bouton pour réessayer
- [ ] Pas de crash de l'application

---

### 10.2 Gérer l'erreur "fichier audio introuvable"

**Priorité** : P1 (Important)

**Description**
Si un fichier a été déplacé/supprimé depuis le scan, gérer gracieusement.

**Détection**

```typescript
// Dans /api/audio/[id]
try {
  const stat = statSync(filePath)
} catch (error) {
  if (error.code === 'ENOENT') {
    return NextResponse.json(
      { error: 'FILE_NOT_FOUND', message: 'Fichier audio introuvable' },
      { status: 404 }
    )
  }
  throw error
}
```

**Comportement**

1. Logger l'erreur côté serveur
2. Retourner 404
3. Côté client : skip automatique vers la chanson suivante

```typescript
// Dans la logique de jeu
async function loadRandomSong() {
  const res = await fetch(`/api/songs/random?exclude=${excludeIds}`)
  const data = await res.json()

  if (!data.song) {
    // Plus de chansons
    return
  }

  // Vérifier que le fichier est lisible
  const audioTest = await fetch(`/api/audio/${data.song.id}`, {
    method: 'HEAD',
  })
  if (!audioTest.ok) {
    // Fichier introuvable, exclure et réessayer
    setExcludeIds((prev) => [...prev, data.song.id])
    loadRandomSong()
    return
  }

  game.actions.loadSong(data.song)
}
```

**Critères d'acceptation**

- [ ] Skip automatique si fichier manquant
- [ ] Log de l'erreur
- [ ] Pas de blocage du jeu

---

### 10.3 Gérer l'erreur réseau

**Priorité** : P1 (Important)

**Description**
Gérer les cas où le serveur ne répond pas ou la connexion est perdue.

**Détection**

```typescript
async function fetchWithTimeout(
  url: string,
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT')
    }
    throw error
  }
}
```

**UI - Toast d'erreur**

```tsx
function NetworkErrorToast({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-900/90 backdrop-blur rounded-xl p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="text-red-400">⚠️</div>
        <div className="flex-1">
          <h4 className="font-semibold">Erreur de connexion</h4>
          <p className="text-sm text-red-200">
            Impossible de contacter le serveur. Vérifiez votre connexion.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 text-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
```

**Retry automatique**

```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(url)
      if (res.ok) return res
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))) // Backoff
    }
  }
  throw new Error('MAX_RETRIES')
}
```

**Critères d'acceptation**

- [ ] Timeout après 10s
- [ ] Retry automatique (3 tentatives)
- [ ] Message d'erreur clair
- [ ] Option de réessayer manuellement

---

### 10.4 Gérer le navigateur sans support audio

**Priorité** : P2 (Nice-to-have)

**Description**
Détecter si le navigateur ne supporte pas l'API Audio HTML5.

**Détection**

```typescript
function checkAudioSupport(): boolean {
  const audio = document.createElement('audio')
  return !!(
    audio.canPlayType && audio.canPlayType('audio/mpeg').replace(/no/, '')
  )
}

// Au chargement
useEffect(() => {
  if (!checkAudioSupport()) {
    setError({
      type: 'BROWSER_UNSUPPORTED',
      message: 'Votre navigateur ne supporte pas la lecture audio.',
    })
  }
}, [])
```

**UI**

```tsx
<div className="text-center p-8">
  <h2 className="text-2xl font-bold text-red-400">Navigateur non supporté</h2>
  <p className="mt-4">
    Votre navigateur ne supporte pas la lecture audio HTML5. Veuillez utiliser
    un navigateur moderne comme Chrome, Firefox, Safari ou Edge.
  </p>
</div>
```

**Critères d'acceptation**

- [ ] Détection au chargement
- [ ] Message explicatif
- [ ] Suggestion de navigateurs

---

### 10.5 Ajouter un état de chargement global

**Priorité** : P0 (Critique)

**Description**
Afficher un spinner ou écran de chargement pendant le scan initial de la bibliothèque.

**Implémentation**

```tsx
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full" />
      <p className="mt-4 text-purple-300 animate-pulse">
        Chargement de la bibliothèque...
      </p>
    </div>
  )
}

// Usage
function HomePage() {
  const { data, isLoading, error } = useSongs()

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return <GameConfigForm songs={data.songs} />
}
```

**Variante avec progression**

```tsx
function LoadingScreenWithProgress({ progress }: { progress: number }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-purple-300">Scan en cours... {progress}%</p>
    </div>
  )
}
```

**Critères d'acceptation**

- [ ] Spinner visible pendant le chargement
- [ ] Message explicatif
- [ ] Pas de flash de contenu vide

---

### 10.6 Gérer la perte de focus de la page

**Priorité** : P2 (Nice-to-have)

**Description**
Mettre en pause automatiquement quand l'utilisateur change d'onglet.

**Implémentation**

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && state.status === 'playing') {
      game.actions.pause()
      setWasPausedByVisibility(true)
    } else if (!document.hidden && wasPausedByVisibility) {
      // Optionnel : reprendre automatiquement
      // game.actions.play()
      setWasPausedByVisibility(false)
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () =>
    document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [state.status])
```

**Comportement suggéré**

- Pause automatique quand on quitte l'onglet
- NE PAS reprendre automatiquement (pour éviter les surprises)
- Afficher un message "Partie en pause"

**Critères d'acceptation**

- [ ] Pause quand onglet inactif
- [ ] Timer également pausé
- [ ] Reprise manuelle requise

---

### 10.7 Ajouter des messages d'erreur user-friendly

**Priorité** : P1 (Important)

**Description**
Système de notification (toast) pour afficher les erreurs de manière non-intrusive.

**Hook useToast**

```typescript
interface Toast {
  id: string
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  duration?: number
}

const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}>()

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...toast, id }])

    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration || 5000)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
```

**ToastContainer**

```tsx
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg shadow-xl ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'success'
                  ? 'bg-green-600'
                  : toast.type === 'warning'
                    ? 'bg-yellow-600'
                    : 'bg-blue-600'
            }`}
          >
            <p>{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

**Usage**

```tsx
const { addToast } = useToast()

try {
  await loadSong()
} catch (error) {
  addToast({
    type: 'error',
    message: 'Impossible de charger la chanson. Réessai en cours...',
  })
}
```

**Critères d'acceptation**

- [ ] Toasts pour erreurs, succès, warnings
- [ ] Auto-dismiss après 5s
- [ ] Animation d'entrée/sortie
- [ ] Empilables

---

### 10.8 Logger les erreurs côté serveur

**Priorité** : P2 (Nice-to-have)

**Description**
Enregistrer les erreurs pour faciliter le debug.

**Implémentation simple**

```typescript
function logError(context: string, error: unknown) {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error(
    JSON.stringify(
      {
        timestamp,
        context,
        message,
        stack,
      },
      null,
      2
    )
  )
}

// Usage dans les API routes
export async function GET(request: NextRequest) {
  try {
    // ...
  } catch (error) {
    logError('GET /api/songs', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

**Format de log**

```json
{
  "timestamp": "2024-01-17T10:30:00.000Z",
  "context": "GET /api/audio/abc123",
  "message": "ENOENT: no such file or directory",
  "stack": "Error: ENOENT..."
}
```

**Critères d'acceptation**

- [ ] Erreurs loggées avec timestamp
- [ ] Contexte (endpoint) inclus
- [ ] Stack trace pour debug
- [ ] Format JSON parseable

---

## Checklist de l'Epic

- [ ] 10.1 Erreur bibliothèque vide
- [ ] 10.2 Erreur fichier introuvable
- [ ] 10.3 Erreur réseau
- [ ] 10.4 Navigateur non supporté
- [ ] 10.5 État de chargement
- [ ] 10.6 Perte de focus
- [ ] 10.7 Toasts user-friendly
- [ ] 10.8 Logging serveur

## Estimation

~2-3 heures de travail
