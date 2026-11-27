import {createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse} from 'http';
import {Server, type Socket} from 'socket.io';
import {timingSafeEqual, createHash} from 'crypto';

/**
 * Voice service (#78). Audio always goes through this server (SFU): participants never learn
 * each other's address (#255). Two kinds of rooms:
 * - permanence: a multi-user voice channel tied to a permanence, open to every member;
 * - ticket: a one-to-one call between the volunteer handling a voice ticket and its visitor.
 * Who may join is always decided by the API (/v1/internal/voice/authorize).
 */

// ---- the mediasoup surface this service uses (injected, so tests can fake it) ----
export interface ProducerLike {
    id: string;
    paused: boolean;
    pause(): Promise<void>;
    resume(): Promise<void>;
    close(): void;
}

export interface ConsumerLike {
    id: string;
    kind: string;
    rtpParameters: unknown;
    type: string;
    producerPaused: boolean;
    resume(): Promise<void>;
    close(): void;
    on(event: 'producerclose' | 'transportclose', cb: () => void): void;
}

export interface TransportLike {
    id: string;
    iceParameters: unknown;
    iceCandidates: unknown;
    dtlsParameters: unknown;
    connect(o: {dtlsParameters: any}): Promise<void>;
    produce(o: {kind: 'audio'; rtpParameters: any; appData?: Record<string, unknown>}): Promise<ProducerLike>;
    consume(o: {producerId: string; rtpCapabilities: any; paused: boolean}): Promise<ConsumerLike>;
    close(): void;
}

export interface RouterLike {
    rtpCapabilities: unknown;
    canConsume(o: {producerId: string; rtpCapabilities: any}): boolean;
    createWebRtcTransport(): Promise<TransportLike>;
    /** Calls back with the ids of producers currently speaking (optional). */
    observeSpeakers?(onSpeakers: (producerIds: string[]) => void): {addProducer(id: string): Promise<void>};
    close(): void;
}

export type RoomType = 'permanence' | 'ticket';
export type Grant = {allowed: true; role: 'volunteer' | 'visitor'; userId: string | null; name: string} | {allowed: false; reason: string};

/** What volunteers see about a room, through the WebSocket service (room-less "voiceState"). */
export type RoomState =
    | {type: 'permanence'; channelId: string; participants: {peerId: string; name: string; muted: boolean}[]}
    | {type: 'ticket'; channelId: string; volunteer: boolean; visitor: boolean};

export interface VoiceDeps {
    verifyJwt(token: string): Promise<{sub?: string; sid?: unknown} | null>;
    authorize(request: {room: {type: RoomType; channelId: string}; userId?: string; sid?: unknown; token?: unknown}): Promise<Grant>;
    createRouter(): Promise<RouterLike>;
    publishState(state: RoomState): Promise<void>;
    internalSecret: string;
    corsOrigin?: string;
    log?: Pick<Console, 'log' | 'warn' | 'error'>;
}

const CHANNEL_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const isId = (v: unknown): v is string => typeof v === 'string' && ID_RE.test(v);
export const MAX_PERMANENCE_PEERS = 25;

/** Per connection: a burst of EVENT_BURST events, then EVENT_RATE per second (as in the realtime service). */
export const EVENT_BURST = 30;
export const EVENT_RATE = 10;
/** Dropped events before the connection is closed. */
export const MAX_DROPPED_EVENTS = 200;
/** Joins per connection and per minute: each one asks the API, which does not rate-limit us. */
export const MAX_JOINS_PER_MINUTE = 10;

/** A visitor voice token as the API issues it (signature checked by the API at join). */
export function isWellFormedVoiceToken(token: unknown, now = Date.now()): boolean {
    if (!token || typeof token !== 'object') return false;
    const {channelId, exp, t} = token as Record<string, unknown>;
    const expiry = Number(exp);
    return typeof channelId === 'string' && CHANNEL_RE.test(channelId)
        && Number.isFinite(expiry) && expiry > now && expiry <= now + 60 * 60 * 1000
        && typeof t === 'string' && /^[a-f0-9]{64}$/.test(t);
}

/** Name shown to the other side of a ticket call: neither learns who the other is. */
const ticketAlias = (role: 'volunteer' | 'visitor') => (role === 'volunteer' ? 'Bénévole Écoutant' : 'Visiteur');

interface Peer {
    id: string;
    socket: Socket;
    role: 'volunteer' | 'visitor';
    userId: string | null;
    name: string;
    muted: boolean;
    transports: Map<string, TransportLike>;
    producer: ProducerLike | null;
    consumers: Map<string, ConsumerLike>;
}

interface Room {
    key: string;
    type: RoomType;
    channelId: string;
    router: RouterLike;
    peers: Map<string, Peer>;
    speakers?: {addProducer(id: string): Promise<void>};
}

const safeEqual = (a: string, b: string) => {
    if (!b) return false;
    const h = (s: string) => createHash('sha256').update(s).digest();
    return timingSafeEqual(h(a), h(b));
};

export function createVoiceServer(deps: VoiceDeps): {httpServer: HttpServer; io: Server; rooms: Map<string, Room>} {
    const log = deps.log ?? console;
    const httpServer = createServer();
    const corsOrigin = deps.corsOrigin || '*';
    const io = new Server(httpServer, {
        cors: {origin: corsOrigin === '*' ? true : corsOrigin.split(','), credentials: true},
        maxHttpBufferSize: 64 * 1024,
    });
    const rooms = new Map<string, Room>();
    const peerOf = new Map<string, {room: Room; peer: Peer}>(); // socket id -> membership

    const keyOf = (type: RoomType, channelId: string) => `${type}:${channelId}`;

    /** Name of `peer` as seen by `viewer`. */
    const shownName = (room: Room, peer: Peer, viewer: Peer) =>
        room.type === 'ticket' && peer.role !== viewer.role ? ticketAlias(peer.role) : peer.name;

    const describe = (room: Room, peer: Peer, viewer: Peer) => ({
        peerId: peer.id,
        name: shownName(room, peer, viewer),
        muted: peer.muted,
        producerId: peer.producer?.id ?? null,
    });

    function stateOf(room: Room): RoomState {
        const peers = [...room.peers.values()];
        return room.type === 'permanence'
            ? {type: 'permanence', channelId: room.channelId, participants: peers.map(p => ({peerId: p.id, name: p.name, muted: p.muted}))}
            : {type: 'ticket', channelId: room.channelId, volunteer: peers.some(p => p.role === 'volunteer'), visitor: peers.some(p => p.role === 'visitor')};
    }

    async function publish(room: Room) {
        try {
            await deps.publishState(stateOf(room));
        } catch (e) {
            log.error('[voice] publish failed', e);
        }
    }

    function leave(socket: Socket) {
        const member = peerOf.get(socket.id);
        if (!member) return;
        const {room, peer} = member;
        peerOf.delete(socket.id);
        room.peers.delete(peer.id);
        for (const t of peer.transports.values()) {
            try {
                t.close(); // also closes its producer and consumers
            } catch {
                // already closed
            }
        }
        socket.leave(room.key);
        io.to(room.key).emit('peerLeft', {peerId: peer.id});
        if (room.peers.size === 0) {
            rooms.delete(room.key);
            try {
                room.router.close();
            } catch {
                // already closed
            }
        }
        void publish(room);
    }

    /** Ends a call for everyone in it. Returns whether the room existed. */
    function closeRoom(key: string): boolean {
        const room = rooms.get(key);
        if (!room) return false;
        io.to(room.key).emit('roomClosed', {});
        for (const peer of [...room.peers.values()]) {
            leave(peer.socket);
            peer.socket.disconnect(true);
        }
        return true;
    }

    // ---- authentication: volunteer JWT, or a visitor voice token (checked again at join) ----
    io.use(async (socket, next) => {
        try {
            const auth = (socket.handshake.auth ?? {}) as Record<string, unknown>;
            if (typeof auth.jwt === 'string' && auth.jwt.length <= 8192) {
                const payload = await deps.verifyJwt(auth.jwt);
                if (isId(payload?.sub)) {
                    socket.data.userId = payload!.sub;
                    // Checked by the API at each join: signing out ends voice access too (#276)
                    socket.data.sid = payload!.sid;
                    return next();
                }
            }
            // Malformed or expired tokens are refused here, without asking the API
            if (isWellFormedVoiceToken(auth.voiceToken)) {
                socket.data.voiceToken = auth.voiceToken;
                return next();
            }
        } catch (e) {
            log.error('[voice] auth error', e);
        }
        next(new Error('Authentication error'));
    });

    io.on('connection', (socket) => {
        // Token bucket per connection: a flood of events is cut down, then the connection closed
        let tokens = EVENT_BURST;
        let refilledAt = Date.now();
        let dropped = 0;
        const allowEvent = () => {
            const now = Date.now();
            tokens = Math.min(EVENT_BURST, tokens + ((now - refilledAt) / 1000) * EVENT_RATE);
            refilledAt = now;
            if (tokens >= 1) {
                tokens -= 1;
                return true;
            }
            if (++dropped >= MAX_DROPPED_EVENTS) socket.disconnect(true);
            return false;
        };
        const joins: number[] = [];
        const allowJoin = (now = Date.now()) => {
            while (joins.length && now - joins[0] >= 60_000) joins.shift();
            if (joins.length >= MAX_JOINS_PER_MINUTE) return false;
            joins.push(now);
            return true;
        };

        const on = (event: string, handler: (payload: any, ack: (r: unknown) => void) => unknown) => {
            socket.on(event, async (...args: unknown[]) => {
                const last = args[args.length - 1];
                const ack = typeof last === 'function' ? (args.pop() as (r: unknown) => void) : () => undefined;
                if (!allowEvent()) {
                    try {
                        ack({error: 'rate_limited'});
                    } catch {
                        // nothing else to do
                    }
                    return;
                }
                try {
                    await handler(args[0], ack);
                } catch (e) {
                    log.error(`[voice] ${event} failed`, e);
                    try {
                        ack({error: 'internal_error'});
                    } catch {
                        // nothing else to do
                    }
                }
            });
        };
        const member = () => peerOf.get(socket.id);

        on('join', async (payload, ack) => {
            const type = payload?.room?.type;
            const channelId = payload?.room?.channelId;
            if ((type !== 'permanence' && type !== 'ticket') || typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) {
                return ack({error: 'invalid_room'});
            }
            if (!allowJoin()) return ack({error: 'rate_limited'});
            const grant = await deps.authorize({
                room: {type, channelId},
                ...(socket.data.userId ? {userId: socket.data.userId, sid: socket.data.sid} : {token: socket.data.voiceToken}),
            });
            if (!grant.allowed) return ack({error: grant.reason});

            if (member()) leave(socket);
            const key = keyOf(type, channelId);
            const existing = rooms.get(key);
            const others = existing ? [...existing.peers.values()] : [];
            // A ticket call is one volunteer and one visitor; a user joins only once
            if (type === 'ticket' && others.some(p => p.role === grant.role)) return ack({error: 'room_full'});
            if (type === 'permanence' && others.length >= MAX_PERMANENCE_PEERS) return ack({error: 'room_full'});
            if (grant.userId && others.some(p => p.userId === grant.userId)) return ack({error: 'already_connected'});

            let room = existing;
            if (!room) {
                room = {key, type, channelId, router: await deps.createRouter(), peers: new Map()};
                const created = room;
                created.speakers = created.router.observeSpeakers?.((producerIds) => {
                    const speaking = [...created.peers.values()].filter(p => p.producer && producerIds.includes(p.producer.id)).map(p => p.id);
                    io.to(created.key).emit('speaking', {peerIds: speaking});
                });
                rooms.set(key, room);
            }
            const peer: Peer = {
                id: socket.id, socket, role: grant.role, userId: grant.userId, name: grant.name,
                muted: false, transports: new Map(), producer: null, consumers: new Map(),
            };
            room.peers.set(peer.id, peer);
            peerOf.set(socket.id, {room, peer});
            socket.join(key);

            for (const other of room.peers.values()) {
                if (other !== peer) other.socket.emit('peerJoined', describe(room, peer, other));
            }
            ack({
                rtpCapabilities: room.router.rtpCapabilities,
                self: {peerId: peer.id, role: peer.role},
                peers: [...room.peers.values()].filter(p => p !== peer).map(p => describe(room!, p, peer)),
            });
            void publish(room);
        });

        on('createTransport', async (_payload, ack) => {
            const m = member();
            if (!m) return ack({error: 'not_in_room'});
            if (m.peer.transports.size >= 2) return ack({error: 'too_many_transports'});
            const t = await m.room.router.createWebRtcTransport();
            m.peer.transports.set(t.id, t);
            ack({id: t.id, iceParameters: t.iceParameters, iceCandidates: t.iceCandidates, dtlsParameters: t.dtlsParameters});
        });

        on('connectTransport', async (payload, ack) => {
            const t = member()?.peer.transports.get(payload?.transportId);
            if (!t || !payload?.dtlsParameters || typeof payload.dtlsParameters !== 'object') return ack({error: 'invalid_transport'});
            await t.connect({dtlsParameters: payload.dtlsParameters});
            ack({ok: true});
        });

        on('produce', async (payload, ack) => {
            const m = member();
            const t = m?.peer.transports.get(payload?.transportId);
            if (!m || !t) return ack({error: 'invalid_transport'});
            if (payload.kind !== 'audio') return ack({error: 'audio_only'});
            if (m.peer.producer) return ack({error: 'already_producing'});
            if (!payload.rtpParameters || typeof payload.rtpParameters !== 'object') return ack({error: 'invalid_parameters'});
            const producer = await t.produce({kind: 'audio', rtpParameters: payload.rtpParameters});
            m.peer.producer = producer;
            await m.room.speakers?.addProducer(producer.id).catch(() => undefined);
            socket.to(m.room.key).emit('newProducer', {peerId: m.peer.id, producerId: producer.id});
            ack({id: producer.id});
        });

        on('consume', async (payload, ack) => {
            const m = member();
            const t = m?.peer.transports.get(payload?.transportId);
            if (!m || !t) return ack({error: 'invalid_transport'});
            // Only producers of the same room, never one's own
            const source = [...m.room.peers.values()].find(p => p !== m.peer && p.producer?.id === payload?.producerId);
            if (!source?.producer) return ack({error: 'unknown_producer'});
            if (!m.room.router.canConsume({producerId: source.producer.id, rtpCapabilities: payload.rtpCapabilities})) {
                return ack({error: 'incompatible'});
            }
            const consumer = await t.consume({producerId: source.producer.id, rtpCapabilities: payload.rtpCapabilities, paused: true});
            m.peer.consumers.set(consumer.id, consumer);
            const drop = () => {
                m.peer.consumers.delete(consumer.id);
                socket.emit('consumerClosed', {consumerId: consumer.id});
            };
            consumer.on('producerclose', drop);
            consumer.on('transportclose', () => m.peer.consumers.delete(consumer.id));
            ack({
                id: consumer.id, producerId: source.producer.id, peerId: source.id,
                kind: consumer.kind, rtpParameters: consumer.rtpParameters,
            });
        });

        on('resumeConsumer', async (payload, ack) => {
            const c = member()?.peer.consumers.get(payload?.consumerId);
            if (!c) return ack({error: 'unknown_consumer'});
            await c.resume();
            ack({ok: true});
        });

        on('setMuted', async (payload, ack) => {
            const m = member();
            if (!m || typeof payload?.muted !== 'boolean') return ack({error: 'invalid'});
            m.peer.muted = payload.muted;
            if (m.peer.producer) await (payload.muted ? m.peer.producer.pause() : m.peer.producer.resume());
            io.to(m.room.key).emit('peerMuted', {peerId: m.peer.id, muted: m.peer.muted});
            ack({ok: true});
            void publish(m.room);
        });

        on('leave', (_payload, ack) => {
            leave(socket);
            ack({ok: true});
        });

        socket.on('disconnect', () => leave(socket));
    });

    // ---- HTTP: health, and the state of every room for the API (internal secret) ----
    httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
        const raw = req.url || '';
        if (raw.startsWith('/socket.io')) return;
        const send = (status: number, body: unknown) => {
            if (res.headersSent) return;
            res.statusCode = status;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(body));
        };
        try {
            const path = raw.split('?')[0];
            if (req.method === 'GET' && path === '/health') return send(200, {ok: true});
            const internal = () => {
                const h = req.headers.authorization;
                const token = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
                return safeEqual(token, deps.internalSecret);
            };
            if (req.method === 'GET' && path === '/internal/status') {
                if (!internal()) return send(401, {error: 'unauthorized'});
                return send(200, {rooms: [...rooms.values()].map(stateOf)});
            }
            // The API ends a call (volunteer ended it, or the écoute was closed): everyone leaves
            if (req.method === 'POST' && path === '/internal/rooms/close') {
                if (!internal()) return send(401, {error: 'unauthorized'});
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk;
                    if (body.length > 4096) req.destroy();
                });
                req.on('end', () => {
                    try {
                        const {type, channelId} = JSON.parse(body || '{}');
                        if ((type !== 'ticket' && type !== 'permanence') || typeof channelId !== 'string' || !CHANNEL_RE.test(channelId)) {
                            return send(400, {error: 'invalid_room'});
                        }
                        send(200, {closed: closeRoom(keyOf(type, channelId))});
                    } catch {
                        send(400, {error: 'bad_json'});
                    }
                });
                return;
            }
            send(404, {error: 'not_found'});
        } catch (e) {
            log.error('[voice] http failed', e);
            send(500, {error: 'internal_error'});
        }
    });

    return {httpServer, io, rooms};
}
