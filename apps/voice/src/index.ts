import {config} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import * as mediasoup from 'mediasoup';
import {createVoiceServer, type Grant, type RouterLike} from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({path: path.resolve(__dirname, '../../../.env')});

// Fail closed: joins are decided by the API, state goes out through the WebSocket service
const missing = ['INTERNAL_API_SECRET', 'WS_BROADCAST_SECRET'].filter(name => !process.env[name]);
if (missing.length) {
    console.error(`[voice] Missing required environment variables: ${missing.join(', ')}. Aborting startup.`);
    process.exit(1);
}

const APP_URL = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const INTERNAL_AUTH_URL = (process.env.INTERNAL_AUTH_URL || APP_URL).replace(/\/$/, '');
const API_BASE = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
let WS_BASE = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
if (WS_BASE.startsWith('ws://')) WS_BASE = 'http://' + WS_BASE.slice(5);
if (WS_BASE.startsWith('wss://')) WS_BASE = 'https://' + WS_BASE.slice(6);
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET!;
const BROADCAST_SECRET = process.env.WS_BROADCAST_SECRET!;

// Media: the address browsers reach this server on, and the UDP/TCP port range
const ANNOUNCED = process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1';
const MIN_PORT = Number(process.env.MEDIASOUP_MIN_PORT || 40000);
const MAX_PORT = Number(process.env.MEDIASOUP_MAX_PORT || 40100);

const JWKS = createRemoteJWKSet(new URL(`${INTERNAL_AUTH_URL}/api/auth/jwks`));

async function post<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T | null> {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...headers},
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return await res.json() as T;
    } catch (e) {
        console.error(`[voice] call to ${url} failed:`, e);
        return null;
    }
}

const worker = await mediasoup.createWorker({logLevel: 'warn'});
worker.on('died', () => {
    console.error('[voice] mediasoup worker died, exiting');
    process.exit(1);
});

async function createRouter(): Promise<RouterLike> {
    const router = await worker.createRouter({
        mediaCodecs: [{kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2}],
    });
    const listen = (protocol: 'udp' | 'tcp') => ({
        protocol, ip: '0.0.0.0', announcedAddress: ANNOUNCED, portRange: {min: MIN_PORT, max: MAX_PORT},
    });
    return {
        rtpCapabilities: router.rtpCapabilities,
        canConsume: (o) => router.canConsume(o),
        createWebRtcTransport: () => router.createWebRtcTransport({
            listenInfos: [listen('udp'), listen('tcp')],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 600_000,
        }) as any,
        observeSpeakers: (onSpeakers) => {
            const observer = router.createAudioLevelObserver({maxEntries: 10, threshold: -55, interval: 400});
            void observer.then(o => {
                o.on('volumes', (volumes) => onSpeakers(volumes.map(v => v.producer.id)));
                o.on('silence', () => onSpeakers([]));
            });
            return {addProducer: async (producerId) => (await observer).addProducer({producerId})};
        },
        close: () => router.close(),
    };
}

const {httpServer} = createVoiceServer({
    verifyJwt: async (token) => {
        try {
            return (await jwtVerify(token, JWKS, {issuer: APP_URL, audience: APP_URL})).payload;
        } catch {
            return null;
        }
    },
    authorize: async (request) =>
        await post<Grant>(`${API_BASE}/v1/internal/voice/authorize`, request, {Authorization: `Bearer ${INTERNAL_SECRET}`})
        ?? {allowed: false, reason: 'api_unavailable'},
    createRouter,
    // Permanence rooms: every volunteer. Ticket calls: the ticket's channel (assigned volunteer,
    // supervisors who read every ticket), like GET /v1/voice/status. Never any audio.
    publishState: async (state) => {
        const room = state.type === 'ticket' ? state.channelId : null;
        await post(`${WS_BASE}/broadcast`, {room, event: 'voiceState', data: state}, {'x-ws-secret': BROADCAST_SECRET});
    },
    internalSecret: INTERNAL_SECRET,
    corsOrigin: process.env.VOICE_CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '*',
});

process.on('unhandledRejection', (reason) => console.error('[voice] unhandled rejection:', reason));

const PORT = Number(process.env.VOICE_PORT || 3003);
const HOST = process.env.VOICE_HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => console.log(`[voice] listening on http://${HOST}:${PORT}`));
