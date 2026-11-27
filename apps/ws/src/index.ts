import {config} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import Redis from 'ioredis';
import {createAdapter} from '@socket.io/redis-adapter';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {createWsServer, type WsSession} from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({path: path.resolve(__dirname, '../../../.env')});

// Fail closed: guest signatures, API calls and /broadcast depend on these
const missingSecrets = ['WS_GUEST_SECRET', 'INTERNAL_API_SECRET', 'WS_BROADCAST_SECRET'].filter(name => !process.env[name]);
if (missingSecrets.length) {
    console.error(`[ws] Missing required environment variables: ${missingSecrets.join(', ')}. Aborting startup.`);
    process.exit(1);
}

const PORT = Number(process.env.WS_PORT || 5000);
const HOST = process.env.WS_HOST || '0.0.0.0';
// Better Auth JWKS lives on the web app; keep issuer public and JWKS fetch internal when available
const AUTH_ISSUER = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('[ws] BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL is not set, falling back to http://localhost:3000');
}
const INTERNAL_AUTH_URL = (process.env.INTERNAL_AUTH_URL || AUTH_ISSUER).replace(/\/$/, '');
const API_BASE = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
if (!process.env.API_BASE_URL) {
    console.warn('[ws] API_BASE_URL is not set, falling back to http://localhost:3001');
}
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET!;

const JWKS = createRemoteJWKSet(new URL(`${INTERNAL_AUTH_URL}/api/auth/jwks`));

async function verifyJwt(token: string) {
    try {
        const {payload} = await jwtVerify(token, JWKS, {issuer: AUTH_ISSUER, audience: AUTH_ISSUER});
        return payload;
    } catch (e: any) {
        console.warn('[ws] JWT verification failed:', e?.message);
        // Optionally relax JWT checks in environments where APP_URL mismatches
        if ((process.env.WS_RELAX_JWT || '').toLowerCase() === 'true') {
            try {
                return (await jwtVerify(token, JWKS)).payload;
            } catch {
                return null;
            }
        }
        return null;
    }
}

/** POST to an internal API route with INTERNAL_API_SECRET; null when refused or unreachable. */
async function internalPost<T>(route: string, body: unknown): Promise<T | null> {
    try {
        const res = await fetch(`${API_BASE}${route}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${INTERNAL_SECRET}`},
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return await res.json() as T;
    } catch (e) {
        console.error(`[ws] internal call ${route} failed:`, e);
        return null;
    }
}

const {httpServer, io, enableCluster} = createWsServer({
    verifyJwt,
    checkApiKey: async (key) => {
        const data = await internalPost<{valid?: boolean; user?: {id: string}}>('/v1/keys/check', {key});
        // A socket that shows an API key is treated as the bot: only the bot account's keys
        // qualify, never a key a volunteer made for their own account (same rule as the
        // API's isBotAccount)
        return data?.valid && data.user?.id?.startsWith('bot_') ? {userId: data.user.id} : null;
    },
    getSession: (userId, sid) => internalPost<WsSession>('/v1/internal/ws/session', {userId, sid}),
    // Nothing is relayed when the API cannot answer
    getStoredMessage: (userId, channelId, id) =>
        internalPost<{content: string; replyID: number | null}>('/v1/internal/ws/message', {userId, channelId, id}),
    // Fail closed when the API cannot answer
    getChannelAccess: async (userId, channelId) =>
        await internalPost<{read: boolean; write: boolean}>('/v1/internal/ws/channel-access', {userId, channelId})
        ?? {read: false, write: false},
    secrets: {
        guest: process.env.WS_GUEST_SECRET!,
        broadcast: process.env.WS_BROADCAST_SECRET!,
        internal: INTERNAL_SECRET,
    },
    corsOrigin: process.env.WS_CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '*',
    // Fail closed: without an answer from the API, visitors do not connect
    widgetEnabled: async () => (await internalPost<{enabled: boolean}>('/v1/internal/ws/widget', {}))?.enabled === true,
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',').map(s => s.trim()).filter(Boolean),
});

// Optional Redis scale-out
if (process.env.REDIS_URL) {
    const pub = new Redis(process.env.REDIS_URL);
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    // Revocations and reassignments are re-checked on every instance, not only the one that
    // received the broadcast
    enableCluster();
}

// Last line of defence: log instead of crashing on a stray rejected promise (#239)
process.on('unhandledRejection', (reason) => {
    console.error('[ws] unhandled rejection:', reason);
});

httpServer.listen(PORT, HOST, () => {
    console.log(`WS listening on http://${HOST}:${PORT}`);
});
