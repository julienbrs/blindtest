# Remise en production du Blindtest

## 1. Migration Supabase additive

Appliquer `supabase/migrations/20260815_add_room_played_song_ids.sql` avant de
déployer l'image applicative. La colonne ajoutée est compatible avec l'ancienne
image et peut rester en place en cas de rollback.

## 2. Montage NFS du NUC

Dans `/etc/fstab` sur le NUC, utiliser exactement :

```fstab
192.168.1.220:/volume1/Plex_Media /mnt/Plex_Media nfs ro,_netdev,nofail,x-systemd.automount,x-systemd.mount-timeout=30s 0 0
```

Puis recharger systemd et déclencher l'automount :

```sh
sudo systemctl daemon-reload
sudo systemctl restart mnt-Plex_Media.automount
ls /mnt/Plex_Media/Music/Blindtest
find /mnt/Plex_Media/Music/Blindtest -type f \
  \( -iname '*.mp3' -o -iname '*.wav' -o -iname '*.ogg' \
  -o -iname '*.flac' -o -iname '*.m4a' -o -iname '*.aac' \) | wc -l
```

Le dernier contrôle doit retrouver les 82 fichiers de la bibliothèque. Une
tentative de création de fichier sous ce chemin doit échouer avec un système de
fichiers en lecture seule.

## 3. Stockage et health check Coolify

Dans le stockage persistant de l'application, ajouter un bind mount :

- source : `/mnt/Plex_Media/Music/Blindtest`
- destination : `/music`

Le montage NFS source est en lecture seule, donc le conteneur ne peut pas
écrire dans la bibliothèque. La configuration suit la
[documentation Coolify](https://coolify.io/docs/knowledge-base/persistent-storage).

Depuis le terminal du conteneur Coolify, confirmer explicitement la lecture
seule (la commande doit échouer) :

```sh
touch /music/.blindtest-write-check
```

Si elle réussit contre toute attente, supprimer immédiatement ce fichier et
corriger le montage avant d'ouvrir l'application aux joueurs.

Le `Dockerfile` déclare `/api/health` avec une période de démarrage de 180
secondes. Si le health check est configuré dans l'interface Coolify, conserver
au minimum la même période afin de laisser finir le premier scan.

## 4. Vérifications après déploiement

```sh
curl --fail https://blindtest.ainur.pro/api/health
curl --fail https://blindtest.ainur.pro/api/songs
curl --fail https://blindtest.ainur.pro/api/playlists
curl -i -H 'Range: bytes=0-1023' \
  https://blindtest.ainur.pro/api/audio/ID_D_UN_MORCEAU
```

Le health check doit annoncer 82 morceaux, `/api/songs` doit répondre `200` et
la requête audio partielle `206`. Tester enfin une partie solo puis une partie
multijoueur avec « Toute la bibliothèque ». Aucun fichier M3U initial n'est
requis ; les futurs `.m3u` et `.m3u8` placés sous la bibliothèque apparaîtront
automatiquement dans le sélecteur.
