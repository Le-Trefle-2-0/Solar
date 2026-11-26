import {createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse} from 'http';
import {Server, type Socket} from 'socket.io';
import {createHmac} from 'crypto';
import {safeEqual} from './lib/safeEqual.js';

/**
 * Realtime service. Access is never decided here: the API says who a volunteer is and which
 * channels they may read or write (#213, #214). Every handler validates its input and is
 * wrapped so a malformed event cannot bring the service down (#239).
 */

export interface WsUser {
    id: string;
    username: string;
    image: string | null;
    role: string | null;
}

export interface WsSession {
    user: WsUser;
    /** tickets.read_all: receives every channel's events. */
    readAll: boolean;
    /** Channels followed from the start (public channel, assigned tickets). */
    channels: string[];
}

export interface WsDeps {
    verifyJwt: (token: string) => Promise<{sub?: string} | null>;
    /** API key of a bot account; resolves to its user id. */
    checkApiKey: (key: string) => Promise<{userId: string} | null>;
    getSession: (userId: string) => Promise<WsSession | null>;
    getChannelAccess: (userId: string, channelId: string) => Promise<{read: boolean; write: boolean}>;
    secrets: {guest: string; broadcast: string; internal: string};
    corsOrigin?: string;
    log?: Pick<Console, 'log' | 'warn' | 'error'>;
}

// Rooms used by the service itself: never joinable through `listen`.
export const VOLUNTEERS = 'volunteers';
export const READERS = 'readers';
export const BOTS = 'bots';
const userRoom = (id: string) => `user:${id}`;
const RESERVED = new Set([VOLUNTEERS, READERS, BOTS]);

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const isChannelId = (v: unknown): v is string => typeof v === 'string' && ROOM_RE.test(v) && !RESERVED.has(v);

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_SOCKET_PAYLOAD = 256 * 1024;
export const MAX_BROADCAST_BODY = 1024 * 1024;

const neutralizeHtml = (s: string) => s.replace(/<(?=[a-zA-Z!/?])/g, '<​');

type Kind = 'volunteer' | 'bot' | 'guest';
interface SocketData {
    kind: Kind;
    userId?: string;
    user?: WsUser;
    readAll?: boolean;
    botUserId?: string;
    allowedRoom?: string;
    guestUid?: string;
    /** Channel rights checked with the API, per channel. */
    access?: Map<string, {read: boolean; write: boolean}>;
}

const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;

/** HMAC of the widget guest credentials; the signature is compared in constant time. */
export function signGuest(secret: string, channelId: string, uid: string, exp: number) {
    return createHmac('sha256', secret).update(`${channelId}.${uid}.${exp}`).digest('hex');
}

export function createWsServer(deps: WsDeps): {httpServer: HttpServer; io: Server} {
    const log = deps.log ?? console;
    const httpServer = createServer();
    const corsOrigin = deps.corsOrigin || '*';
    const io = new Server(httpServer, {
        cors: {origin: corsOrigin === '*' ? true : corsOrigin.split(','), credentials: true},
        maxHttpBufferSize: MAX_SOCKET_PAYLOAD,
    });

    const data = (socket: Socket) => socket.data as SocketData;

    async function accessFor(socket: Socket, room: string, fresh = false) {
        const d = data(socket);
        if (d.kind === 'guest') return {read: room === d.allowedRoom, write: false};
        const userId = d.kind === 'bot' ? d.botUserId! : d.userId!;
        d.access ??= new Map();
        if (!fresh && d.access.has(room)) return d.access.get(room)!;
        const access = await deps.getChannelAccess(userId, room);
        d.access.set(room, access);
        return access;
    }

    function publicUser(socket: Socket): WsUser | null {
        return data(socket).user ?? null;
    }

    // ---- authentication ----
    io.use(async (socket, next) => {
        try {
            const auth = (socket.handshake.auth ?? {}) as Record<string, unknown>;
            const d = data(socket);

            const jwt = str(auth.jwt, 8192);
            if (jwt) {
                const payload = await deps.verifyJwt(jwt);
                const userId = str(payload?.sub, 128);
                const session = userId ? await deps.getSession(userId) : null;
                if (userId && session) {
                    Object.assign(d, {kind: 'volunteer', userId, user: session.user, readAll: session.readAll, access: new Map()});
                    (socket as any).__initialChannels = session.channels;
                    return next();
                }
            }

            const apiKey = str(auth.token, 512);
            if (apiKey) {
                const bot = await deps.checkApiKey(apiKey);
                if (bot?.userId) {
                    Object.assign(d, {kind: 'bot', botUserId: bot.userId, access: new Map()});
                    return next();
                }
            }

            const guest = auth.guest as Record<string, unknown> | undefined;
            if (guest && typeof guest === 'object') {
                const uid = str(guest.uid, 128);
                const channelId = isChannelId(guest.channelId) ? guest.channelId : null;
                const exp = typeof guest.exp === 'number' ? guest.exp : Number(guest.exp);
                const sig = str(guest.sig, 128);
                if (uid && channelId && Number.isFinite(exp) && exp > Date.now() && sig
                    && safeEqual(sig, signGuest(deps.secrets.guest, channelId, uid, exp))) {
                    Object.assign(d, {kind: 'guest', allowedRoom: channelId, guestUid: uid});
                    return next();
                }
            }
        } catch (e) {
            log.error('[ws] auth error', e);
        }
        next(new Error('Authentication error'));
    });

    io.on('connection', (socket) => {
        const d = data(socket);

        /** Registers a handler that cannot throw and always gets a callable ack. */
        const on = (event: string, handler: (payload: any, ack: (...args: unknown[]) => void) => unknown) => {
            socket.on(event, async (...args: unknown[]) => {
                const last = args[args.length - 1];
                const ack = typeof last === 'function' ? (args.pop() as (...a: unknown[]) => void) : () => undefined;
                try {
                    await handler(args[0], ack);
                } catch (e) {
                    log.error(`[ws] handler ${event} failed`, e);
                    try {
                        ack(false);
                    } catch {
                        // nothing else to do
                    }
                }
            });
        };

        if (d.kind === 'volunteer') {
            socket.join([VOLUNTEERS, userRoom(d.userId!)]);
            if (d.readAll) socket.join(READERS);
            // Channels the API listed for this user (write rights are checked on first send)
            for (const room of ((socket as any).__initialChannels as string[] ?? []).filter(isChannelId)) {
                socket.join(room);
            }
        }
        if (d.kind === 'bot') socket.join(BOTS);

        on('ping', (_p, ack) => ack());
        on('heartbeat', () => socket.emit('heartbeat'));

        on('listen', async (payload, ack) => {
            const room = payload?.id;
            if (!isChannelId(room)) return ack(false);
            if (!(await accessFor(socket, room)).read) {
                log.warn('[ws] refused listen', socket.id, room);
                return ack(false);
            }
            socket.join(room);
            const user = publicUser(socket);
            if (user) io.to(room).emit('userJoined', {channelId: room, user});
            ack(true);
        });

        on('leave', (payload) => {
            const room = payload?.id;
            if (!isChannelId(room) || !socket.rooms.has(room)) return;
            socket.leave(room);
            const user = publicUser(socket);
            if (user) io.to(room).emit('userLeft', {channelId: room, user});
        });

        // Who is in a channel: members only, never visitors
        on('getOnlineUsers', async (payload, ack) => {
            const room = payload?.channelID;
            if (d.kind === 'guest' || !isChannelId(room) || !socket.rooms.has(room)) return ack([]);
            const sockets = await io.in(room).fetchSockets();
            const seen = new Set<string>();
            const users = sockets
                .map(s => (s.data as SocketData).user)
                .filter((u): u is WsUser => !!u && !seen.has(u.id) && !!seen.add(u.id));
            ack(users);
        });

        // Relay of a message already saved through the API or the web action. The author and
        // timestamp are set here; content is checked and neutralised like in the API.
        on('sendMessage', async (payload, ack) => {
            if (d.kind !== 'volunteer') return ack(false);
            const room = payload?.channel?.id;
            const content = payload?.content;
            if (!isChannelId(room) || !socket.rooms.has(room)) return ack(false);
            if (typeof content !== 'string' || !content.length || content.length > MAX_MESSAGE_LENGTH) return ack(false);
            if (!(await accessFor(socket, room)).write) return ack(false);

            const id = typeof payload.id === 'number' && Number.isInteger(payload.id) ? payload.id : null;
            const replyID = typeof payload.replyID === 'number' && Number.isInteger(payload.replyID) ? payload.replyID : null;
            io.to(room).to(READERS).emit('message', {
                id,
                author: d.user,
                content: neutralizeHtml(content),
                timestamp: Date.now(),
                channel: {id: room},
                discordID: null,
                reactions: [],
                replyID,
                edited: false,
            });
            ack(true);
        });

        on('typing', (payload) => {
            const room = payload?.id;
            if (!isChannelId(room) || !socket.rooms.has(room)) return;
            const user = d.kind === 'guest' ? {id: d.guestUid, name: 'Visiteur', image: null} : d.user
                ? {id: d.user.id, name: d.user.username, image: d.user.image} : null;
            if (user) socket.to(room).emit('typingIndicator', {id: room, user});
        });

        // Re-read identity and followed channels (after an assignment or a role change)
        on('syncRooms', async () => {
            if (d.kind !== 'volunteer') return;
            await refreshVolunteer(socket);
        });

        // Bot presence: only for sockets authenticated with a bot API key (#216)
        on('bot:checkin', () => {
            if (d.kind !== 'bot') return;
            socket.join(BOTS);
            log.log(`[ws] bot checked in: ${d.botUserId}`);
        });

        socket.on('disconnecting', () => {
            const user = publicUser(socket);
            if (!user) return;
            for (const room of socket.rooms) {
                if (isChannelId(room)) io.to(room).emit('userLeft', {channelId: room, user});
            }
        });
    });

    /** Re-checks a volunteer socket against the API: identity, read-all, followed and joined channels. */
    async function refreshVolunteer(socket: Socket) {
        const d = data(socket);
        const session = await deps.getSession(d.userId!);
        if (!session) {
            socket.disconnect(true);
            return;
        }
        d.user = session.user;
        d.readAll = session.readAll;
        d.access = new Map();
        if (session.readAll) socket.join(READERS);
        else socket.leave(READERS);
        for (const room of [...socket.rooms]) {
            if (!isChannelId(room)) continue;
            if (!(await accessFor(socket, room, true)).read) socket.leave(room);
        }
        for (const room of session.channels.filter(isChannelId)) socket.join(room);
    }

    /** After an assignment change, drop members who lost access to the channel. */
    async function recheckRoom(room: string) {
        for (const s of await io.in(room).fetchSockets()) {
            const socket = io.sockets.sockets.get(s.id);
            if (!socket || data(socket).kind === 'guest') continue;
            try {
                if (!(await accessFor(socket, room, true)).read) socket.leave(room);
            } catch (e) {
                log.error('[ws] recheck failed', e);
            }
        }
    }

    async function refreshAllVolunteers() {
        for (const socket of io.sockets.sockets.values()) {
            if (data(socket).kind !== 'volunteer') continue;
            try {
                await refreshVolunteer(socket);
            } catch (e) {
                log.error('[ws] refresh failed', e);
            }
        }
    }

    // ---- HTTP: health, bot status, server-to-server broadcast ----
    const send = (res: ServerResponse, status: number, body: unknown) => {
        if (res.headersSent) return;
        res.statusCode = status;
        if (typeof body === 'string') res.end(body);
        else {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(body));
        }
    };

    const bearer = (req: IncomingMessage) => {
        const h = req.headers.authorization;
        return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
    };

    httpServer.on('request', async (req: IncomingMessage, res: ServerResponse) => {
        try {
            const raw = req.url || '';
            // Socket.IO answers its own paths (checked on the raw URL: "/socket.io/../health"
            // must not be answered twice)
            if (raw.startsWith('/socket.io')) return;

            let url: URL;
            try {
                // The Host header is not trusted for parsing
                url = new URL(raw, 'http://localhost');
            } catch {
                return send(res, 400, 'bad request');
            }

            if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, {ok: true});

            // Internal: asked by the API, with INTERNAL_API_SECRET (#216)
            if (req.method === 'GET' && url.pathname === '/bot-status') {
                if (!safeEqual(bearer(req), deps.secrets.internal)) return send(res, 401, 'unauthorized');
                const botUserId = url.searchParams.get('userId');
                if (!botUserId || botUserId.length > 128) return send(res, 400, 'missing userId');
                const sockets = await io.in(BOTS).fetchSockets();
                return send(res, 200, {isConnected: sockets.some(s => (s.data as SocketData).botUserId === botUserId)});
            }

            if (req.method === 'POST' && url.pathname === '/broadcast') {
                const provided = req.headers['x-ws-secret'];
                if (typeof provided !== 'string' || !safeEqual(provided, deps.secrets.broadcast)) return send(res, 401, 'unauthorized');

                let body = '';
                let tooLarge = false;
                req.on('data', (chunk) => {
                    if (tooLarge) return;
                    body += chunk;
                    if (body.length > MAX_BROADCAST_BODY) {
                        tooLarge = true;
                        send(res, 413, 'payload too large');
                        req.destroy();
                    }
                });
                req.on('error', () => send(res, 400, 'bad request'));
                req.on('end', async () => {
                    if (tooLarge) return;
                    try {
                        const payload = JSON.parse(body || '{}');
                        const room = payload.room ?? payload.channelId ?? payload.channel ?? null;
                        const event = payload.event ?? 'message';
                        const eventData = payload.data;
                        if (typeof event !== 'string' || !event || event.length > 64 || typeof eventData === 'undefined') {
                            return send(res, 400, 'invalid payload');
                        }
                        if (room === null || room === '') {
                            // Room-less events are notifications (ids, statuses), for volunteers
                            io.to(VOLUNTEERS).emit(event, eventData);
                        } else if (isChannelId(room)) {
                            // Channel content: members of the channel and those who may read every ticket
                            io.to(room).to(READERS).emit(event, eventData);
                        } else {
                            return send(res, 400, 'invalid room');
                        }
                        send(res, 200, {success: true});

                        // Keep room membership in line with assignments and roles
                        if (event === 'updateRequest' && isChannelId(eventData?.channelId)) await recheckRoom(eventData.channelId);
                        if (event === 'permissionsUpdate') await refreshAllVolunteers();
                    } catch {
                        send(res, 400, 'bad json');
                    }
                });
                return;
            }

            send(res, 404, 'not found');
        } catch (e) {
            log.error('[ws] http handler failed', e);
            send(res, 500, 'error');
        }
    });

    return {httpServer, io};
}
