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

# Bot Discord (apps/bot) : il se configure dans Solar, rien à ajouter ici. Voir « Bot Discord » plus bas.

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
  permanence). Le bot modifie le même message du salon d'ouverture (texte et bouton « Ouvrir une écoute »), et annonce
  l'ouverture si un salon d'annonce est choisi.
- **Écoute** : messages privés relayés dans les deux sens, sans identifier le bénévole, avec les réponses à un message
  et les réactions (emojis Unicode ; les réactions des bénévoles apparaissent comme celles du bot) ; indicateur de saisie ;
  fermeture par l'usager (bouton « Fermer l'écoute ») ou par le bénévole ; lien d'appel quand le bénévole passe en vocal.
- **Non pris en charge pour l'instant** : images (#301), signalements et levée d'anonymat (#302).

**Mise en place** : dans **Administration > Paramètres, section Bot Discord**, « Configurer le bot » guide pas à pas :

1. Solar crée le compte du bot et sa clé d'accès (rien à copier).
2. Vous collez le jeton du bot, pris sur le [portail développeurs Discord](https://discord.com/developers/applications)
   (onglet Bot, « Reset Token »). Solar le vérifie auprès de Discord et le garde chiffré dans la base.
3. Vous choisissez le serveur ; si le bot n'y est pas, le bouton « Ajouter le bot à un serveur » ouvre l'invitation
   Discord avec les permissions nécessaires, et le serveur apparaît ensuite tout seul.
4. Vous choisissez les salons dans des listes, et le message d'ouverture parmi ceux du bot (ou un nouveau message).

Le service du bot n'a besoin d'aucune variable propre : il demande sa configuration à l'API avec
`INTERNAL_API_SECRET` (déjà présent pour les autres services), toutes les 30 secondes, et redémarre de lui-même quand
le jeton, le serveur ou la clé changent. Les changements de salons s'appliquent tout de suite. Le jeton est chiffré
avec une clé dérivée de `INTERNAL_API_SECRET` : si ce secret change, il faut indiquer à nouveau le jeton.

Sans configuration dans Solar, le bot reprend l'ancienne configuration du `.env` si elle est complète
(`DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `SOLAR_BOT_API_KEY`, et les salons `DISCORD_OPENING_CHANNEL_ID`,
`DISCORD_OPENING_MESSAGE_ID`, `DISCORD_ANNOUNCE_CHANNEL_ID`, `DISCORD_HELP_CHANNEL_ID`).
Seules les adresses vues par le bot peuvent avoir besoin d'être ajustées :

```env
API_BASE_URL=http://localhost:3001
WS_INTERNAL_URL=http://localhost:5000
```

Sur le portail développeurs Discord, le bot n'a besoin d'aucun intent privilégié. L'invitation lui donne seulement :
voir les salons, envoyer des messages et des liens intégrés, lire l'historique. Les appels vocaux se font dans Solar
(le bot envoie le lien en message privé) : le bot ne gère aucun salon vocal sur Discord.

**Équipe de la page d'accueil** : dans Administration > Paramètres, section Équipe, une personne peut être importée
depuis Discord par son identifiant, ou son profil lié à un compte Discord. Son pseudo sur le serveur et sa photo sont
alors repris et tenus à jour par l'API (toutes les `DISCORD_SYNC_INTERVAL_HOURS` heures, 6 par défaut), avec le même
bot et le même serveur. Modifier le nom ou la photo à la main les personnalise (ils ne suivent plus
Discord) ; « Resynchroniser » les reprend de Discord. Les photos sont copiées dans la base : les visiteurs du site ne
contactent jamais Discord.

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
