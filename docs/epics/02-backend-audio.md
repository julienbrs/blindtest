# Epic 2 : Backend - Gestion des fichiers audio

## Objectif
Créer le système de scan et d'extraction des métadonnées des fichiers audio. Ce module est le coeur du backend, il permet de construire la bibliothèque musicale à partir des fichiers présents sur le NAS.

## Dépendances
- Epic 1 terminé
- Accès au dossier contenant les fichiers audio (Lidarr)

---

## Issues

### 2.1 Installer music-metadata
**Priorité** : P0 (Critique)

**Description**
Installer la bibliothèque `music-metadata` qui permet de lire les tags ID3 des fichiers audio (MP3, FLAC, OGG, WAV, etc.).

**Commande**
```bash
npm install music-metadata
```

**Pourquoi music-metadata ?**
- Support de nombreux formats (MP3, FLAC, OGG, WAV, AAC, etc.)
- Extraction des pochettes d'album embedded
- Lecture asynchrone (non-bloquant)
- Bien maintenu et documenté
- Typage TypeScript inclus

**Usage basique**
```typescript
import { parseFile } from 'music-metadata'

const metadata = await parseFile('/path/to/song.mp3')
console.log(metadata.common.title)   // Titre
console.log(metadata.common.artist)  // Artiste
console.log(metadata.common.album)   // Album
console.log(metadata.common.year)    // Année
console.log(metadata.format.duration) // Durée en secondes
console.log(metadata.common.picture) // Pochettes (array)
```

**Critères d'acceptation**
- [ ] Package installé dans package.json
- [ ] Import fonctionne sans erreur
- [ ] Types disponibles

---

### 2.2 Créer le scanner de dossier audio
**Priorité** : P0 (Critique)

**Description**
Créer une fonction qui parcourt récursivement un dossier et liste tous les fichiers audio supportés.

**Fichier** : `src/lib/audioScanner.ts`

**Implémentation**
```typescript
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac']

export async function scanAudioFolder(folderPath: string): Promise<string[]> {
  const audioFiles: string[] = []

  async function scanDir(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Ignorer les dossiers cachés (commençant par .)
        if (!entry.name.startsWith('.')) {
          await scanDir(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          audioFiles.push(fullPath)
        }
      }
    }
  }

  await scanDir(folderPath)
  return audioFiles
}
```

**Considérations**
- Ignorer les dossiers cachés (`.`, `@eaDir` sur Synology)
- Gérer les erreurs de permission
- Limiter la profondeur si nécessaire (éviter les boucles symlink)

**Critères d'acceptation**
- [ ] Fonction retourne un array de chemins absolus
- [ ] Tous les formats supportés sont détectés
- [ ] Les dossiers cachés sont ignorés
- [ ] Gestion des erreurs (dossier inexistant, permissions)

---

### 2.3 Extraire les métadonnées ID3
**Priorité** : P0 (Critique)

**Description**
Pour chaque fichier audio, extraire les métadonnées : titre, artiste, album, année, durée.

**Implémentation**
```typescript
import { parseFile, IAudioMetadata } from 'music-metadata'
import { createHash } from 'crypto'
import { basename, extname } from 'path'
import type { Song, AudioFormat } from './types'

export async function extractMetadata(filePath: string): Promise<Song | null> {
  try {
    const metadata = await parseFile(filePath)

    // Générer un ID unique basé sur le chemin
    const id = createHash('md5').update(filePath).digest('hex').slice(0, 12)

    // Extraire le format
    const ext = extname(filePath).toLowerCase().slice(1) as AudioFormat

    // Fallback sur le nom de fichier si pas de métadonnées
    const fileName = basename(filePath, extname(filePath))
    const { artist: parsedArtist, title: parsedTitle } = parseFileName(fileName)

    return {
      id,
      title: metadata.common.title || parsedTitle || 'Titre inconnu',
      artist: metadata.common.artist || parsedArtist || 'Artiste inconnu',
      album: metadata.common.album,
      year: metadata.common.year,
      duration: metadata.format.duration || 0,
      filePath,
      format: ext,
      hasCover: !!(metadata.common.picture && metadata.common.picture.length > 0),
    }
  } catch (error) {
    console.error(`Erreur lecture métadonnées: ${filePath}`, error)
    return null
  }
}

// Parser le nom de fichier format "Artiste - Titre"
function parseFileName(fileName: string): { artist?: string; title?: string } {
  const parts = fileName.split(' - ')
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    }
  }
  return { title: fileName }
}
```

**Critères d'acceptation**
- [ ] Titre, artiste, album, année, durée extraits
- [ ] Fallback sur le nom de fichier si métadonnées absentes
- [ ] ID unique généré pour chaque chanson
- [ ] Gestion des fichiers corrompus (return null)

---

### 2.4 Extraire les pochettes d'album
**Priorité** : P0 (Critique)

**Description**
Extraire l'image de pochette embedded dans les fichiers audio, ou chercher un fichier `cover.jpg`/`folder.jpg` dans le même dossier.

**Implémentation**
```typescript
import { parseFile } from 'music-metadata'
import { readFile, access } from 'fs/promises'
import { dirname, join } from 'path'

const COVER_FILENAMES = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'album.png']

export async function extractCover(filePath: string): Promise<Buffer | null> {
  try {
    // 1. Essayer d'extraire la pochette embedded
    const metadata = await parseFile(filePath)
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]
      return Buffer.from(picture.data)
    }

    // 2. Chercher un fichier cover dans le dossier
    const dir = dirname(filePath)
    for (const coverName of COVER_FILENAMES) {
      const coverPath = join(dir, coverName)
      try {
        await access(coverPath)
        return await readFile(coverPath)
      } catch {
        // Fichier non trouvé, continuer
      }
    }

    return null
  } catch (error) {
    console.error(`Erreur extraction pochette: ${filePath}`, error)
    return null
  }
}

export function getCoverMimeType(filePath: string, embedded: boolean, metadata?: any): string {
  if (embedded && metadata?.common?.picture?.[0]?.format) {
    return metadata.common.picture[0].format
  }

  const ext = filePath.toLowerCase()
  if (ext.endsWith('.png')) return 'image/png'
  if (ext.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}
```

**Critères d'acceptation**
- [ ] Pochettes embedded extraites
- [ ] Fallback sur cover.jpg/folder.jpg dans le dossier
- [ ] Retourne Buffer ou null
- [ ] MIME type correct détecté

---

### 2.5 Générer des IDs uniques pour les chansons
**Priorité** : P1 (Important)

**Description**
Chaque chanson doit avoir un ID unique et stable (ne change pas si on rescanne). Utiliser un hash du chemin de fichier.

**Implémentation** (déjà dans 2.3)
```typescript
import { createHash } from 'crypto'

export function generateSongId(filePath: string): string {
  return createHash('md5').update(filePath).digest('hex').slice(0, 12)
}
```

**Pourquoi le chemin ?**
- Stable : même fichier = même ID
- Unique : deux fichiers différents = IDs différents
- Pas de collision pratique avec 12 caractères hex

**Alternative** : UUID v4 (mais non-déterministe)

**Critères d'acceptation**
- [ ] IDs de 12 caractères hexadécimaux
- [ ] Même fichier génère toujours le même ID
- [ ] Fichiers différents = IDs différents

---

### 2.6 Créer un cache des métadonnées
**Priorité** : P1 (Important)

**Description**
Éviter de re-scanner toute la bibliothèque à chaque requête. Mettre en cache les métadonnées en mémoire ou dans un fichier JSON.

**Implémentation**
```typescript
import type { Song } from './types'

// Cache en mémoire (singleton)
let songsCache: Song[] | null = null
let lastScanTime: number | null = null

export async function getSongsCache(): Promise<Song[]> {
  if (songsCache === null) {
    await refreshCache()
  }
  return songsCache!
}

export async function refreshCache(): Promise<void> {
  const audioPath = process.env.AUDIO_FOLDER_PATH
  if (!audioPath) {
    throw new Error('AUDIO_FOLDER_PATH non défini')
  }

  const files = await scanAudioFolder(audioPath)
  const songs: Song[] = []

  for (const filePath of files) {
    const song = await extractMetadata(filePath)
    if (song) {
      songs.push(song)
    }
  }

  songsCache = songs
  lastScanTime = Date.now()

  console.log(`Cache rafraîchi: ${songs.length} chansons`)
}

export function getCacheInfo(): { count: number; lastScan: number | null } {
  return {
    count: songsCache?.length || 0,
    lastScan: lastScanTime,
  }
}
```

**Considérations**
- Cache invalidé au redémarrage du serveur
- Endpoint pour forcer le refresh (issue 2.10)
- Pour les très grandes bibliothèques, envisager un fichier JSON

**Critères d'acceptation**
- [ ] Premier appel déclenche le scan
- [ ] Appels suivants utilisent le cache
- [ ] Fonction pour forcer le refresh
- [ ] Info sur l'état du cache disponible

---

### 2.7 Gérer les fichiers sans métadonnées
**Priorité** : P1 (Important)

**Description**
Certains fichiers n'ont pas de tags ID3. Utiliser le nom de fichier comme fallback.

**Format attendu** : `Artiste - Titre.mp3`

**Implémentation** (déjà dans 2.3)
```typescript
function parseFileName(fileName: string): { artist?: string; title?: string } {
  // Format: "Artiste - Titre"
  const parts = fileName.split(' - ')
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    }
  }

  // Format: "Titre" seulement
  return { title: fileName }
}
```

**Autres formats possibles à gérer**
- `01 - Titre.mp3` (numéro de piste)
- `Artiste_Titre.mp3` (underscore)
- `titre.mp3` (juste le titre)

**Critères d'acceptation**
- [ ] Format "Artiste - Titre" parsé correctement
- [ ] Titre seul utilisé si pas de séparateur
- [ ] Valeurs par défaut si parsing échoue

---

### 2.8 Valider les formats audio supportés
**Priorité** : P1 (Important)

**Description**
Tous les formats ne sont pas supportés par tous les navigateurs. Filtrer ou avertir pour les formats problématiques.

**Compatibilité navigateurs**
| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| MP3    | ✅     | ✅      | ✅     | ✅   |
| WAV    | ✅     | ✅      | ✅     | ✅   |
| OGG    | ✅     | ✅      | ❌     | ✅   |
| FLAC   | ✅     | ✅      | ✅*    | ✅   |
| AAC    | ✅     | ✅      | ✅     | ✅   |
| M4A    | ✅     | ✅      | ✅     | ✅   |

*Safari supporte FLAC depuis macOS 11

**Implémentation**
```typescript
export function isFormatSupported(format: string): boolean {
  const universalFormats = ['mp3', 'wav', 'aac', 'm4a']
  return universalFormats.includes(format.toLowerCase())
}

export function getFormatWarning(format: string): string | null {
  if (format === 'ogg') {
    return 'OGG non supporté sur Safari'
  }
  if (format === 'flac') {
    return 'FLAC peut avoir des problèmes sur anciens navigateurs'
  }
  return null
}
```

**Critères d'acceptation**
- [ ] Fonction de validation du format
- [ ] Avertissements pour formats problématiques
- [ ] Documentation des limitations

---

### 2.9 Gérer les erreurs de lecture
**Priorité** : P1 (Important)

**Description**
Certains fichiers peuvent être corrompus ou inaccessibles. Gérer ces cas gracieusement.

**Types d'erreurs**
1. Fichier introuvable (supprimé/déplacé)
2. Permission refusée
3. Fichier corrompu (headers invalides)
4. Timeout de lecture (fichier distant lent)

**Implémentation**
```typescript
export async function safeExtractMetadata(filePath: string): Promise<Song | null> {
  try {
    return await extractMetadata(filePath)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.warn(`Fichier non trouvé: ${filePath}`)
      } else if (error.message.includes('EACCES')) {
        console.warn(`Permission refusée: ${filePath}`)
      } else {
        console.error(`Erreur inconnue pour ${filePath}:`, error.message)
      }
    }
    return null
  }
}

// Lors du scan, filtrer les nulls
const songs = (await Promise.all(files.map(safeExtractMetadata)))
  .filter((song): song is Song => song !== null)
```

**Critères d'acceptation**
- [ ] Fichiers problématiques ignorés (pas de crash)
- [ ] Logs clairs pour debug
- [ ] Scan continue après une erreur

---

### 2.10 Ajouter un endpoint de rafraîchissement du cache
**Priorité** : P2 (Nice-to-have)

**Description**
Permettre de re-scanner la bibliothèque sans redémarrer le serveur.

**Endpoint** : `POST /api/songs/rescan`

**Implémentation** (voir Epic 3)

**Cas d'usage**
- Ajout de nouvelles chansons
- Modification des tags
- Debug

**Critères d'acceptation**
- [ ] Endpoint déclenche un nouveau scan
- [ ] Retourne le nombre de chansons trouvées
- [ ] Ancien cache remplacé

---

## Checklist de l'Epic

- [ ] 2.1 music-metadata installé
- [ ] 2.2 Scanner de dossier créé
- [ ] 2.3 Extraction métadonnées fonctionnelle
- [ ] 2.4 Extraction pochettes fonctionnelle
- [ ] 2.5 IDs uniques générés
- [ ] 2.6 Cache en mémoire implémenté
- [ ] 2.7 Fallback nom de fichier
- [ ] 2.8 Validation formats
- [ ] 2.9 Gestion erreurs
- [ ] 2.10 Endpoint rescan

## Estimation
~3-4 heures de travail
