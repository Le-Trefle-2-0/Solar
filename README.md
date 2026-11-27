# Solar Monorepo

Monorepo Node.js avec plusieurs services :

- `apps/web` – Front-end Next.js
- `apps/api` – API REST Fastify (Prisma/MySQL)
- `apps/ws` – Service WebSocket Socket.IO
- `apps/voice` – SFU voix basé sur Mediasoup
- `apps/storage` – Service de stockage

---

## 🛠 Procédure d'Installation

Cette application est destinée aux bénévoles enregistrés d'une ONG. Le processus d'inscription n'est pas ouvert au
public. Un outil de configuration est fourni pour créer le premier compte administrateur.

### Prérequis

- Node.js 20+
- MySQL 8+
- Redis (optionnel, sauf pour le scale-out WS)

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env` à la racine du projet.

Configuration minimale :

```env
# URL du Front-end
NEXT_PUBLIC_APP_URL=http://localhost:3000

# URL WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# Base de données (MySQL)
DATABASE_URL="mysql://utilisateur:motdepasse@localhost:3306/solar"

# Clé secrète pour l'authentification
BETTER_AUTH_SECRET=une_cle_secrete_tres_longue

# Secrets obligatoires : l'API et le serveur WebSocket refusent de démarrer sans eux (le web les vérifie aussi au démarrage)
# Signature des connexions invitées du widget
WS_GUEST_SECRET=une_cle_secrete_aleatoire_pour_les_ws
# Communications internes entre services (/v1/keys/check)
INTERNAL_API_SECRET=une_autre_cle_secrete_aleatoire
# Pseudonymisation des identifiants Discord (API uniquement). Ne jamais la changer ensuite.
DISCORD_ID_HASH_SECRET=encore_une_cle_secrete_aleatoire
# Diffusion d'événements de l'API et du web vers le serveur WebSocket (/broadcast)
WS_BROADCAST_SECRET=une_cle_secrete_aleatoire_pour_la_diffusion
# Accès du web au service de stockage (pièces d'identité, casiers). Le stockage refuse de démarrer sans elle.
STORAGE_SECRET=une_cle_secrete_aleatoire_pour_le_stockage
# Adresse interne du stockage vue par le web (jamais exposée au navigateur, qui passe par /api/files)
STORAGE_INTERNAL_URL=http://127.0.0.1:3004

# Service vocal (salon vocal de la permanence, tickets vocaux)
# Adresse du service vocal pour le navigateur, et pour l'API (interne)
NEXT_PUBLIC_VOICE_URL=http://localhost:3003
VOICE_INTERNAL_URL=http://127.0.0.1:3003
# Adresse publique du serveur vocal (celle que les navigateurs joignent) et ports audio UDP/TCP à ouvrir
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
MEDIASOUP_MIN_PORT=40000
MEDIASOUP_MAX_PORT=40100

# Bot Discord (apps/bot) : sans DISCORD_TOKEN, le bot reste inactif. Voir « Bot Discord » plus bas.
DISCORD_TOKEN=
DISCORD_GUILD_ID=
DISCORD_OPENING_CHANNEL_ID=
DISCORD_OPENING_MESSAGE_ID=
SOLAR_BOT_API_KEY=

# docker-compose (développement local uniquement) : mots de passe MySQL et Redis
MYSQL_ROOT_PASSWORD=un_mot_de_passe_mysql_local
REDIS_PASSWORD=un_mot_de_passe_redis_local

# Derrière un reverse proxy : "true", un nombre de sauts ou les adresses des proxys (limitation de débit par IP)
TRUST_PROXY=1
# Hôtes autorisés pour les images distantes (POST /v1/image), séparés par des virgules
IMAGE_ALLOWED_HOSTS=

# Configuration Email (Resend)
RESEND_API_KEY=re_your_key

# Options d'administration
HIDE_EMAILS_IN_ADMIN=true # Masque les emails dans l'onglet admin (u***@domain.com)
```

### Proxy inverse (Traefik)

Si l'app est servie derriere Traefik, assurez-vous que les services utilisent la meme origine publique pour
l'emission et la validation des JWT :

```env
# URL publique (doit correspondre au domaine https public)
NEXT_PUBLIC_APP_URL=https://solar.example.org
BETTER_AUTH_URL=https://solar.example.org

# URL interne pour que les services puissent joindre Better Auth
INTERNAL_AUTH_URL=http://web:3000

# Base API publique si Traefik route /v1 vers l'API
NEXT_PUBLIC_API_URL=https://solar.example.org

# CORS API (liste d'origines separees par des virgules)
API_CORS_ORIGIN=https://solar.example.org,https://beta.letrefle.org
```

### 3. Initialisation de la base de données

```bash
npm run generate
# Si c'est une nouvelle installation :
# npx prisma db push
```

### 4. Création du compte Administrateur

Utilisez l'outil de configuration pour créer le premier compte administrateur. Ce compte vous permettra ensuite
d'inviter d'autres membres.

```bash
npm run setup:admin
```

Suivez les instructions à l'écran pour saisir le nom, l'email et le mot de passe de l'administrateur.

### 5. Lancement de l'application

En mode développement :

```bash
npm run dev:all
```

L'application sera accessible sur `http://localhost:3000`.

---

## 🚀 Utilisation (Docker Compose)

Pour lancer toute la stack avec Docker :

```bash
npm run compose:up
```

Ce fichier sert uniquement au développement local : serveurs de développement, dépôt monté, ports limités à `127.0.0.1`. Il demande `MYSQL_ROOT_PASSWORD` et `REDIS_PASSWORD` dans le `.env`. Ne jamais l'utiliser pour déployer.

---

## 🤖 Bot Discord

Le bot (`apps/bot`) permet aux usagers du serveur Discord d'ouvrir et de suivre leur écoute en messages privés, comme
avec l'ancien bot ; les bénévoles répondent dans Solar. Il ne garde aucune donnée : les écoutes en cours et les
messages à remettre sont lus dans Solar, ce qui lui permet de reprendre après un redémarrage ou une coupure.

- **Ouverture et fermeture** : elles suivent le planning de Solar (une écoute ne peut être ouverte que pendant une
  permanence). Le bot modifie le même message du salon d'ouverture (texte et bouton « Ouvrir une écoute »), annonce
  l'ouverture et ouvre le salon vocal pendant la permanence s'ils sont configurés.
- **Écoute** : messages privés relayés dans les deux sens, sans identifier le bénévole ; indicateur de saisie ;
  fermeture par l'usager (bouton « Fermer l'écoute ») ou par le bénévole ; lien d'appel quand le bénévole passe en vocal.
- **Non pris en charge pour l'instant** : images (#301), signalements et levée d'anonymat (#302).

Configuration (`.env`) :

```env
# Application Discord : jeton du bot (portail développeurs Discord, onglet Bot). Secret.
DISCORD_TOKEN=
# Serveur, salon et message d'ouverture (identifiants de l'ancien settings.json : mainGuildID, ticketOpening).
# Le message doit avoir été écrit par ce bot ; sinon (ou s'il est vide) le bot reprend son dernier message du salon
# ou en publie un nouveau et indique son identifiant dans ses journaux.
DISCORD_GUILD_ID=
DISCORD_OPENING_CHANNEL_ID=
DISCORD_OPENING_MESSAGE_ID=
# Facultatifs : salon d'annonce de l'ouverture, salon vocal ouvert pendant les permanences, salon des autres supports
DISCORD_ANNOUNCE_CHANNEL_ID=
DISCORD_VOICE_CHANNEL_ID=
DISCORD_HELP_CHANNEL_ID=718250345951658064
# Clé API du compte bot, générée dans Administration > Paramètres, section Bot. Secret.
SOLAR_BOT_API_KEY=
# Adresses de l'API et du serveur WebSocket vues par le bot
API_BASE_URL=http://localhost:3001
WS_INTERNAL_URL=http://localhost:5000
```

Sur le portail développeurs Discord, le bot n'a besoin d'aucun intent privilégié. Sur le serveur, il doit pouvoir lire
et écrire dans le salon d'ouverture (et d'annonce), et gérer les permissions du salon vocal s'il est configuré.

---

## 🔒 Authentification et Accès

L'accès à la partie connectée de l'application se fait uniquement sur invitation. Une fois le premier administrateur
créé via l'outil de configuration, celui-ci peut gérer les membres et les invitations depuis l'onglet "Utilisateurs".

---

## 📜 Scripts utiles

- `npm run dev:all` : Lance tous les services en mode dev.
- `npm run setup:admin` : Outil de création du premier administrateur.
- `npm run db` : Réinitialise la base de données (Attention : destructif).
- `npm run build:all` : Compile tous les services pour la production.
- `npm run dev:bot` : Lance uniquement le bot Discord.
