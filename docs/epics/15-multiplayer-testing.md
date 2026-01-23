# Epic 15 : Tests Multiplayer

## Objectif

Assurer la qualité et la fiabilité du mode multiplayer par des tests automatisés E2E avec Playwright et des tests visuels interactifs avec les outils MCP browser.

## Dépendances

- Epic 13 (Multiplayer) complété
- Playwright configuré
- Supabase Cloud configuré
- MCP claude-in-chrome tools disponibles

---

## Workflow de Test pour Ralph

Ralph doit utiliser **deux approches complémentaires** pour tester et corriger:

### 1. Tests Playwright automatisés

```bash
# Lance le serveur dev + tests automatiques
npx playwright test e2e/multiplayer-flow.spec.ts

# Avec interface visuelle pour debug
npx playwright test --ui
```

- Détecte les régressions automatiquement
- Teste plusieurs scénarios en parallèle
- Génère des rapports HTML

### 2. Browser automation MCP (interactif)

```
Outils disponibles:
- mcp__claude-in-chrome__navigate: Naviguer vers une URL
- mcp__claude-in-chrome__read_page: Lire le DOM/accessibilité
- mcp__claude-in-chrome__computer: Cliquer, taper, screenshot
- mcp__claude-in-chrome__find: Trouver des éléments
- mcp__claude-in-chrome__form_input: Remplir des formulaires
```

- Tests visuels interactifs
- Debug pas à pas
- Vérification UI en temps réel

### Workflow recommandé

1. **Lancer le serveur dev** (si pas déjà fait par Playwright):

   ```bash
   npm run dev
   ```

2. **Exécuter les tests Playwright** pour identifier les échecs:

   ```bash
   npx playwright test e2e/multiplayer-flow.spec.ts
   ```

3. **Si échec, utiliser MCP browser** pour debug visuel:
   - Naviguer vers http://localhost:3000
   - Reproduire le scénario manuellement
   - Identifier le problème visuellement
   - Prendre des screenshots

4. **Corriger le code** et relancer les tests

5. **Valider en production** une fois que tout passe en local

---

## Issues

### 15.1 Add E2E tests for multiplayer lobby flow

**Priorité** : P1 (Important)

**Description**
Tests E2E pour le flux de création et jonction de room, affichage du lobby.

**Fichier** : `e2e/multiplayer-flow.spec.ts`

**Tests**

```typescript
test.describe('Multiplayer Lobby', () => {
  test('host can create a room and see room code')
  test('player can join room with valid code')
  test('player sees error with invalid code')
  test('lobby shows all connected players')
  test('host badge visible only on host')
  test('player can leave room')
})
```

**Critères d'acceptation**

- [ ] Test création de room par l'host
- [ ] Test jonction par code valide
- [ ] Test erreur code invalide
- [ ] Test affichage des joueurs dans le lobby
- [ ] Test badge host
- [ ] Test départ d'un joueur

---

### 15.2 Add E2E tests for multiplayer game flow

**Priorité** : P1 (Important)

**Description**
Tests E2E pour le flux de jeu complet en multijoueur.

**Tests**

```typescript
test.describe('Multiplayer Game', () => {
  test('host can start game when 2+ players')
  test('host can load first song')
  test('all players see game started')
  test('players can buzz')
  test('host can validate correct answer')
  test('host can validate incorrect answer')
  test('scores update for all players')
  test('host can reveal answer')
  test('host can load next song')
  test('host can end game')
  test('all players see game recap')
})
```

**Critères d'acceptation**

- [ ] Test démarrage partie
- [ ] Test chargement chanson
- [ ] Test synchronisation état jeu
- [ ] Test buzz
- [ ] Test validation réponses
- [ ] Test mise à jour scores
- [ ] Test révélation réponse
- [ ] Test chanson suivante
- [ ] Test fin de partie
- [ ] Test récap final

---

### 15.3 Add E2E tests for audio synchronization

**Priorité** : P2 (Nice-to-have)

**Description**
Tests pour vérifier la synchronisation audio entre les clients.

**Tests**

```typescript
test.describe('Audio Sync', () => {
  test('audio starts at approximately same time for all players')
  test('audio pauses when someone buzzes')
  test('audio resumes after validation')
  test('progress bar updates in sync')
})
```

**Note**: La synchronisation audio parfaite est difficile à tester. Une tolérance de ±500ms est acceptable.

**Critères d'acceptation**

- [ ] Test démarrage audio synchronisé
- [ ] Test pause audio sur buzz
- [ ] Test reprise audio après validation
- [ ] Test barre de progression

---

### 15.4 Add E2E tests for player reconnection

**Priorité** : P2 (Nice-to-have)

**Description**
Tests pour la reconnexion des joueurs après déconnexion.

**Tests**

```typescript
test.describe('Player Reconnection', () => {
  test('player can reconnect after page refresh')
  test('player sees current game state after reconnect')
  test('player score preserved after reconnect')
  test('host migration works when host disconnects')
})
```

**Critères d'acceptation**

- [ ] Test reconnexion après refresh
- [ ] Test restauration état
- [ ] Test préservation score
- [ ] Test migration host

---

### 15.5 Test with MCP browser tools on localhost

**Priorité** : P1 (Important)

**Description**
Tests visuels interactifs avec les outils MCP claude-in-chrome sur http://localhost:3000.
Permet de debugger et corriger en temps réel.

**Workflow**

1. S'assurer que le serveur dev tourne: `npm run dev`
2. Utiliser les outils MCP pour naviguer vers http://localhost:3000
3. Tester visuellement chaque fonctionnalité
4. Prendre des screenshots pour documenter les bugs
5. Corriger le code et vérifier immédiatement

**Outils MCP à utiliser**

```
mcp__claude-in-chrome__tabs_context_mcp  - Obtenir les tabs disponibles
mcp__claude-in-chrome__navigate          - Naviguer vers localhost:3000
mcp__claude-in-chrome__read_page         - Lire le DOM/éléments
mcp__claude-in-chrome__find              - Trouver des éléments par texte
mcp__claude-in-chrome__computer          - Cliquer, screenshot, interagir
mcp__claude-in-chrome__form_input        - Remplir les formulaires
```

**Scénarios à tester**

1. Homepage: Vérifier affichage, boutons Solo/Multijoueur
2. Création room: Remplir pseudo, créer, vérifier code affiché
3. Jonction room: Remplir code + pseudo, rejoindre
4. Lobby: Vérifier liste joueurs, badges, bouton démarrer
5. Game: Audio, buzz, validation, scores
6. End game: Récap, retour accueil

**Critères d'acceptation**

- [ ] Navigation vers localhost fonctionne
- [ ] Création de room testée visuellement
- [ ] Jonction de room testée visuellement
- [ ] Lobby affiché correctement
- [ ] Game flow testé visuellement
- [ ] Bugs identifiés et corrigés

---

### 15.6 Validate fixes on production

**Priorité** : P1 (Important)

**Description**
Validation finale sur l'environnement de production **après** que tous les tests passent en local.
Cette étape est la dernière - d'abord tout corriger en local, puis valider en prod.

**URL** : https://blindtest.ainur.pro

**Prérequis**

- Tous les tests Playwright passent en local
- Tests MCP visuels validés en local
- Code committé et déployé sur le NUC

**Configuration Playwright**

```typescript
// playwright.config.ts
{
  name: 'production',
  use: {
    baseURL: 'https://blindtest.ainur.pro',
    ...devices['Desktop Chrome']
  },
}
```

**Checklist manuelle**

| Test                         | Status |
| ---------------------------- | ------ |
| Créer room                   | [ ]    |
| Rejoindre room               | [ ]    |
| Lobby affiche joueurs        | [ ]    |
| Démarrer partie              | [ ]    |
| Audio joue synchronisé       | [ ]    |
| Buzz fonctionne              | [ ]    |
| Validation met à jour scores | [ ]    |
| Chanson suivante             | [ ]    |
| Terminer partie              | [ ]    |
| Récap affiché                | [ ]    |

**Critères d'acceptation**

- [ ] Config Playwright pour production ajoutée
- [ ] Tests E2E passent contre production
- [ ] Checklist manuelle complétée

---

## Configuration requise

### Variables d'environnement pour tests

```env
# .env.test.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Commandes

```bash
# Tests E2E locaux
npm run dev &
npx playwright test e2e/multiplayer-flow.spec.ts

# Tests E2E production
npx playwright test --project=production

# Tests avec UI
npx playwright test --ui
```

---

## Checklist de l'Epic

- [ ] 15.1 Tests E2E lobby flow
- [ ] 15.2 Tests E2E game flow
- [ ] 15.3 Tests audio sync
- [ ] 15.4 Tests reconnection
- [ ] 15.5 Tests integration Supabase
- [ ] 15.6 Tests production

## Estimation

~6-8 heures de travail
