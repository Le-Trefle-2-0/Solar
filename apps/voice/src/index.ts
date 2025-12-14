import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import * as mediasoup from 'mediasoup';

const app = Fastify({logger: true});

await app.register(cors, {origin: true, credentials: true});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWKS = createRemoteJWKSet(new URL(`${APP_URL}/api/auth/jwks`));

async function verifyAuth(authHeader?: string) {
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: APP_URL,
            audience: APP_URL,
        });
        return payload as any;
    } catch {
        return null;
    }
}

app.get('/health', async () => ({status: 'ok'}));

// --- Mediasoup bootstrap ---
const worker = await mediasoup.createWorker({
    rtcMinPort: Number(process.env.MEDIASOUP_MIN_PORT || 40000),
    rtcMaxPort: Number(process.env.MEDIASOUP_MAX_PORT || 49999),
    logLevel: 'warn',
});

const router = await worker.createRouter({
    mediaCodecs: [
        {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
        },
    ],
});

const transports = new Map<string, mediasoup.types.WebRtcTransport>();
const producers = new Map<string, mediasoup.types.Producer>();
const consumers = new Map<string, mediasoup.types.Consumer>();

function makeId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

app.get('/v1/rtp-capabilities', async (req, reply) => {
    const user = await verifyAuth(req.headers.authorization);
    if (!user) return reply.status(401).send({error: 'unauthorized'});
    return router.rtpCapabilities;
});

app.post('/v1/create-transport', async (req, reply) => {
    const user = await verifyAuth(req.headers.authorization);
    if (!user) return reply.status(401).send({error: 'unauthorized'});
    const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1';
    const transport = await router.createWebRtcTransport({
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp,
            },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 800_000,
    });
    const id = makeId('tr');
    transports.set(id, transport);
    return {
        id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
    };
});

app.post('/v1/connect-transport', async (req, reply) => {
    const user = await verifyAuth(req.headers.authorization);
    if (!user) return reply.status(401).send({error: 'unauthorized'});
    const {transportId, dtlsParameters} = (req.body || {}) as any;
    const transport = transports.get(transportId);
    if (!transport) return reply.status(404).send({error: 'transport_not_found'});
    await transport.connect({dtlsParameters});
    return {ok: true};
});

app.post('/v1/produce', async (req, reply) => {
    const user = await verifyAuth(req.headers.authorization);
    if (!user) return reply.status(401).send({error: 'unauthorized'});
    const {transportId, kind, rtpParameters} = (req.body || {}) as any;
    const transport = transports.get(transportId);
    if (!transport) return reply.status(404).send({error: 'transport_not_found'});
    const producer = await transport.produce({kind, rtpParameters});
    const id = makeId('pr');
    producers.set(id, producer);
    return {id};
});

app.post('/v1/consume', async (req, reply) => {
    const user = await verifyAuth(req.headers.authorization);
    if (!user) return reply.status(401).send({error: 'unauthorized'});
    const {transportId, producerId, rtpCapabilities} = (req.body || {}) as any;
    const transport = transports.get(transportId);
    const producer = producers.get(producerId);
    if (!transport || !producer) return reply.status(404).send({error: 'not_found'});
    if (!router.canConsume({producerId: producer.id, rtpCapabilities})) {
        return reply.status(400).send({error: 'incompatible_rtp_capabilities'});
    }
    const consumer = await transport.consume({producerId: producer.id, rtpCapabilities});
    const id = makeId('cs');
    consumers.set(id, consumer);
    return {
        id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
    };
});

const port = Number(process.env.VOICE_PORT || 6000);
const host = process.env.VOICE_HOST || '0.0.0.0';

app
    .listen({port, host})
    .then(() => app.log.info(`Voice listening on http://${host}:${port}`))
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });
