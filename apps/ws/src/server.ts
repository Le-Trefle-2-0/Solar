import {createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse} from 'http';
import {Server, type Socket} from 'socket.io';
import {createHmac} from 'crypto';
import {safeEqual} from './lib/safeEqual.js';
import {visitorView} from './visitorView.js';

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
    verifyJwt: (token: string) => Promise<{sub?: string; sid?: unknown} | null>;
    /** API key of a bot account; resolves to its user id. */
    checkApiKey: (key: string) => Promise<{userId: string} | null>;
    /** Null when the account may not connect, or its Better Auth session `sid` was closed (#276). */
    getSession: (userId: string, sid: unknown) => Promise<WsSession | null>;
    getChannelAccess: (userId: string, channelId: string) => Promise<{read: boolean; write: boolean}>;
    /**
     * The message `id` this user saved in the channel a moment ago, while its écoute is open:
     * only stored messages are relayed, with their stored content. Null: nothing is relayed.
     */
    getStoredMessage: (userId: string, channelId: string, id: number) => Promise<{content: string; replyID: number | null} | null>;
    secrets: {guest: string; broadcast: string; internal: string};
    corsOrigin?: string;
    /** How often volunteer sockets are checked again against the API (ms). */
    sessionCheckMs?: number;
    log?: Pick<Console, 'log' | 'warn' | 'error'>;
}

// Rooms used by the service itself: never joinable through `listen`.
export const VOLUNTEERS = 'volunteers';
export const READERS = 'readers';
export const BOTS = 'bots';
/** Visitors' widgets: they get an anonymised copy of the room's events (#255). */
export const GUESTS = 'guests';
const userRoom = (id: string) => `user:${id}`;
const RESERVED = new Set([VOLUNTEERS, READERS, BOTS, GUESTS]);

/** Per connection: a burst of EVENT_BURST events, then EVENT_RATE per second (#258). */
export const EVENT_BURST = 30;
export const EVENT_RATE = 10;
/** Dropped events before the connection is closed. */
export const MAX_DROPPED_EVENTS = 200;

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
    /** Better Auth session behind the JWT: signing out closes the socket (#276). */
    sid?: unknown;
    user?: WsUser;
    readAll?: boolean;
    botUserId?: string;
    /** Kept to check again that the key is still valid when accounts change (#249). */
    botKey?: string;
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

    /**
     * An event for a channel's members (and readers): volunteers and the bot get it as is,
     * visitors an anonymised copy, or nothing for team-only events (#255, #257).
     */
    async function emitToRoom(room: string, event: string, payload: unknown, opts: {readers?: boolean; except?: string} = {}) {
        let target = io.to(room);
        if (opts.readers) target = target.to(READERS);
        target = target.except(GUESTS);
        if (opts.except) target = target.except(opts.except);
        target.emit(event, payload);
        for (const s of await io.in(room).fetchSockets()) {
            const sd = s.data as SocketData;
            if (sd.kind !== 'guest' || s.id === opts.except) continue;
            const view = visitorView(event, payload, sd.guestUid ?? '');
            if (view !== null) s.emit(event, view);
        }
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
                const session = userId ? await deps.getSession(userId, payload?.sid) : null;
                if (userId && session) {
                    Object.assign(d, {kind: 'volunteer', userId, sid: payload?.sid, user: session.user, readAll: session.readAll, access: new Map()});
                    (socket as any).__initialChannels = session.channels;
                    return next();
                }
            }

            const apiKey = str(auth.token, 512);
            if (apiKey) {
                const bot = await deps.checkApiKey(apiKey);
                if (bot?.userId) {
                    Object.assign(d, {kind: 'bot', botUserId: bot.userId, botKey: apiKey, access: new Map()});
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
        // Token bucket per connection (#258)
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
            if (++dropped >= MAX_DROPPED_EVENTS) {
                log.warn('[ws] too many events, closing', socket.id);
                socket.disconnect(true);
            }
            return false;
        };

        const on = (event: string, handler: (payload: any, ack: (...args: unknown[]) => void) => unknown) => {
            socket.on(event, async (...args: unknown[]) => {
                const last = args[args.length - 1];
                const ack = typeof last === 'function' ? (args.pop() as (...a: unknown[]) => void) : () => undefined;
                if (!allowEvent()) {
                    try {
                        ack(false);
                    } catch {
                        // nothing else to do
                    }
                    return;
                }
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
            // Online = connected to Solar, whatever the page: announced on the first tab only
            void io.in(userRoom(d.userId!)).fetchSockets().then(tabs => {
                const user = publicUser(socket);
                if (tabs.length === 1 && user) io.to(VOLUNTEERS).emit('userOnline', {user});
            });
            socket.on('disconnect', async () => {
                const user = publicUser(socket);
                if (!user) return;
                // Offline once the last tab is closed
                if ((await io.in(userRoom(user.id)).fetchSockets()).length === 0) io.to(VOLUNTEERS).emit('userOffline', {user});
            });
            // Channels the API listed for this user (write rights are checked on first send)
            for (const room of ((socket as any).__initialChannels as string[] ?? []).filter(isChannelId)) {
                socket.join(room);
            }
        }
        if (d.kind === 'bot') socket.join(BOTS);
        if (d.kind === 'guest') socket.join(GUESTS);

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
            if (user) await emitToRoom(room, 'userJoined', {channelId: room, user});
            ack(true);
        });

        on('leave', (payload) => {
            const room = payload?.id;
            if (!isChannelId(room) || !socket.rooms.has(room)) return;
            socket.leave(room);
            const user = publicUser(socket);
            if (user) void emitToRoom(room, 'userLeft', {channelId: room, user});
        });

        // Who is connected to Solar (any page): volunteers only, never visitors. The member list
        // of each channel (from the API) decides who is shown.
        on('getOnlineUsers', async (_payload, ack) => {
            if (d.kind !== 'volunteer') return ack([]);
            const sockets = await io.in(VOLUNTEERS).fetchSockets();
            const seen = new Set<string>();
            const users = sockets
                .map(s => (s.data as SocketData).user)
                .filter((u): u is WsUser => !!u && !seen.has(u.id) && !!seen.add(u.id));
            ack(users);
        });

        // Relay of a message already saved through the API or the web action. Only a stored
        // message is relayed, with its stored content, and only while the écoute is open: the
        // client's copy is never trusted. The author and timestamp are set here.
        on('sendMessage', async (payload, ack) => {
            if (d.kind !== 'volunteer') return ack(false);
            const room = payload?.channel?.id;
            if (!isChannelId(room) || !socket.rooms.has(room)) return ack(false);
            const id = typeof payload?.id === 'number' && Number.isInteger(payload.id) && payload.id > 0 ? payload.id : null;
            if (!id) return ack(false);
            if (!(await accessFor(socket, room)).write) return ack(false);

            const stored = await deps.getStoredMessage(d.userId!, room, id);
            if (!stored) return ack(false);
            const {content, replyID} = stored;
            if (!content.length || content.length > MAX_MESSAGE_LENGTH) return ack(false);
            await emitToRoom(room, 'message', {
                id,
                author: d.user,
                content: neutralizeHtml(content),
                timestamp: Date.now(),
                channel: {id: room},
                discordID: null,
                reactions: [],
                replyID,
                edited: false,
            }, {readers: true});
            ack(true);
        });

        on('typing', (payload) => {
            const room = payload?.id;
            if (!isChannelId(room) || !socket.rooms.has(room)) return;
            // The bot types on behalf of the Discord user of the écoute
            const user = d.kind === 'guest' ? {id: d.guestUid, name: 'Visiteur', image: null}
                : d.kind === 'bot' ? {id: 'guest', name: 'Visiteur', image: null} : d.user
                ? {id: d.user.id, name: d.user.username, image: d.user.image} : null;
            if (user) void emitToRoom(room, 'typingIndicator', {id: room, user}, {except: socket.id});
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
                if (isChannelId(room)) void emitToRoom(room, 'userLeft', {channelId: room, user}, {except: socket.id});
            }
        });
    });

    /** Re-checks a volunteer socket against the API: identity, read-all, followed and joined channels. */
    async function refreshVolunteer(socket: Socket) {
        const d = data(socket);
        const session = await deps.getSession(d.userId!, d.sid);
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

    /** After a change of roles or accounts: banned, removed and revoked connections are closed (#249). */
    async function refreshAllVolunteers() {
        for (const socket of [...io.sockets.sockets.values()]) {
            const d = data(socket);
            try {
                if (d.kind === 'volunteer') await refreshVolunteer(socket);
                else if (d.kind === 'bot') {
                    const bot = await deps.checkApiKey(d.botKey!);
                    if (bot?.userId !== d.botUserId) socket.disconnect(true);
                    else d.access = new Map();
                }
            } catch (e) {
                log.error('[ws] refresh failed', e);
            }
        }
    }

    // Signed out, reset password, removed account: sockets close within a few minutes even
    // without any other event (#276)
    const sessionCheck = setInterval(() => void refreshAllVolunteers(), deps.sessionCheckMs ?? 2 * 60_000);
    sessionCheck.unref();
    httpServer.on('close', () => clearInterval(sessionCheck));

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
                        if (payload.audience === 'bots') {
                            // For the bot accounts only (e.g. a voice link to forward on Discord)
                            io.to(BOTS).emit(event, eventData);
                        } else if (payload.audience === 'staff') {
                            // Team notes of an écoute: its volunteers and readers, never the
                            // visitor's widget nor the bot, which are in the room too
                            if (!isChannelId(room)) return send(res, 400, 'invalid room');
                            const members = await io.in(room).fetchSockets();
                            const staff = members.filter(s => (s.data as SocketData).kind === 'volunteer').map(s => s.id);
                            io.to([...staff, READERS]).emit(event, eventData);
                        } else if (room === null || room === '') {
                            // Room-less events are notifications (ids, statuses), for volunteers
                            io.to(VOLUNTEERS).emit(event, eventData);
                        } else if (isChannelId(room)) {
                            // Channel content: members of the channel and those who may read every ticket
                            await emitToRoom(room, event, eventData, {readers: true});
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
