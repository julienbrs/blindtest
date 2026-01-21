# Installation Blindtest sur NAS

Guide pas à pas pour installer l'application Blindtest sur un NAS Synology, QNAP, ou autre serveur Linux.

## Table des matières

- [Prérequis](#prérequis)
- [Installation sur Synology (DSM 7)](#installation-sur-synology-dsm-7)
- [Installation sur QNAP (QTS)](#installation-sur-qnap-qts)
- [Installation générique Linux](#installation-générique-linux)
- [Configuration](#configuration)
- [Démarrage avec PM2](#démarrage-avec-pm2)
- [Démarrage avec Systemd](#démarrage-avec-systemd)
- [Reverse Proxy](#reverse-proxy)
- [Accès à l'application](#accès-à-lapplication)
- [Mise à jour](#mise-à-jour)
- [Troubleshooting](#troubleshooting)

---

## Prérequis

- **Node.js 18+** installé sur le NAS
- **npm** ou **pnpm** (gestionnaire de paquets)
- **Accès SSH** activé sur le NAS
- **Dossier de musique** accessible (MP3, FLAC, WAV, OGG)
- **1 Go de RAM** minimum disponible
- **Compte Supabase** (gratuit) pour le mode multijoueur

---

## Installation sur Synology (DSM 7)

### Étape 1 : Activer SSH

1. Ouvrir **Panneau de configuration** > **Terminal & SNMP**
2. Cocher **Activer le service SSH**
3. Cliquer **Appliquer**

### Étape 2 : Installer Node.js

**Option A : Via Package Center (recommandé)**

1. Ouvrir **Package Center**
2. Rechercher **Node.js**
3. Installer **Node.js v18** ou supérieur

**Option B : Installation manuelle**

```bash
# Se connecter en SSH
ssh admin@IP_DU_NAS

# Télécharger Node.js
cd /volume1
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz

# Extraire
tar -xf node-v20.11.0-linux-x64.tar.xz
sudo mv node-v20.11.0-linux-x64 /usr/local/lib/nodejs

# Ajouter au PATH (ajouter dans ~/.bashrc)
echo 'export PATH=$PATH:/usr/local/lib/nodejs/bin' >> ~/.bashrc
source ~/.bashrc

# Vérifier l'installation
node --version  # Doit afficher v20.x.x
npm --version
```

### Étape 3 : Télécharger l'application

```bash
# Créer le dossier d'installation
mkdir -p /volume1/docker/blindtest
cd /volume1/docker/blindtest

# Cloner le repository (ou copier les fichiers)
git clone https://github.com/votre-user/blindtest.git .

# Ou télécharger et extraire une release
wget https://github.com/votre-user/blindtest/archive/refs/heads/main.zip
unzip main.zip
mv blindtest-main/* .
rm -rf blindtest-main main.zip
```

### Étape 4 : Installer les dépendances et build

```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier que le build s'est bien passé
ls -la .next/standalone/
```

### Étape 5 : Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer la configuration
nano .env.local
```

Contenu de `.env.local` :

```bash
# Chemin vers votre bibliothèque musicale
AUDIO_FOLDER_PATH=/volume1/music

# Configuration Supabase (pour le multijoueur)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### Étape 6 : Tester le démarrage

```bash
# Démarrer manuellement pour tester
PORT=3000 node .next/standalone/server.js

# Ouvrir http://IP_DU_NAS:3000 dans un navigateur
# Ctrl+C pour arrêter
```

---

## Installation sur QNAP (QTS)

### Étape 1 : Activer SSH

1. Ouvrir **Panneau de configuration** > **Réseau & Services de fichiers** > **Telnet/SSH**
2. Activer **Permettre la connexion SSH**
3. Cliquer **Appliquer**

### Étape 2 : Installer Node.js via QPKG

1. Ouvrir **App Center**
2. Rechercher **Node.js**
3. Installer la version 18+

Ou installer manuellement via Entware :

```bash
# Si Entware est installé
opkg update
opkg install node node-npm
```

### Étape 3 : Suite de l'installation

Suivre les étapes 3 à 6 de l'installation Synology, en adaptant les chemins :

- Dossier d'installation : `/share/CACHEDEV1_DATA/blindtest`
- Dossier musique : `/share/Multimedia/Music` (exemple)

---

## Installation générique Linux

Pour Raspberry Pi, Ubuntu Server, Debian, ou autre distribution Linux.

### Étape 1 : Installer Node.js

```bash
# Via NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier
node --version
npm --version
```

### Étape 2 : Créer un utilisateur dédié (optionnel mais recommandé)

```bash
sudo useradd -m -s /bin/bash blindtest
sudo mkdir -p /opt/blindtest
sudo chown blindtest:blindtest /opt/blindtest
```

### Étape 3 : Installer l'application

```bash
sudo -u blindtest bash
cd /opt/blindtest

# Cloner ou copier les fichiers
git clone https://github.com/votre-user/blindtest.git .

# Installer et build
npm install
npm run build

# Configurer
cp .env.example .env.local
nano .env.local
```

---

## Configuration

### Variables d'environnement requises

| Variable                        | Description                          | Exemple                   |
| ------------------------------- | ------------------------------------ | ------------------------- |
| `AUDIO_FOLDER_PATH`             | Chemin vers les fichiers audio       | `/volume1/music`          |
| `PORT`                          | Port de l'application (défaut: 3000) | `3000`                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL du projet Supabase               | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase                 | `eyJhbGc...`              |

### Formats audio supportés

- MP3 (`.mp3`)
- FLAC (`.flac`)
- WAV (`.wav`)
- OGG (`.ogg`)
- M4A (`.m4a`)
- AAC (`.aac`)

### Structure recommandée du dossier audio

```
/volume1/music/
├── Artist 1/
│   ├── Album 1/
│   │   ├── 01 - Song.mp3
│   │   └── cover.jpg
│   └── Album 2/
└── Artist 2/
    └── ...
```

L'application scanne récursivement tous les sous-dossiers.

---

## Démarrage avec PM2

PM2 est recommandé pour la gestion du processus en production.

### Installation de PM2

```bash
sudo npm install -g pm2
```

### Configuration PM2

Le fichier `ecosystem.config.js` est déjà fourni. Adaptez-le si nécessaire :

```javascript
module.exports = {
  apps: [
    {
      name: 'blindtest',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/volume1/docker/blindtest', // Adapter ce chemin
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        AUDIO_FOLDER_PATH: '/volume1/music', // Adapter ce chemin
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
}
```

### Démarrer l'application

```bash
cd /volume1/docker/blindtest

# Démarrer
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs blindtest

# Sauvegarder la configuration
pm2 save

# Activer le démarrage automatique au boot
pm2 startup
# Exécuter la commande affichée par pm2 startup
```

### Commandes PM2 utiles

```bash
pm2 status           # État de l'application
pm2 logs blindtest   # Voir les logs en temps réel
pm2 restart blindtest # Redémarrer
pm2 stop blindtest   # Arrêter
pm2 delete blindtest # Supprimer
pm2 monit            # Monitoring en temps réel
```

---

## Démarrage avec Systemd

Alternative à PM2 pour les systèmes Linux avec systemd.

### Créer le fichier de service

```bash
sudo nano /etc/systemd/system/blindtest.service
```

Contenu :

```ini
[Unit]
Description=Blindtest Music Quiz Application
After=network.target

[Service]
Type=simple
User=blindtest
WorkingDirectory=/opt/blindtest
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=AUDIO_FOLDER_PATH=/volume1/music
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=blindtest

[Install]
WantedBy=multi-user.target
```

### Activer et démarrer

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer au démarrage
sudo systemctl enable blindtest

# Démarrer
sudo systemctl start blindtest

# Vérifier le statut
sudo systemctl status blindtest

# Voir les logs
journalctl -u blindtest -f
```

---

## Reverse Proxy

Un reverse proxy permet d'accéder à l'application via un nom de domaine personnalisé, d'ajouter HTTPS, et de gérer plusieurs applications sur le même serveur.

### Option 1 : Nginx (recommandé pour Linux)

#### Installation de Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Vérifier que Nginx est en marche
sudo systemctl status nginx
```

#### Configuration

Un fichier de configuration exemple est fourni dans le projet : `nginx.conf.example`

```bash
# Copier la configuration
sudo cp /volume1/docker/blindtest/nginx.conf.example /etc/nginx/sites-available/blindtest

# Éditer et personnaliser
sudo nano /etc/nginx/sites-available/blindtest
# Modifier server_name avec votre domaine ou IP

# Activer le site
sudo ln -s /etc/nginx/sites-available/blindtest /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

#### Configuration minimale

```nginx
server {
    listen 80;
    server_name blindtest.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Timeouts pour l'audio
    client_max_body_size 100M;
    proxy_read_timeout 300s;
}
```

### Option 2 : Synology Reverse Proxy (DSM 7)

Pour les utilisateurs Synology, le reverse proxy intégré est la solution la plus simple.

#### Étapes de configuration

1. Ouvrir **Panneau de configuration**
2. Aller dans **Portail de connexion** > **Avancé** > **Proxy inversé**
3. Cliquer **Créer**
4. Configurer :
   - **Nom** : `blindtest`
   - **Source** :
     - Protocole : `HTTP` (ou `HTTPS` si certificat disponible)
     - Nom d'hôte : `blindtest.local` (ou votre domaine)
     - Port : `80` (ou `443` pour HTTPS)
   - **Destination** :
     - Protocole : `HTTP`
     - Nom d'hôte : `localhost`
     - Port : `3000`
5. Cliquer **Sauvegarder**

#### Configuration des en-têtes personnalisés

Pour le support WebSocket (requis pour le multijoueur) :

1. Modifier le proxy créé
2. Onglet **En-têtes personnalisés**
3. Cliquer **Créer** > **WebSocket**
4. Sauvegarder

#### Configuration des timeouts

Pour éviter les déconnexions lors du streaming audio :

1. Dans les paramètres du proxy
2. Onglet **Avancé**
3. Timeout de connexion : `600` secondes

### Option 3 : QNAP Reverse Proxy

1. Ouvrir **Panneau de configuration**
2. Aller dans **Applications** > **Serveur Web** > **Proxy inversé**
3. Cliquer **Ajouter**
4. Configurer source et destination comme pour Synology

### Option 4 : Traefik (Docker)

Si vous utilisez Docker et Traefik comme reverse proxy :

```yaml
# docker-compose.yml avec labels Traefik
services:
  blindtest:
    build: .
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.blindtest.rule=Host(`blindtest.local`)'
      - 'traefik.http.services.blindtest.loadbalancer.server.port=3000'
```

### HTTPS avec Let's Encrypt (optionnel)

Pour ajouter HTTPS avec un certificat gratuit Let's Encrypt :

#### Via Certbot (Nginx)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d blindtest.yourdomain.com

# Le renouvellement automatique est configuré par défaut
sudo certbot renew --dry-run
```

#### Via Synology

1. **Panneau de configuration** > **Sécurité** > **Certificat**
2. Cliquer **Ajouter**
3. Choisir **Ajouter un nouveau certificat**
4. Sélectionner **Obtenir un certificat auprès de Let's Encrypt**
5. Remplir domaine et email
6. Assigner le certificat au reverse proxy dans **Configurer**

### Vérification

Après configuration du reverse proxy :

1. Accéder à `http://blindtest.local` (ou votre domaine)
2. Vérifier que la page d'accueil s'affiche
3. Tester le mode multijoueur (WebSocket)
4. Tester la lecture audio

---

## Accès à l'application

Une fois l'application démarrée :

1. Ouvrir un navigateur web
2. Aller à `http://IP_DU_NAS:3000`
3. L'application devrait afficher la page d'accueil

### Trouver l'IP du NAS

- **Synology** : Panneau de configuration > Réseau > Interface réseau
- **QNAP** : Panneau de configuration > Réseau > Paramètres TCP/IP
- **Linux** : `hostname -I` ou `ip addr`

### Accès depuis d'autres appareils

Assurez-vous que :

- Tous les appareils sont sur le même réseau local
- Le pare-feu autorise le port 3000
- Exemple : téléphone connecté au même WiFi

---

## Mise à jour

### Avec Git

```bash
cd /volume1/docker/blindtest

# Arrêter l'application
pm2 stop blindtest

# Récupérer les mises à jour
git pull origin main

# Réinstaller les dépendances si nécessaire
npm install

# Rebuilder
npm run build

# Redémarrer
pm2 restart blindtest
```

### Sans Git

1. Télécharger la nouvelle version
2. Sauvegarder `.env.local`
3. Remplacer les fichiers
4. Restaurer `.env.local`
5. `npm install && npm run build`
6. Redémarrer l'application

---

## Troubleshooting

### L'application ne démarre pas

**Vérifier les logs :**

```bash
pm2 logs blindtest
# ou
journalctl -u blindtest -f
```

**Vérifier que le port n'est pas utilisé :**

```bash
lsof -i :3000
# ou
netstat -tlnp | grep 3000
```

### "Cannot find module" ou erreurs de dépendances

```bash
# Supprimer et réinstaller les dépendances
rm -rf node_modules
npm install
npm run build
```

### "ENOENT: no such file or directory" pour les fichiers audio

1. Vérifier que `AUDIO_FOLDER_PATH` est correct dans `.env.local`
2. Vérifier les permissions de lecture :
   ```bash
   ls -la /volume1/music
   ```
3. S'assurer que l'utilisateur a accès au dossier

### Page blanche ou erreur 500

1. Vérifier que le build est complet :
   ```bash
   ls -la .next/standalone/
   ```
2. Rebuilder si nécessaire :
   ```bash
   npm run build
   ```

### Audio ne joue pas sur mobile

- Safari iOS nécessite une interaction utilisateur avant de jouer l'audio
- Vérifier que le navigateur n'est pas en mode économie de données
- Tester avec Chrome sur mobile

### Problèmes de mémoire

```bash
# Vérifier l'utilisation mémoire
pm2 monit

# Si l'application utilise trop de mémoire, elle redémarrera automatiquement
# grâce à max_memory_restart: '500M' dans ecosystem.config.js
```

### Pas de chansons trouvées

1. Vérifier le chemin audio :
   ```bash
   ls /volume1/music/
   ```
2. Vérifier les formats supportés (MP3, FLAC, WAV, OGG, M4A, AAC)
3. L'application scanne récursivement, les fichiers peuvent être dans des sous-dossiers

### Multijoueur ne fonctionne pas

1. Vérifier les variables Supabase dans `.env.local`
2. S'assurer que le projet Supabase est actif
3. Vérifier que les tables de la base de données sont créées

---

## Support

Pour signaler un bug ou demander de l'aide :

- Ouvrir une issue sur GitHub
- Inclure les logs et la configuration (sans les clés secrètes)
