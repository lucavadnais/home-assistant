# Smart Home

Maquette 3D interactive de la maison (6538, maison de fond de cour) pour piloter les lumières pièce par pièce. Chaque fenêtre s'allume selon l'état de la lumière de sa pièce, et la scène suit l'heure, la saison et la météo en temps réel.

Construit avec React, Three.js ([react-three-fiber](https://github.com/pmndrs/react-three-fiber)) et Vite.

## Fonctionnalités

- **Lumières par pièce** : cliquer sur une fenêtre ou sur la liste pour allumer/éteindre, bouton « Tout éteindre ».
- **Home Assistant** : les pièces liées à une entité reflètent son état en direct (y compris les changements faits depuis Google Home) et la contrôlent via WebSocket.
- **Mode démo** : sans configuration, les lumières sont simulées localement.
- **Ambiance** : jour / nuit, quatre saisons (la saison actuelle par défaut).
- **Météo** : conditions actuelles à Montréal via [Open-Meteo](https://open-meteo.com/) (gratuit, sans clé), rafraîchies toutes les 15 min, ou préréglage manuel (pluie, orage, neige, tempête, brouillard, vent…). Nuages, précipitations, éclairs et vent sont animés.
- **Environnement** : bâtiments voisins (masquables), plantes, circulation.

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

## Connexion à Home Assistant

1. Copier `.env.example` en `.env.local`.
2. Renseigner l'URL de l'instance et un jeton d'accès longue durée (Home Assistant → Profil → Sécurité → Jetons d'accès longue durée) :

   ```env
   VITE_HA_URL=http://homeassistant.local:8123
   VITE_HA_TOKEN=<votre jeton>
   ```

3. Dans [src/data/rooms.js](src/data/rooms.js), renseigner le champ `entity` de chaque pièce (par ex. `'light.salon'`). Les pièces laissées à `null` restent en bascule locale.
4. Relancer `npm run dev`.

Le statut de connexion s'affiche dans la barre du haut (Mode démo, Connecté, Reconnexion…, Jeton refusé, Injoignable). Les services `homeassistant.toggle` / `turn_off` sont utilisés, donc n'importe quel domaine fonctionne (`light`, `switch`, prises Tuya, etc.).

> ⚠️ Les variables `VITE_*` sont intégrées au bundle côté client : le jeton est lisible par quiconque accède à l'application. À réserver à un usage sur le réseau local.

## Structure

```
src/
├── App.jsx                  État global : pièces, mode, saison, météo, Home Assistant
├── data/rooms.js            Pièces, position des fenêtres et entités liées
├── ha/useHomeAssistant.js   Connexion WebSocket et commandes Home Assistant
├── weather/
│   ├── weather.js           Préréglages météo, codes WMO, appel Open-Meteo
│   └── useLiveWeather.js    Rafraîchissement de la météo en direct
├── scene/                   Scène 3D : maison (Duplex, RearHouse), voisins, ciel,
│                            nuages, précipitations, éclairs, plantes, saisons…
└── ui/                      Barre de contrôle et menu météo
```

## Personnalisation

- **Pièces et fenêtres** : [src/data/rooms.js](src/data/rooms.js) — nom, position, orientation (`FRONT` / `BACK`), taille, entité.
- **Lieu de la météo** : `LOCATION` dans [src/weather/weather.js](src/weather/weather.js).
- **Préréglages météo** : `WEATHERS` dans le même fichier (couleurs du ciel, nuages, soleil, vent).
