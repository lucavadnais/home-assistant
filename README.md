# Smart Home

Maquette 3D interactive de la maison pour piloter les lumières pièce par pièce. Chaque fenêtre s'allume selon l'état de la lumière de sa pièce, et la scène suit l'heure, la saison et la météo en temps réel.

Construit avec React, Three.js ([react-three-fiber](https://github.com/pmndrs/react-three-fiber)) et Vite.

## Fonctionnalités

- **Lumières par pièce** : cliquer sur une fenêtre ou sur la liste pour allumer/éteindre, bouton « Tout éteindre ».
- **Home Assistant** : les pièces liées à une entité reflètent son état en direct (y compris les changements faits depuis Google Home) et la contrôlent via WebSocket.
- **Agenda** : les événements Google Agenda et les tâches Google Tasks avec une échéance (via Home Assistant) dans la carte en haut à gauche. Les tâches en retard restent sur aujourd'hui. Les calendriers et les listes de tâches se règlent dans [src/data/calendars.js](src/data/calendars.js).
- **Horloge** : l'heure et la date en tête de la carte météo, masquables dans l'engrenage (Affichage → Horloge).
- **Mode démo** : sans configuration, les lumières sont simulées localement.
- **Ambiance** : jour / nuit, quatre saisons (la saison actuelle par défaut).
- **Météo** : conditions actuelles à Montréal via [Open-Meteo](https://open-meteo.com/) (gratuit, sans clé), rafraîchies toutes les 15 min, ou préréglage manuel (pluie, orage, neige, tempête, brouillard, vent…). Nuages, précipitations, éclairs et vent sont animés.
- **Environnement** : bâtiments voisins (masquables), plantes, circulation.
- **Mode Lite** : pour les appareils peu puissants (boîtier TV) : résolution native, pas de post-traitement ni de flou derrière les panneaux, ombres recalculées seulement quand la scène change, 30 i/s et moins de particules. Désactivé par défaut, réglable dans l'engrenage, ou forcé avec `?lite` (`?lite=0` pour le désactiver) dans l'URL.

## Démarrage

Prérequis : Node.js 18+.

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite (par défaut http://localhost:5173).

| Commande          | Rôle                                   |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Serveur de développement               |
| `npm run build`   | Build de production dans `dist/`       |
| `npm run preview` | Sert le build de production localement |

## Modéliser sa propre maison

Le modèle livré est la maison de l'auteur. Pour avoir la vôtre, au même niveau de détail, on utilise **Claude Code**, inclus dans l'abonnement Claude Pro ou Max (onglet **Code** de l'app de bureau Claude, ou dans le terminal). Aucune clé API n'est nécessaire.

1. Ouvrir le dossier du projet dans Claude Code.
2. Déposer les photos de la maison dans `house-photos/` : façade avant (la plus importante), côtés, arrière, vues en angle, vue aérienne, détails (entrée, escaliers, balcons), le terrain, et pour chaque pièce contrôlée une photo où sa fenêtre se voit.
3. Taper `/build-house`. Claude regarde les photos, fait confirmer ce que chacune montre et à quelle pièce Home Assistant appartient chaque fenêtre, puis écrit la scène 3D de la maison dans `src/houses/custom/`. Il lance l'app et compare son rendu aux photos, façade par façade, jusqu'à ce qu'ils correspondent.
4. Décrire ce qui cloche (« le toit est à deux versants », « il manque une fenêtre au 2e ») : Claude corrige.

Supprimer `src/houses/custom/` ramène la maison d'origine. Ce dossier et `house-photos/` sont ignorés par git : un clone ne reçoit jamais la maison de quelqu'un d'autre. Pour déployer sa maison depuis git (par ex. sur le Pi), retirer la ligne `src/houses/custom/` du `.gitignore` de son propre clone et commiter le dossier.

Chaque maison est un module au même format ([src/houses/index.js](src/houses/index.js)) : la maison de l'auteur ([src/houses/default/](src/houses/default/)) sert de référence. Deux paramètres d'URL aident à comparer le modèle aux photos : `?view=front` (ou `right`, `back`, `left`, `corner`, `top`) fixe la vue, et `?clean` masque les panneaux.

## Connexion à Home Assistant

1. Copier `.env.example` en `.env.local`.
2. Renseigner l'URL de l'instance et un jeton d'accès longue durée (Home Assistant → Profil → Sécurité → Jetons d'accès longue durée) :

   ```env
   VITE_HA_URL=http://homeassistant.local:8123
   VITE_HA_TOKEN=<votre jeton>
   ```

3. Dans Home Assistant, ranger chaque lumière et prise dans sa pièce (« area »). L'app liste les appareils de Home Assistant qui sont dans une pièce et qui s'allument et s'éteignent ; les types affichés (par défaut les lumières et les prises) se choisissent dans l'engrenage (Affichage → Appareils affichés). Chaque fenêtre cliquable de la maison (`rooms` du module, [src/houses/default/rooms.js](src/houses/default/rooms.js) pour la maison d'origine) est liée à une pièce par son `area` (par ex. `'living_room'`). Un clic sur la fenêtre allume ou éteint tous les appareils de la pièce.
4. Relancer `npm run dev`.

Le statut de connexion s'affiche dans la barre du haut (Mode démo, Connecté, Reconnexion…, Jeton refusé, Injoignable). Les services `homeassistant.toggle` / `turn_off` sont utilisés, donc n'importe quel domaine fonctionne (`light`, `switch`, prises Tuya, etc.).

> ⚠️ Les variables `VITE_*` sont intégrées au bundle côté client : le jeton est lisible par quiconque accède à l'application. À réserver à un usage sur le réseau local.

## Déploiement sur un Raspberry Pi

Pour servir l'app en continu sur le réseau local, depuis le Pi qui fait tourner Home Assistant. Il faut seulement Docker : Node.js n'a pas besoin d'être installé sur le Pi, le build se fait dans un conteneur temporaire.

1. Cloner le dépôt sur le Pi et se placer dans son dossier (les commandes suivantes utilisent `$(pwd)`) :

   ```bash
   git clone git@github.com:lucavadnais/home-assistant.git
   cd home-assistant
   ```

2. Créer `.env.local`, qui n'est pas versionné :

   ```bash
   nano .env.local
   ```

   ```env
   VITE_HA_URL=http://<ip-du-pi>:8123
   VITE_HA_TOKEN=<votre jeton>
   ```

   Mettre l'IP du Pi et non `localhost` : l'URL est utilisée par le navigateur des autres appareils, pas par le Pi.
   Pour enregistrer dans nano : `Ctrl+O`, puis **Entrée** sans choisir de format (surtout pas « DOS Format »), puis `Ctrl+X` pour quitter.

3. Construire l'app dans un conteneur Node jetable (le résultat va dans `dist/`) :

   ```bash
   sudo docker run --rm -v "$(pwd)":/app -w /app node:20-alpine sh -c "npm ci && npm run build"
   ```

4. Servir `dist/` avec nginx, redémarré automatiquement avec le Pi :

   ```bash
   sudo docker run -d --name smarthome --restart unless-stopped \
     -p 8080:80 -v "$(pwd)/dist:/usr/share/nginx/html:ro" nginx:alpine
   ```

   L'app est alors accessible sur `http://<ip-du-pi>:8080` depuis n'importe quel appareil du réseau.

**Sur une télé** (Google TV Streamer avec Fully Kiosk Browser par exemple), mettre `http://<ip-du-pi>:8080/?lite` comme Start URL pour garantir le mode Lite.

**Mettre à jour** : `git pull`, refaire l'étape 3, puis recharger la page (inutile de redémarrer nginx).

**Vérifier** : `sudo docker ps` liste les conteneurs en cours d'exécution, `sudo docker ps -a` tous (y compris arrêtés), `sudo docker logs smarthome` affiche les journaux du serveur.

## Structure

```
src/
├── App.jsx                  État global : pièces, mode, saison, météo, Home Assistant
├── houses/                  Maisons au même format
│   ├── default/             Maison de l'auteur (6538) : maison, voisins, terrain, rue,
│   │                        fenêtres et pièce Home Assistant liée (rooms.js)
│   └── custom/              La vôtre, écrite par /build-house (ignorée par git)
├── data/calendars.js        Calendriers et listes de tâches affichés
├── ha/useHomeAssistant.js   Connexion WebSocket et commandes Home Assistant
├── ha/devices.js            Appareils de Home Assistant, leur type et leur pièce
├── weather/
│   ├── weather.js           Préréglages météo, codes WMO, appel Open-Meteo
│   └── useLiveWeather.js    Rafraîchissement de la météo en direct
├── scene/                   Scène 3D : maison (Duplex, RearHouse), voisins, ciel,
│                            nuages, précipitations, éclairs, plantes, saisons…
└── ui/                      Barre de contrôle et menu météo
```

## Personnalisation

- **Votre maison** : `/build-house` dans Claude Code (voir « Modéliser sa propre maison »).
- **Pièces et fenêtres de 6538** : [src/houses/default/rooms.js](src/houses/default/rooms.js) — pièce Home Assistant (`area`), position, orientation (`FRONT` / `BACK`), taille ; `TREES` pour les sapins qui scintillent.
- **Lieu de la météo** : `LOCATION` dans [src/weather/weather.js](src/weather/weather.js).
- **Préréglages météo** : `WEATHERS` dans le même fichier (couleurs du ciel, nuages, soleil, vent).
