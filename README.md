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

# Configuration Email (Resend)
RESEND_API_KEY=re_your_key
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
