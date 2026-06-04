import {config} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {createServer, IncomingMessage, ServerResponse} from 'http';
import {Server} from 'socket.io';
import Redis from 'ioredis';
import {createAdapter} from '@socket.io/redis-adapter';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {createHmac} from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({path: path.resolve(__dirname, '../../../.env')});

const PORT = Number(process.env.WS_PORT || 5000);
const HOST = process.env.WS_HOST || '0.0.0.0';
// Better Auth JWKS lives on the web app; keep issuer public and JWKS fetch internal when available
const AUTH_ISSUER = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('[ws] BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL is not set, falling back to http://localhost:3000');
}
const INTERNAL_AUTH_URL = (process.env.INTERNAL_AUTH_URL || AUTH_ISSUER).replace(/\/$/, '');
const CORS_ORIGIN = process.env.WS_CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || '*';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(','),
        credentials: true,
    },
});

// Optional Redis scale-out
if (process.env.REDIS_URL) {
    const pub = new Redis(process.env.REDIS_URL);
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
}

const JWKS = createRemoteJWKSet(new URL(`${INTERNAL_AUTH_URL}/api/auth/jwks`));

async function validateJWT(token: string) {
    try {
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: AUTH_ISSUER,
            audience: AUTH_ISSUER,
        });
        return payload;
    } catch (e: any) {
        console.warn('[ws] JWT verification failed:', e.message);
        // Optionally relax JWT checks in environments where APP_URL mismatches
        if ((process.env.WS_RELAX_JWT || '').toLowerCase() === 'true') {
            try {
                const {payload} = await jwtVerify(token, JWKS);
                return payload;
            } catch {
                return null;
            }
        }
        return null;
    }
}

io.use(async (socket, next) => {
    const auth: any = socket.handshake.auth || {};
    const {jwt: token, token: apiToken, guest} = auth as Record<string, any>;
    let ok = false;
    let isGuest = false;

    // 1) Full JWT (internal volunteers)
    if (token) {
        const payload = await validateJWT(token);
        if (payload) {
            ok = true;
            (socket.data as any).isVolunteer = true;
            (socket.data as any).userId = (payload.sub as string) || (payload as any).userId;
            (socket.data as any).user = {
                id: (socket.data as any).userId,
                username: payload.displayUsername || payload.name || payload.username || (payload as any).displayUsername || 'User',
                image: payload.image || (payload as any).picture || null,
                role: (payload as any).role || 'training'
            };
        }
    }

    // 2) API key (bots/integrations)
    if (!ok && apiToken) {
        try {
            const apiBase = process.env.API_BASE_URL || 'http://localhost:3001';
            if (!process.env.API_BASE_URL) {
                console.warn('API_BASE_URL is not set, falling back to http://localhost:3001');
            }
            const res = await fetch(`${apiBase}/v1/keys/check`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({key: apiToken}),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.valid && data.user) {
                    ok = true;
                    (socket.data as any).botUserId = data.user.id;
                    (socket.data as any).isBot = true;
                }
            }
        } catch (e) {
            console.error('[ws] API key validation error:', e);
        }
    }

    // 3) Guest access for public widget, restricted to a single room
    if (!ok && guest && typeof guest === 'object') {
        const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';
        const uid = String(guest.uid || '');
        const channelId = String(guest.channelId || '');
        const exp = Number(guest.exp || 0);
        const sig = String(guest.sig || '');
        const now = Date.now();
        if (uid && channelId && exp > now && sig) {
            const base = `${channelId}.${uid}.${exp}`;
            const h = createHmac('sha256', secret).update(base).digest('hex');
            if (h === sig) {
                ok = true;
                isGuest = true;
                (socket.data as any).guest = true;
                (socket.data as any).allowedRoom = channelId;
                (socket.data as any).guestUid = uid;
                (socket.data as any).guestExp = exp;
            }
        }
    }

    if (!ok) {
        console.warn('[ws] auth failed for', socket.id, 'origin=', socket.handshake.headers.origin);
        return next(new Error('Authentication error'));
    }
    next();
});

io.on('connection', (socket) => {
    console.log(`[ws] connected ${socket.id} from ${socket.handshake.address} (isBot: ${(socket.data as any).isBot})`);

    if ((socket.data as any).isVolunteer) {
        socket.join('volunteers');
    }

    if ((socket.data as any).isBot) {
        socket.join('bots');
    }

    socket.on('ping', (cb?: () => void) => cb && cb());

    socket.on('listen', (data: { id: string }, cb?: (ok: boolean) => void) => {
        const room = data?.id;
        if (!room) return cb && cb(false);
        // Guests may only join their allowed room
        if ((socket.data as any)?.guest) {
            const allowed = (socket.data as any).allowedRoom;
            if (room !== allowed) {
                console.warn('[ws] guest attempted to join unauthorized room', socket.id, room, 'allowed=', allowed);
                return cb && cb(false);
            }
        }
        socket.join(room);
        const size = io.sockets.adapter.rooms.get(room)?.size || 0;
        console.log(`[ws] ${socket.id} joined room ${room} (size=${size})`);

        if ((socket.data as any).user) {
            io.to(room).emit('userJoined', {
                channelId: room,
                user: (socket.data as any).user
            });
        }

        cb && cb(true);
    });

    socket.on('leave', (data: { id: string }) => {
        const room = data?.id;
        if (!room) return;
        socket.leave(room);
        const size = io.sockets.adapter.rooms.get(room)?.size || 0;
        console.log(`[ws] ${socket.id} left room ${room} (size=${size})`);

        if ((socket.data as any).user) {
            io.to(room).emit('userLeft', {
                channelId: room,
                user: (socket.data as any).user
            });
        }
    });

    socket.on('getOnlineUsers', async (data: { channelID: string }, cb?: (users: any[]) => void) => {
        const room = data?.channelID;
        if (!room) return cb && cb([]);

        const sockets = await io.in(room).fetchSockets();
        const users = sockets
            .map(s => (s.data as any).user)
            .filter(Boolean)
            // Deduplicate by ID
            .filter((u, index, self) => self.findIndex(t => t.id === u.id) === index);

        cb && cb(users);
    });

    socket.on('sendMessage', (data: any, cb?: (ok: boolean) => void) => {
        const room = data?.channel?.id;
        if (!room) return cb && cb(false);
        // Guests may only send to their allowed room
        if ((socket.data as any)?.guest) {
            const allowed = (socket.data as any).allowedRoom;
            if (room !== allowed) {
                console.warn('[ws] guest attempted to send to unauthorized room', socket.id, room, 'allowed=', allowed);
                return cb && cb(false);
            }
        }
        // emit to everyone in the room + all volunteers (for toasts)
        io.to(room).to('volunteers').emit('message', data);
        cb && cb(true);
    });

    socket.on('typing', (data: { id: string }) => {
        if (data?.id) socket.to(data.id).emit('typingIndicator', data);
    });

    // Heartbeat for liveness
    socket.on('heartbeat', () => {
        socket.emit('heartbeat');
    });

    // WebRTC signaling passthrough
    socket.on('signal', (roomId: string, payload: any) => {
        if (roomId) socket.to(roomId).emit('signal', payload);
    });


    socket.on('disconnecting', () => {
        if ((socket.data as any).user) {
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    io.to(room).emit('userLeft', {
                        channelId: room,
                        user: (socket.data as any).user
                    });
                }
            }
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[ws] disconnected ${socket.id} (${reason})`);
    });

    // Handle bot check in/out
    socket.on('bot:checkin', async (data: { userId?: string }) => {
        // Use botUserId from auth if available, or from payload as fallback
        const botUserId = (socket.data as any).botUserId || data?.userId;
        if (!botUserId) return;
        socket.join('bots');
        socket.data.botUserId = botUserId;
        console.log(`[ws] bot checked in: ${botUserId}`);
    });
});

// Lightweight HTTP endpoint to broadcast messages to a room (for server-to-server use)
httpServer.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    // Only handle POST /broadcast
    if (!req.url) return;
    // Use a proper base for URL parsing
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Basic health check for reverse proxies (Traefik) and uptime monitoring
    if (req.method === 'GET' && url.pathname === '/health') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ok: true}));
        return;
    }

    if (req.method === 'GET' && url.pathname === '/bot-status') {
        const botUserId = url.searchParams.get('userId');
        if (!botUserId) {
            res.statusCode = 400;
            res.end('missing userId');
            return;
        }
        const sockets = await io.fetchSockets();
        const isConnected = sockets.some(s => s.data.botUserId === botUserId);
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({isConnected}));
        return;
    }

    if (req.method !== 'POST' || url.pathname !== '/broadcast') return;

    // Auth via shared secret header
    const expected = process.env.WS_BROADCAST_SECRET || 'fallback_broadcast_secret_for_dev_only';
    const provided = (req.headers['x-ws-secret'] as string) || '';
    if (provided !== expected) {
        res.statusCode = 401;
        res.end('unauthorized');
        return;
    }

    // Read body
    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () => {
        try {
            const payload = JSON.parse(body || '{}');
            const room: string = payload.room || payload.channelId || payload.channel || '';
            const data: any = payload.data;
            const event: string = payload.event || 'message';
            if (!room || typeof data === 'undefined') {
                // Broadcast to volunteers by default for non-room events
                if (typeof data !== 'undefined' && event) {
                    io.to('volunteers').emit(event, data);
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.end(JSON.stringify({success: true}));
                    return;
                } else {
                    res.statusCode = 400;
                    res.end('invalid payload');
                    return;
                }
            }
            // Emit to the specific room AND to all volunteers
            // Use additive rooms to reach both audiences in one go, deduplicated by Socket.IO
            io.to(room).to('volunteers').emit(event, data);
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({success: true}));
        } catch (e) {
            res.statusCode = 400;
            res.end('bad json');
        }
    });
});

httpServer.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`WS listening on http://${HOST}:${PORT}`);
});
