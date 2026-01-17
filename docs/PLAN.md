# Blindtest - Plan de Projet

## Vue d'ensemble

Application web de blindtest musical permettant de jouer en solo ou en multijoueur local. Les fichiers audio sont hébergés localement sur un NAS avec Lidarr pour la gestion de la bibliothèque musicale.

## Caractéristiques principales

- **Mode de jeu** : Solo (MVP) puis Multijoueur avec buzzers sur téléphone (Phase 2)
- **Interface** : Colorée et festive, responsive (mobile-first)
- **Audio** : Fichiers locaux (MP3, WAV, OGG, FLAC) avec métadonnées ID3
- **Stack** : Next.js, TypeScript, Tailwind CSS
- **Hébergement** : Serveur maison (NAS)

## Gameplay

| Aspect | Description |
|--------|-------------|
| Principe | Écouter un extrait, buzzer, répondre oralement, validation manuelle par le MJ |
| À deviner | Configurable : titre seul, artiste seul, ou les deux |
| Scoring | 1 point par bonne réponse |
| Durée extraits | Configurable (5-60 secondes) |
| Timer post-buzz | 5 secondes pour répondre |
| Mauvaise réponse | Les autres peuvent rebuzzer (mode multi) |
| Révélation | Titre + Artiste + Pochette d'album |
| Structure | Mode libre (pas de limite de questions) |
| Sélection | Aléatoire dans la bibliothèque |

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js App (NAS)             │
├─────────────────────────────────────────┤
│  Frontend (React)                       │
│  - Page d'accueil / Configuration       │
│  - Écran de jeu                         │
│  - Composants UI festifs                │
├─────────────────────────────────────────┤
│  API Routes                             │
│  - /api/songs : liste des chansons      │
│  - /api/songs/random : chanson aléatoire│
│  - /api/audio/[id] : stream audio       │
│  - /api/cover/[id] : pochette album     │
├─────────────────────────────────────────┤
│  Dossier audio (monté depuis Lidarr)    │
│  - Scan des fichiers au démarrage       │
│  - Extraction métadonnées ID3           │
└─────────────────────────────────────────┘
```

## Phases de développement

### Phase 1 : MVP Solo
- Configuration de partie (mode devinette, durée extraits)
- Lecture audio avec contrôles
- Système de buzzer et timer
- Validation manuelle des réponses
- Affichage scores et révélation

### Phase 2 : Multijoueur (Futur)
- Chaque joueur sur son téléphone via réseau local
- QR code pour rejoindre la partie
- Système de rebuzz après mauvaise réponse
- Gestion des joueurs illimités

## Documents associés

- [Epic 1 : Setup du projet](./epics/01-setup.md)
- [Epic 2 : Backend Audio](./epics/02-backend-audio.md)
- [Epic 3 : API Routes](./epics/03-api-routes.md)
- [Epic 4 : Page d'accueil](./epics/04-homepage.md)
- [Epic 5 : Écran de jeu](./epics/05-game-screen.md)
- [Epic 6 : Logique de jeu](./epics/06-game-logic.md)
- [Epic 7 : UI/UX Festif](./epics/07-ui-ux.md)
- [Epic 8 : Effets sonores](./epics/08-sound-effects.md)
- [Epic 9 : Responsive](./epics/09-responsive.md)
- [Epic 10 : Gestion erreurs](./epics/10-error-handling.md)
- [Epic 11 : Configuration](./epics/11-configuration.md)
- [Epic 12 : Tests](./epics/12-testing.md)
- [Epic 13 : Déploiement](./epics/13-deployment.md)

## Sprints suggérés

| Sprint | Focus | Issues clés |
|--------|-------|-------------|
| 1 | Fondations | Setup projet, scanner audio, API de base |
| 2 | Interface | Pages accueil et jeu, composants principaux |
| 3 | Logique | State machine, transitions, hooks |
| 4 | Polish | Animations, responsive, gestion erreurs |
| 5 | Finalisation | Effets sonores, build, déploiement |
