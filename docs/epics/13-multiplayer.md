# Epic 13: Multiplayer

Ajouter le mode multijoueur au blindtest avec Supabase Realtime.

## Prérequis

- Créer un projet Supabase sur supabase.com
- Récupérer les credentials (URL + anon key)

---

## 13.1 Installer et configurer Supabase

**Description**: Installer le client Supabase et configurer les variables d'environnement.

**Acceptance Criteria**:

- [ ] `@supabase/supabase-js` installé
- [ ] `.env.local` contient `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `.env.example` documenté avec les nouvelles variables
- [ ] `src/lib/supabase.ts` créé avec le client singleton
- [ ] Import vérifié avec un test de connexion

**Files**:

- `package.json`
- `.env.local`
- `.env.example`
- `src/lib/supabase.ts`

---

## 13.2 Créer le schéma de base de données

**Description**: Créer les tables rooms, players, et buzzes dans Supabase.

**Acceptance Criteria**:

- [ ] Table `rooms` créée (id, code, host_id, status, settings, current_song_id, current_song_started_at)
- [ ] Table `players` créée (id, room_id, nickname, score, is_host, joined_at)
- [ ] Table `buzzes` créée (id, room_id, player_id, song_id, buzzed_at, is_winner)
- [ ] RLS activé sur toutes les tables
- [ ] Policies permissives pour MVP (lecture/écriture pour tous)
- [ ] Realtime activé pour les 3 tables
- [ ] Index créés (rooms.code, players.room_id, buzzes.room_id+song_id)

**SQL Migration**:

```sql
-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  settings JSONB DEFAULT '{}',
  current_song_id VARCHAR(12),
  current_song_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(20) NOT NULL,
  score INTEGER DEFAULT 0,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buzzes table
CREATE TABLE buzzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  song_id VARCHAR(12) NOT NULL,
  buzzed_at TIMESTAMPTZ DEFAULT NOW(),
  is_winner BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzes ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for MVP)
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can read players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON players FOR UPDATE USING (true);
CREATE POLICY "Anyone can read buzzes" ON buzzes FOR SELECT USING (true);
CREATE POLICY "Anyone can buzz" ON buzzes FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE buzzes;

-- Indexes
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_buzzes_room_song ON buzzes(room_id, song_id);
```

---

## 13.3 Créer les types TypeScript pour le multiplayer

**Description**: Ajouter les interfaces Room, Player, RoomState à types.ts.

**Acceptance Criteria**:

- [ ] Interface `Room` définie (id, code, hostId, status, settings, currentSongId, currentSongStartedAt)
- [ ] Interface `Player` définie (id, roomId, nickname, score, isHost, isOnline)
- [ ] Interface `RoomState` définie (room, players, myPlayerId)
- [ ] Type `RoomStatus` = 'waiting' | 'playing' | 'ended'
- [ ] `src/lib/database.types.ts` généré avec `supabase gen types typescript`

**Files**:

- `src/lib/types.ts`
- `src/lib/database.types.ts`

---

## 13.4 Créer la page de sélection de mode (/play)

**Description**: Page permettant de choisir entre mode solo et multijoueur.

**Acceptance Criteria**:

- [ ] Route `/play` créée
- [ ] Deux cartes: "Jouer seul" et "Multijoueur"
- [ ] "Jouer seul" redirige vers `/game` (comportement actuel)
- [ ] "Multijoueur" redirige vers `/multiplayer`
- [ ] Animations d'entrée cohérentes avec le reste de l'app
- [ ] Homepage `/` redirige vers `/play`

**Files**:

- `src/app/play/page.tsx`
- `src/app/page.tsx` (modifier pour rediriger)

---

## 13.5 Créer le formulaire de création de room

**Description**: Formulaire pour créer une nouvelle room avec un pseudo.

**Acceptance Criteria**:

- [ ] Input nickname (max 20 caractères)
- [ ] Bouton "Créer une partie"
- [ ] Génère un code de 6 caractères (majuscules + chiffres)
- [ ] Crée la room dans Supabase
- [ ] Crée le player avec is_host=true
- [ ] Stocke playerId dans localStorage
- [ ] Redirige vers `/multiplayer/[code]`

**Files**:

- `src/components/multiplayer/CreateRoomForm.tsx`
- `src/app/multiplayer/page.tsx`

---

## 13.6 Créer le formulaire pour rejoindre une room

**Description**: Formulaire pour rejoindre une room existante avec un code.

**Acceptance Criteria**:

- [ ] Input code (6 caractères, auto-uppercase)
- [ ] Input nickname (max 20 caractères)
- [ ] Bouton "Rejoindre"
- [ ] Vérifie que la room existe et status='waiting'
- [ ] Vérifie que la room n'est pas pleine (max 10 joueurs)
- [ ] Crée le player avec is_host=false
- [ ] Stocke playerId dans localStorage
- [ ] Redirige vers `/multiplayer/[code]`
- [ ] Messages d'erreur: room introuvable, room pleine, partie déjà commencée

**Files**:

- `src/components/multiplayer/JoinRoomForm.tsx`
- `src/app/multiplayer/page.tsx`

---

## 13.7 Implémenter le hook useRoom

**Description**: Hook pour gérer les opérations CRUD sur les rooms.

**Acceptance Criteria**:

- [ ] `createRoom(nickname)` → crée room + player, retourne code
- [ ] `joinRoom(code, nickname)` → vérifie room, crée player
- [ ] `leaveRoom()` → supprime player, unsubscribe
- [ ] `updateSettings(settings)` → host only
- [ ] `startGame()` → change status à 'playing', host only
- [ ] `kickPlayer(playerId)` → supprime player, host only
- [ ] Souscription aux changements de la room
- [ ] Retourne: room, players, myPlayer, isHost, actions

**Files**:

- `src/hooks/useRoom.ts`
- `src/hooks/useRoom.test.ts`

---

## 13.8 Créer le composant Lobby

**Description**: Écran d'attente avant le début de la partie.

**Acceptance Criteria**:

- [ ] Affiche le code de la room (gros, copiable)
- [ ] Liste des joueurs avec indicateur online/offline
- [ ] Badge "Host" pour l'hôte
- [ ] Bouton "Démarrer" (host only, visible si >= 2 joueurs)
- [ ] Bouton "Quitter" pour tous
- [ ] Configuration de la partie (host only): mode de devinette, durée
- [ ] Animation quand un joueur rejoint/quitte

**Files**:

- `src/components/multiplayer/Lobby.tsx`
- `src/components/multiplayer/PlayerCard.tsx`
- `src/app/multiplayer/[code]/page.tsx`

---

## 13.9 Implémenter la présence des joueurs

**Description**: Tracker qui est en ligne via Supabase Presence.

**Acceptance Criteria**:

- [ ] Hook `usePresence(roomId, playerId)`
- [ ] Souscrit au channel `room:{roomId}`
- [ ] Track le player avec `presenceChannel.track()`
- [ ] Met à jour `isOnline` des players via presence events
- [ ] Grace period de 5s avant de marquer offline (tombstone pattern)
- [ ] Cleanup à l'unmount

**Files**:

- `src/hooks/usePresence.ts`
- `src/hooks/usePresence.test.ts`

---

## 13.10 Créer le hook useMultiplayerGame

**Description**: Hook principal pour la logique de jeu multijoueur.

**Acceptance Criteria**:

- [ ] Souscrit aux changements de room (status, currentSongId, etc.)
- [ ] Souscrit aux changements de players (scores)
- [ ] Souscrit aux inserts de buzzes
- [ ] Actions: buzz(), validate(correct), nextSong(), reveal(), endGame()
- [ ] Seul le host peut validate/nextSong/reveal/endGame
- [ ] Retourne: gameState, players, currentBuzzer, actions

**Files**:

- `src/hooks/useMultiplayerGame.ts`
- `src/hooks/useMultiplayerGame.test.ts`

---

## 13.11 Implémenter la synchronisation audio

**Description**: Tous les joueurs entendent le même extrait au même moment.

**Acceptance Criteria**:

- [ ] Host appelle `startSong(songId)` avec timestamp futur (+1s)
- [ ] Room updated avec currentSongId et currentSongStartedAt
- [ ] Clients calculent l'offset: `now - startedAt`
- [ ] Si offset < 0: attendre puis play()
- [ ] Si offset > 0 et < duration: seek + play()
- [ ] Tolérance de sync: ~200ms acceptable
- [ ] Composant `SyncedAudioPlayer` ou props supplémentaires sur AudioPlayer

**Files**:

- `src/components/multiplayer/SyncedAudioPlayer.tsx`
- ou modifications de `src/components/game/AudioPlayer.tsx`

---

## 13.12 Implémenter la résolution du buzz

**Description**: Le premier joueur à buzzer obtient le droit de répondre.

**Acceptance Criteria**:

- [ ] Buzz insère dans table `buzzes` avec timestamp serveur
- [ ] Vérifie si quelqu'un a déjà gagné ce round (is_winner=true)
- [ ] Premier buzz (par buzzed_at) devient winner
- [ ] UI montre qui a buzzé et qui répond
- [ ] Audio pause pour tous quand quelqu'un buzze
- [ ] Timer démarre pour le buzzer winner

**Files**:

- `src/hooks/useMultiplayerGame.ts`
- `src/components/multiplayer/BuzzIndicator.tsx`

---

## 13.13 Créer les contrôles host

**Description**: Interface host pour valider les réponses et gérer le jeu.

**Acceptance Criteria**:

- [ ] Boutons Correct/Incorrect (visibles seulement pour host)
- [ ] Bouton "Chanson suivante" (host only)
- [ ] Bouton "Révéler la réponse" (host only)
- [ ] Bouton "Terminer la partie" (host only)
- [ ] Les actions mettent à jour la room/players dans Supabase
- [ ] Les autres joueurs voient les changements en temps réel

**Files**:

- `src/components/multiplayer/HostControls.tsx`
- `src/app/multiplayer/[code]/page.tsx`

---

## 13.14 Afficher les scores de tous les joueurs

**Description**: Classement en temps réel de tous les joueurs.

**Acceptance Criteria**:

- [ ] Liste des joueurs triée par score (décroissant)
- [ ] Affiche position, nickname, score
- [ ] Highlight du joueur local (moi)
- [ ] Animation quand un score change
- [ ] Médailles pour top 3 (or, argent, bronze)
- [ ] Visible pendant le jeu (sidebar ou overlay)

**Files**:

- `src/components/multiplayer/Leaderboard.tsx`
- `src/app/multiplayer/[code]/page.tsx`

---

## 13.15 Gérer la migration de host

**Description**: Si le host quitte, un autre joueur devient host.

**Acceptance Criteria**:

- [ ] Détecte quand host est offline > 10s
- [ ] Sélectionne nouveau host (joined_at le plus ancien)
- [ ] Met à jour host_id dans room
- [ ] Met à jour is_host dans players
- [ ] Notification "X est maintenant l'hôte"
- [ ] Nouveau host reçoit les contrôles

**Files**:

- `src/hooks/useRoom.ts`
- Logic peut être dans usePresence ou effet séparé

---

## 13.16 Gérer la reconnexion des joueurs

**Description**: Un joueur déconnecté peut revenir dans la partie.

**Acceptance Criteria**:

- [ ] playerId stocké dans localStorage
- [ ] Au chargement de `/multiplayer/[code]`, vérifie si player existe
- [ ] Si oui et room active: rejoint la session
- [ ] Synchronise l'état du jeu (chanson en cours, scores)
- [ ] Grace period de 5s avant suppression du player
- [ ] Message "Reconnecté" affiché

**Files**:

- `src/app/multiplayer/[code]/page.tsx`
- `src/hooks/useRoom.ts`

---

## 13.17 Créer le récap multijoueur

**Description**: Écran de fin de partie avec classement final.

**Acceptance Criteria**:

- [ ] Affiché quand room.status = 'ended'
- [ ] Podium animé (1er, 2ème, 3ème)
- [ ] Confetti pour le gagnant
- [ ] Liste complète des scores
- [ ] Statistiques: nombre de chansons, durée totale
- [ ] Bouton "Nouvelle partie" (host only, remet scores à 0)
- [ ] Bouton "Quitter"

**Files**:

- `src/components/multiplayer/MultiplayerRecap.tsx`
- `src/app/multiplayer/[code]/page.tsx`

---

## 13.18 Nettoyer les rooms expirées

**Description**: Supprimer automatiquement les rooms inactives.

**Acceptance Criteria**:

- [ ] Edge Function ou cron job Supabase
- [ ] Supprime rooms sans players depuis 1h
- [ ] Supprime rooms avec status='ended' depuis 24h
- [ ] Log des rooms supprimées
- [ ] Ou alternative: cleanup au niveau de l'app (moins fiable)

**Files**:

- `supabase/functions/cleanup-rooms/index.ts` (si Edge Function)
- Ou documentation manuelle pour setup cron
