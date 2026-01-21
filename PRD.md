# Blindtest PRD - Ralph Task List

Read detailed specifications for each issue in the referenced epic file.

---

## Bootstrap Phase (No feedback loops available yet)

These issues must run before feedback loops (Husky, Vitest) can be set up.

### Epic 1: Setup (docs/epics/01-setup.md)

- [x] 1.1 Initialiser le projet Next.js
- [x] 1.2 Configurer Tailwind CSS
- [x] 1.3 Définir la palette de couleurs festive
- [x] 1.4 Configurer les fonts
- [x] 1.5 Créer la structure des dossiers
- [x] 1.6 Configurer les variables d'environnement
- [x] 1.7 Configurer ESLint et Prettier

### Feedback Loop Setup

- [x] BOOTSTRAP.FEEDBACK: Install Vitest, Husky, lint-staged and configure pre-commit hooks

After this task, all subsequent issues run with full feedback loops.

---

## Main Phase (With feedback loops: typecheck, test, lint)

### Epic 1: Setup - Continued (docs/epics/01-setup.md)

- [x] 1.8 Créer le fichier de types global

### Epic 2: Backend Audio (docs/epics/02-backend-audio.md)

- [x] 2.1 Installer music-metadata
- [x] 2.2 Créer le scanner de dossier audio
- [x] 2.3 Extraire les métadonnées ID3
- [x] 2.4 Extraire les pochettes d'album
- [x] 2.5 Générer des IDs uniques pour les chansons
- [x] 2.6 Créer un cache des métadonnées
- [x] 2.7 Gérer les fichiers sans métadonnées
- [x] 2.8 Valider les formats audio supportés
- [x] 2.9 Gérer les erreurs de lecture
- [x] 2.10 Ajouter un endpoint de rafraîchissement du cache

### Epic 3: API Routes (docs/epics/03-api-routes.md)

- [x] 3.1 Créer GET /api/songs
- [x] 3.2 Créer GET /api/songs/random
- [x] 3.3 Créer GET /api/songs/[id]
- [x] 3.4 Créer GET /api/audio/[id]
- [x] 3.5 Créer GET /api/cover/[id]
- [x] 3.6 Gérer les Range Requests pour l'audio
- [x] 3.7 Ajouter les headers CORS appropriés
- [x] 3.8 Créer GET /api/stats
- [x] 3.9 Optimiser le streaming audio
- [x] 3.10 Créer POST /api/songs/rescan

### Epic 4: Homepage (docs/epics/04-homepage.md)

- [x] 4.1 Créer le layout principal
- [x] 4.2 Designer la page d'accueil
- [x] 4.3 Créer le formulaire de configuration
- [x] 4.4 Ajouter le sélecteur de mode de devinette
- [x] 4.5 Ajouter le slider durée des extraits
- [x] 4.6 Afficher le nombre de chansons disponibles
- [x] 4.7 Ajouter la validation du formulaire
- [x] 4.8 Persister la configuration
- [x] 4.9 Ajouter un bouton "Paramètres avancés"
- [x] 4.10 Créer une animation d'entrée

### Epic 5: Game Screen (docs/epics/05-game-screen.md)

- [x] 5.1 Créer la page /game
- [x] 5.2 Implémenter le layout de jeu
- [x] 5.3 Créer le composant AudioPlayer
- [x] 5.4 Ajouter les contrôles play/pause
- [x] 5.5 Afficher la barre de progression audio
- [x] 5.6 Limiter la lecture à la durée configurée
- [x] 5.7 Créer le composant BuzzerButton
- [x] 5.8 Ajouter l'animation du buzzer
- [x] 5.9 Créer le composant Timer
- [x] 5.10 Ajouter l'animation du timer
- [x] 5.11 Créer le composant ScoreDisplay
- [x] 5.12 Créer le composant SongReveal
- [x] 5.13 Implémenter le blur de la pochette
- [x] 5.14 Créer les boutons de validation
- [x] 5.15 Créer le bouton "Chanson suivante"
- [x] 5.16 Créer le bouton "Révéler la réponse"
- [x] 5.17 Ajouter un bouton "Quitter la partie"
- [x] 5.18 Afficher le numéro de la chanson
- [x] 5.19 Créer le récap de fin de partie

### Epic 6: Game Logic (docs/epics/06-game-logic.md)

- [x] 6.1 Créer le hook useGameState
- [x] 6.2 Définir les états du jeu
- [x] 6.3 Implémenter la transition IDLE → LOADING
- [x] 6.4 Implémenter la transition LOADING → PLAYING
- [x] 6.5 Implémenter la transition PLAYING → BUZZED
- [x] 6.6 Implémenter la transition BUZZED → TIMER
- [x] 6.7 Implémenter la fin du timer
- [x] 6.8 Implémenter la validation de réponse
- [x] 6.9 Implémenter la transition vers REVEAL
- [x] 6.10 Implémenter la transition REVEAL → LOADING
- [x] 6.11 Gérer la liste des chansons déjà jouées
- [x] 6.12 Détecter la fin de la bibliothèque
- [x] 6.13 Créer le hook useAudioPlayer
- [x] 6.14 Gérer le preloading de la chanson suivante
- [x] 6.15 Ajouter un mode "rejouer la même chanson"

### Epic 7: UI/UX (docs/epics/07-ui-ux.md)

- [x] 7.1 Créer le fond d'écran festif
- [x] 7.2 Styliser les boutons principaux
- [x] 7.3 Ajouter des ombres et profondeur
- [x] 7.4 Créer les animations de transition
- [x] 7.5 Ajouter l'animation de bonne réponse
- [x] 7.6 Ajouter l'animation de mauvaise réponse
- [x] 7.7 Styliser le timer avec urgence
- [x] 7.8 Ajouter des icônes
- [x] 7.9 Créer un thème sombre
- [x] 7.10 Ajouter des particules de fond

### Epic 8: Sound Effects (docs/epics/08-sound-effects.md)

- [x] 8.1 Ajouter un son de buzzer
- [x] 8.2 Ajouter un son de bonne réponse
- [x] 8.3 Ajouter un son de mauvaise réponse
- [x] 8.4 Ajouter un son de fin de timer
- [x] 8.5 Ajouter un tick-tock pour le timer
- [x] 8.6 Créer un hook useSoundEffects
- [x] 8.7 Ajouter une option mute effets sonores
- [x] 8.8 Gérer le volume principal

### Epic 9: Responsive (docs/epics/09-responsive.md)

- [x] 9.1 Adapter le layout pour mobile
- [x] 9.2 Agrandir les zones tactiles
- [x] 9.3 Tester sur différentes tailles d'écran
- [x] 9.4 Ajouter la vibration mobile au buzz
- [x] 9.5 Optimiser les performances mobile
- [x] 9.6 Gérer l'orientation landscape/portrait
- [x] 9.7 Ajouter un mode plein écran
- [x] 9.8 Tester la lecture audio sur iOS Safari

### Epic 10: Error Handling (docs/epics/10-error-handling.md)

- [x] 10.1 Gérer l'erreur "dossier audio vide"
- [x] 10.2 Gérer l'erreur "fichier audio introuvable"
- [x] 10.3 Gérer l'erreur réseau
- [x] 10.4 Gérer le navigateur sans support audio
- [x] 10.5 Ajouter un état de chargement global
- [x] 10.6 Gérer la perte de focus de la page
- [x] 10.7 Ajouter des messages d'erreur user-friendly
- [x] 10.8 Logger les erreurs côté serveur

### Epic 11: Configuration (docs/epics/11-configuration.md)

- [x] 11.1 Permettre de configurer le chemin audio
- [x] 11.2 Permettre de changer le timer (pas que 5s)
- [x] 11.3 Ajouter un mode "sans timer"
- [x] 11.4 Permettre de définir un point de départ dans la chanson
- [x] 11.5 Ajouter des filtres sur la bibliothèque
- [x] 11.6 Créer des playlists personnalisées

### Epic 12: Testing (docs/epics/12-testing.md)

- [x] 12.1 Tester le scan de fichiers audio
- [x] 12.2 Tester les API routes
- [x] 12.3 Tester la machine d'état du jeu
- [x] 12.6 Ajouter des tests unitaires
- [x] 12.7 Ajouter des tests E2E

### Epic 13: Multiplayer (docs/epics/13-multiplayer.md)

- [x] 13.1 Installer et configurer Supabase
- [x] 13.2 Créer le schéma de base de données
- [x] 13.3 Créer les types TypeScript pour le multiplayer
- [x] 13.4 Créer la page de sélection de mode (/play)
- [x] 13.5 Créer le formulaire de création de room
- [x] 13.6 Créer le formulaire pour rejoindre une room
- [x] 13.7 Implémenter le hook useRoom
- [x] 13.8 Créer le composant Lobby
- [x] 13.9 Implémenter la présence des joueurs
- [x] 13.10 Créer le hook useMultiplayerGame
- [x] 13.11 Implémenter la synchronisation audio
- [ ] 13.12 Implémenter la résolution du buzz
- [ ] 13.13 Créer les contrôles host
- [ ] 13.14 Afficher les scores de tous les joueurs
- [ ] 13.15 Gérer la migration de host
- [ ] 13.16 Gérer la reconnexion des joueurs
- [ ] 13.17 Créer le récap multijoueur
- [ ] 13.18 Nettoyer les rooms expirées

---

### Epic 14: Deployment (docs/epics/14-deployment.md)

- [ ] 14.1 Créer le script de build
- [ ] 14.2 Configurer le démarrage en production
- [ ] 14.3 Documenter l'installation sur NAS
- [ ] 14.4 Configurer le reverse proxy si nécessaire
- [ ] 14.5 Ajouter un healthcheck endpoint
- [ ] 14.6 Créer un Dockerfile

## Completion

When all tasks are checked, output: `<promise>COMPLETE</promise>`
