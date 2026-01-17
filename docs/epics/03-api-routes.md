# Epic 3 : Backend - API Routes

## Objectif
Créer les endpoints REST pour exposer la bibliothèque musicale, streamer les fichiers audio, et servir les pochettes d'album.

## Dépendances
- Epic 1 et 2 terminés
- Scanner audio fonctionnel

---

## Issues

### 3.1 Créer GET /api/songs
**Priorité** : P0 (Critique)

**Description**
Endpoint qui retourne la liste complète des chansons avec leurs métadonnées.

**Fichier** : `src/app/api/songs/route.ts`

**Implémentation**
```typescript
import { NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import type { SongsListResponse } from '@/lib/types'

export async function GET() {
  try {
    const songs = await getSongsCache()

    const response: SongsListResponse = {
      songs,
      total: songs.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur GET /api/songs:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des chansons' },
      { status: 500 }
    )
  }
}
```

**Réponse**
```json
{
  "songs": [
    {
      "id": "a1b2c3d4e5f6",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "year": 1975,
      "duration": 354,
      "format": "mp3",
      "hasCover": true
    }
  ],
  "total": 150
}
```

**Critères d'acceptation**
- [ ] Retourne la liste des chansons en JSON
- [ ] Inclut le count total
- [ ] Gestion des erreurs avec status 500
- [ ] Premier appel peut être lent (scan initial)

---

### 3.2 Créer GET /api/songs/random
**Priorité** : P0 (Critique)

**Description**
Endpoint qui retourne une chanson aléatoire, avec possibilité d'exclure certaines chansons déjà jouées.

**Fichier** : `src/app/api/songs/random/route.ts`

**Implémentation**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'
import type { RandomSongResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const songs = await getSongsCache()

    if (songs.length === 0) {
      return NextResponse.json(
        { error: 'Aucune chanson disponible' },
        { status: 404 }
      )
    }

    // Récupérer les IDs à exclure depuis les query params
    const searchParams = request.nextUrl.searchParams
    const excludeParam = searchParams.get('exclude')
    const excludeIds = excludeParam ? excludeParam.split(',') : []

    // Filtrer les chansons déjà jouées
    const availableSongs = songs.filter(song => !excludeIds.includes(song.id))

    if (availableSongs.length === 0) {
      return NextResponse.json(
        { error: 'Toutes les chansons ont été jouées' },
        { status: 404 }
      )
    }

    // Sélectionner une chanson aléatoire
    const randomIndex = Math.floor(Math.random() * availableSongs.length)
    const song = availableSongs[randomIndex]

    const response: RandomSongResponse = { song }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur GET /api/songs/random:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sélection aléatoire' },
      { status: 500 }
    )
  }
}
```

**Query Parameters**
- `exclude` : IDs séparés par des virgules à exclure

**Exemples**
```
GET /api/songs/random
GET /api/songs/random?exclude=abc123,def456,ghi789
```

**Critères d'acceptation**
- [ ] Retourne une chanson aléatoire
- [ ] Support du paramètre `exclude`
- [ ] Erreur 404 si aucune chanson disponible
- [ ] Distribution aléatoire uniforme

---

### 3.3 Créer GET /api/songs/[id]
**Priorité** : P1 (Important)

**Description**
Endpoint qui retourne les détails d'une chanson spécifique par son ID.

**Fichier** : `src/app/api/songs/[id]/route.ts`

**Implémentation**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache } from '@/lib/audioScanner'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songs = await getSongsCache()
    const song = songs.find(s => s.id === params.id)

    if (!song) {
      return NextResponse.json(
        { error: 'Chanson non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ song })
  } catch (error) {
    console.error(`Erreur GET /api/songs/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
```

**Critères d'acceptation**
- [ ] Retourne la chanson si trouvée
- [ ] Erreur 404 si ID inconnu
- [ ] Validation du format de l'ID

---

### 3.4 Créer GET /api/audio/[id]
**Priorité** : P0 (Critique)

**Description**
Endpoint qui streame le fichier audio. Support des Range Requests pour le seeking.

**Fichier** : `src/app/api/audio/[id]/route.ts`

**Implémentation**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { getSongsCache } from '@/lib/audioScanner'

const MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songs = await getSongsCache()
    const song = songs.find(s => s.id === params.id)

    if (!song) {
      return NextResponse.json({ error: 'Chanson non trouvée' }, { status: 404 })
    }

    const filePath = song.filePath
    const stat = statSync(filePath)
    const fileSize = stat.size
    const mimeType = MIME_TYPES[song.format] || 'audio/mpeg'

    // Vérifier si c'est une Range Request
    const range = request.headers.get('range')

    if (range) {
      // Parse le range header
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const stream = createReadStream(filePath, { start, end })
      const chunks: Uint8Array[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mimeType,
        },
      })
    }

    // Requête complète
    const stream = createReadStream(filePath)
    const chunks: Uint8Array[] = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)

    return new NextResponse(buffer, {
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error(`Erreur GET /api/audio/${params.id}:`, error)
    return NextResponse.json({ error: 'Erreur streaming' }, { status: 500 })
  }
}
```

**Headers importants**
- `Content-Type` : MIME type du fichier audio
- `Content-Length` : Taille du fichier/chunk
- `Accept-Ranges: bytes` : Indique le support des Range Requests
- `Content-Range` : Pour les réponses 206 Partial Content

**Critères d'acceptation**
- [ ] Stream du fichier audio complet
- [ ] Support des Range Requests (status 206)
- [ ] MIME type correct selon le format
- [ ] Seeking fonctionne dans le lecteur

---

### 3.5 Créer GET /api/cover/[id]
**Priorité** : P0 (Critique)

**Description**
Endpoint qui retourne la pochette d'album d'une chanson.

**Fichier** : `src/app/api/cover/[id]/route.ts`

**Implémentation**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSongsCache, extractCover } from '@/lib/audioScanner'

// Placeholder image en base64 (simple icône musique)
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#374151"/>
  <circle cx="100" cy="100" r="60" fill="none" stroke="#9CA3AF" stroke-width="4"/>
  <circle cx="100" cy="100" r="20" fill="#9CA3AF"/>
</svg>`

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songs = await getSongsCache()
    const song = songs.find(s => s.id === params.id)

    if (!song) {
      return NextResponse.json({ error: 'Chanson non trouvée' }, { status: 404 })
    }

    const coverBuffer = await extractCover(song.filePath)

    if (coverBuffer) {
      // Détecter le type d'image
      let mimeType = 'image/jpeg'
      if (coverBuffer[0] === 0x89 && coverBuffer[1] === 0x50) {
        mimeType = 'image/png'
      } else if (coverBuffer[0] === 0x47 && coverBuffer[1] === 0x49) {
        mimeType = 'image/gif'
      }

      return new NextResponse(coverBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000', // Cache 1 an
        },
      })
    }

    // Retourner le placeholder SVG
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error(`Erreur GET /api/cover/${params.id}:`, error)
    return NextResponse.json({ error: 'Erreur récupération pochette' }, { status: 500 })
  }
}
```

**Critères d'acceptation**
- [ ] Retourne la pochette embedded si disponible
- [ ] Fallback sur cover.jpg du dossier
- [ ] Placeholder SVG si aucune pochette
- [ ] Cache headers pour performance

---

### 3.6 Gérer les Range Requests pour l'audio
**Priorité** : P1 (Important)

**Description**
Les Range Requests permettent au navigateur de demander seulement une partie du fichier, nécessaire pour le seeking dans le lecteur audio.

**Comportement**
1. Client envoie `Range: bytes=0-` pour commencer
2. Serveur répond `206 Partial Content` avec `Content-Range`
3. Client peut demander d'autres ranges pour le seeking

**Test**
```bash
curl -I -H "Range: bytes=0-1023" http://localhost:3000/api/audio/abc123
```

**Réponse attendue**
```
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/5242880
Content-Length: 1024
Content-Type: audio/mpeg
Accept-Ranges: bytes
```

**Critères d'acceptation**
- [ ] Header Range parsé correctement
- [ ] Status 206 pour les requêtes partielles
- [ ] Content-Range header correct
- [ ] Seeking fonctionne sur Chrome, Firefox, Safari

---

### 3.7 Ajouter les headers CORS appropriés
**Priorité** : P1 (Important)

**Description**
Si l'application est accédée depuis un domaine différent (ex: téléphones en mode multi), configurer CORS.

**Configuration** : `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Range' },
          { key: 'Access-Control-Expose-Headers', value: 'Content-Range, Accept-Ranges' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**Note** : En production, remplacer `*` par les domaines autorisés.

**Critères d'acceptation**
- [ ] CORS configuré dans next.config.js
- [ ] Requêtes cross-origin fonctionnent
- [ ] Headers exposés pour Range Requests

---

### 3.8 Créer GET /api/stats
**Priorité** : P2 (Nice-to-have)

**Description**
Endpoint qui retourne des statistiques sur la bibliothèque.

**Fichier** : `src/app/api/stats/route.ts`

**Implémentation**
```typescript
import { NextResponse } from 'next/server'
import { getSongsCache, getCacheInfo } from '@/lib/audioScanner'

export async function GET() {
  try {
    const songs = await getSongsCache()
    const cacheInfo = getCacheInfo()

    // Calculer les stats
    const artists = new Set(songs.map(s => s.artist))
    const albums = new Set(songs.filter(s => s.album).map(s => s.album))
    const formats = songs.reduce((acc, s) => {
      acc[s.format] = (acc[s.format] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalDuration = songs.reduce((sum, s) => sum + s.duration, 0)

    return NextResponse.json({
      totalSongs: songs.length,
      totalArtists: artists.size,
      totalAlbums: albums.size,
      totalDuration: Math.round(totalDuration),
      totalDurationFormatted: formatDuration(totalDuration),
      formats,
      songsWithCover: songs.filter(s => s.hasCover).length,
      lastScan: cacheInfo.lastScan,
    })
  } catch (error) {
    console.error('Erreur GET /api/stats:', error)
    return NextResponse.json({ error: 'Erreur stats' }, { status: 500 })
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}min`
}
```

**Réponse**
```json
{
  "totalSongs": 150,
  "totalArtists": 45,
  "totalAlbums": 30,
  "totalDuration": 36000,
  "totalDurationFormatted": "10h 0min",
  "formats": { "mp3": 120, "flac": 30 },
  "songsWithCover": 140,
  "lastScan": 1705487200000
}
```

**Critères d'acceptation**
- [ ] Stats calculées correctement
- [ ] Durée formatée lisible
- [ ] Répartition par format

---

### 3.9 Optimiser le streaming audio
**Priorité** : P2 (Nice-to-have)

**Description**
Améliorer les performances du streaming pour les grandes bibliothèques et les connexions lentes.

**Optimisations**
1. **Chunked streaming** : Ne pas charger tout le fichier en mémoire
2. **Buffer approprié** : Chunks de 64KB
3. **Early hints** : Envoyer les headers avant le body

**Implémentation alternative avec streaming pur**
```typescript
import { createReadStream, statSync } from 'fs'
import { Readable } from 'stream'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // ... validation ...

  const stream = createReadStream(filePath)
  const webStream = Readable.toWeb(stream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': fileSize.toString(),
    },
  })
}
```

**Critères d'acceptation**
- [ ] Mémoire stable même avec gros fichiers
- [ ] Pas de timeout sur fichiers lents
- [ ] Compatible avec tous les navigateurs

---

### 3.10 Créer POST /api/songs/rescan
**Priorité** : P2 (Nice-to-have)

**Description**
Endpoint pour forcer un re-scan de la bibliothèque musicale.

**Fichier** : `src/app/api/songs/rescan/route.ts`

**Implémentation**
```typescript
import { NextResponse } from 'next/server'
import { refreshCache, getCacheInfo } from '@/lib/audioScanner'

export async function POST() {
  try {
    const startTime = Date.now()
    await refreshCache()
    const duration = Date.now() - startTime
    const info = getCacheInfo()

    return NextResponse.json({
      success: true,
      songsFound: info.count,
      scanDuration: duration,
      message: `Scan terminé: ${info.count} chansons trouvées en ${duration}ms`,
    })
  } catch (error) {
    console.error('Erreur POST /api/songs/rescan:', error)
    return NextResponse.json(
      { error: 'Erreur lors du rescan' },
      { status: 500 }
    )
  }
}
```

**Sécurité**
En production, protéger cet endpoint (token, IP whitelist, etc.)

**Critères d'acceptation**
- [ ] Déclenche un nouveau scan
- [ ] Retourne le nombre de chansons
- [ ] Indique la durée du scan

---

## Checklist de l'Epic

- [ ] 3.1 GET /api/songs
- [ ] 3.2 GET /api/songs/random
- [ ] 3.3 GET /api/songs/[id]
- [ ] 3.4 GET /api/audio/[id]
- [ ] 3.5 GET /api/cover/[id]
- [ ] 3.6 Range Requests supportés
- [ ] 3.7 CORS configuré
- [ ] 3.8 GET /api/stats
- [ ] 3.9 Streaming optimisé
- [ ] 3.10 POST /api/songs/rescan

## Estimation
~3-4 heures de travail
