# Epic 13 : Déploiement

## Objectif
Préparer et déployer l'application sur un serveur maison (NAS, Raspberry Pi, etc.).

## Dépendances
- Application complète et testée
- Accès au serveur cible

---

## Issues

### 13.1 Créer le script de build
**Priorité** : P0 (Critique)

**Description**
Configurer et tester le build de production Next.js.

**Commandes**
```bash
# Build de production
npm run build

# Tester le build localement
npm run start
```

**Configuration** : `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Pour déploiement sans node_modules

  // Optimisations
  images: {
    unoptimized: true, // Si pas d'optimisation d'images nécessaire
  },

  // Variables d'environnement exposées
  env: {
    // Pas de secrets ici !
  },

  // Headers pour CORS si nécessaire
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**Vérifications post-build**
```bash
# Taille du bundle
ls -lh .next/standalone

# Tester
PORT=3000 node .next/standalone/server.js
```

**Critères d'acceptation**
- [ ] `npm run build` sans erreur
- [ ] `npm run start` fonctionne
- [ ] Taille du bundle raisonnable
- [ ] Toutes les fonctionnalités OK en prod

---

### 13.2 Configurer le démarrage en production
**Priorité** : P1 (Important)

**Description**
Script de démarrage fiable avec redémarrage automatique.

**Option 1 : PM2** (recommandé)
```bash
# Installation globale
npm install -g pm2

# Démarrer l'application
pm2 start npm --name "blindtest" -- start

# Sauvegarder la config
pm2 save

# Démarrage auto au boot
pm2 startup
```

**Fichier** : `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: 'blindtest',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/path/to/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AUDIO_FOLDER_PATH: '/volume1/music',
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
  }]
}
```

**Option 2 : Systemd** (Linux)
```ini
# /etc/systemd/system/blindtest.service
[Unit]
Description=Blindtest App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/blindtest
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=AUDIO_FOLDER_PATH=/volume1/music
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer
sudo systemctl enable blindtest
sudo systemctl start blindtest
sudo systemctl status blindtest
```

**Critères d'acceptation**
- [ ] Application démarre au boot
- [ ] Redémarrage auto en cas de crash
- [ ] Logs accessibles
- [ ] Variables d'env configurées

---

### 13.3 Documenter l'installation sur NAS
**Priorité** : P1 (Important)

**Description**
Guide pas à pas pour installer l'application sur un NAS Synology ou QNAP.

**Guide Synology (DSM 7)**

```markdown
# Installation Blindtest sur Synology

## Prérequis
- DSM 7.0+
- Node.js installé (via Package Center ou manuellement)
- Accès SSH activé

## 1. Installer Node.js

1. Ouvrir Package Center
2. Rechercher "Node.js"
3. Installer la version 18+

Ou manuellement :
```bash
wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz
tar -xf node-v18.19.0-linux-x64.tar.xz
sudo mv node-v18.19.0-linux-x64 /volume1/@appstore/nodejs
export PATH=$PATH:/volume1/@appstore/nodejs/bin
```

## 2. Télécharger l'application

```bash
# Via SSH
cd /volume1/docker/blindtest  # ou autre emplacement
git clone https://github.com/user/blindtest.git .
```

## 3. Installer les dépendances

```bash
npm install
npm run build
```

## 4. Configurer

```bash
cp .env.example .env.local
nano .env.local
```

Modifier :
```
AUDIO_FOLDER_PATH=/volume1/music
PORT=3000
```

## 5. Démarrer avec PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 6. Accéder à l'application

Ouvrir : http://IP_DU_NAS:3000
```

**Critères d'acceptation**
- [ ] Guide testé sur NAS réel
- [ ] Screenshots si nécessaire
- [ ] Troubleshooting inclus

---

### 13.4 Configurer le reverse proxy si nécessaire
**Priorité** : P2 (Nice-to-have)

**Description**
Configurer Nginx ou Traefik pour exposer l'application derrière un proxy.

**Nginx**
```nginx
# /etc/nginx/sites-available/blindtest
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

    # Pour les fichiers audio volumineux
    client_max_body_size 100M;
    proxy_read_timeout 300s;
}
```

**Synology Reverse Proxy**
1. Control Panel > Application Portal > Reverse Proxy
2. Create :
   - Source: blindtest.local:80
   - Destination: localhost:3000

**Critères d'acceptation**
- [ ] Proxy configuré
- [ ] HTTPS optionnel
- [ ] Timeouts appropriés pour l'audio

---

### 13.5 Ajouter un healthcheck endpoint
**Priorité** : P2 (Nice-to-have)

**Description**
Endpoint pour vérifier que l'application fonctionne.

**Fichier** : `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getSongsCache, getCacheInfo } from '@/lib/audioScanner'

export async function GET() {
  try {
    const cacheInfo = getCacheInfo()
    const songs = await getSongsCache()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      library: {
        songsCount: songs.length,
        lastScan: cacheInfo.lastScan,
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

**Réponse**
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:30:00.000Z",
  "uptime": 3600,
  "library": {
    "songsCount": 150,
    "lastScan": 1705487200000
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 100
  }
}
```

**Usage avec PM2**
```javascript
// ecosystem.config.js
{
  // ...
  health_check: {
    url: 'http://localhost:3000/api/health',
    interval: 30000,
    timeout: 5000,
  }
}
```

**Critères d'acceptation**
- [ ] Endpoint accessible
- [ ] Retourne les infos système
- [ ] Status error si problème
- [ ] Utilisable par monitoring

---

### 13.6 Créer un Dockerfile
**Priorité** : P3 (Futur)

**Description**
Containerisation de l'application pour un déploiement plus portable.

**Fichier** : `Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copier le build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**Fichier** : `docker-compose.yml`
```yaml
version: '3.8'

services:
  blindtest:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AUDIO_FOLDER_PATH=/music
    volumes:
      - /path/to/your/music:/music:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Commandes**
```bash
# Build
docker build -t blindtest .

# Run
docker run -d \
  -p 3000:3000 \
  -v /path/to/music:/music:ro \
  -e AUDIO_FOLDER_PATH=/music \
  --name blindtest \
  blindtest

# Avec docker-compose
docker-compose up -d
```

**Critères d'acceptation**
- [ ] Image build sans erreur
- [ ] Container démarre
- [ ] Volume audio accessible
- [ ] Taille d'image < 500MB

---

## Scripts package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "docker:build": "docker build -t blindtest .",
    "docker:run": "docker run -p 3000:3000 -v /music:/music:ro blindtest"
  }
}
```

---

## Checklist de l'Epic

- [ ] 13.1 Build de production
- [ ] 13.2 Script de démarrage (PM2/systemd)
- [ ] 13.3 Documentation NAS
- [ ] 13.4 Reverse proxy
- [ ] 13.5 Healthcheck endpoint
- [ ] 13.6 Dockerfile

## Estimation
~3-4 heures de travail

---

## Checklist de déploiement final

- [ ] Build de production testé
- [ ] Variables d'environnement configurées
- [ ] Chemin audio vérifié
- [ ] Application démarre au boot
- [ ] Accessible sur le réseau local
- [ ] Audio fonctionne depuis tous les appareils
- [ ] Mobile testé
- [ ] Monitoring configuré (optionnel)
