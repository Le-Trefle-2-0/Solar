# Solar monorepo

Node.js monorepo with multiple services:

- apps/web – Next.js front‑end
- apps/api – Fastify REST API (Prisma/MySQL)
- apps/ws – Socket.IO WebSocket service (optional Redis adapter)
- apps/voice – Mediasoup‑based voice SFU (audio‑only starter)
- apps/peer – Optional PeerJS helper (not wired by default)

Docker Compose is included for a one‑command local stack.

---

## Quickstart (local without Docker)

Prerequisites:

- Node.js 20+
- MySQL 8+ (local or remote) and Redis (optional unless you want WS scale‑out)

1) Install dependencies

```bash
npm i
```

2) Set environment variables (create `.env` at repo root if needed)

Minimal dev setup:

```bash
# Front‑end URL (used for auth issuer/audience and JWKS discovery)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Front‑end connects to WS here
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# API/database (used by API service and/or web if it accesses DB)
DATABASE_URL="mysql://root:password@localhost:3306/solar"
```

3) Start all services together (web, api, ws, voice)

```bash
npm run dev:all
```

Then open http://localhost:3000

Run a single service (examples):

```bash
npm run dev:web   # Next.js on :3000
npm run dev:api   # Fastify API on :4000
npm run dev:ws    # Socket.IO WS on :5000
npm run dev:voice # Mediasoup voice on :6000
```

Database utilities (destructive reset + seed):

```bash
npm run db
```

---

## Quickstart (Docker Compose)

This brings up MySQL, Redis, web, api, ws, and voice with sensible defaults.

```bash
npm run compose:up
# or: docker compose up
```

Services:

- web: http://localhost:3000
- api: http://localhost:4000
- ws: ws://localhost:5000
- voice: http://localhost:6000

Tear down:

```bash
npm run compose:down
```

---

## One‑command start (production‑like build)

Build all apps and start with one command:

```bash
npm run build:web && npm run build:api && npm run build:ws && npm run build:voice
npm run start:all
```

---

## Environment variables (common)

Frontend/Auth

- `NEXT_PUBLIC_APP_URL` – canonical web origin (e.g., http://localhost:3000)
- `NEXT_PUBLIC_WS_URL` – WebSocket URL for the web app

API

- `API_HOST` (default `0.0.0.0`)
- `API_PORT` (default `4000`)
- `DATABASE_URL` – Prisma connection string (MySQL)

WebSocket

- `WS_HOST` (default `0.0.0.0`)
- `WS_PORT` (default `5000`)
- `REDIS_URL` – optional, enables Redis adapter for Socket.IO
- `API_BASE_URL` – optional, used to validate API keys if you add that route

Voice (mediasoup)

- `VOICE_HOST` (default `0.0.0.0`)
- `VOICE_PORT` (default `6000`)
- `MEDIASOUP_MIN_PORT` / `MEDIASOUP_MAX_PORT` – RTP port range (exposed in compose)
- `MEDIASOUP_ANNOUNCED_IP` – public IP/hostname for clients

---

## Health endpoints

- API: `GET /health` → `{ status: "ok" }`
- Voice: `GET /health` → `{ status: "ok" }`

---

## Scripts cheat‑sheet

- `npm run dev:all` – start web, api, ws, voice together (development)
- `npm run start:all` – start all built services together (production‑like)
- `npm run compose:up` / `npm run compose:down` – Docker Compose stack
- `npm run dev:web|api|ws|voice` – start an individual service
