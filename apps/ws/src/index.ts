import 'dotenv/config';
import {createServer} from 'http';
import {Server} from 'socket.io';
import Redis from 'ioredis';
import {createAdapter} from '@socket.io/redis-adapter';
import {createRemoteJWKSet, jwtVerify} from 'jose';

const PORT = Number(process.env.WS_PORT || 5000);
const HOST = process.env.WS_HOST || '0.0.0.0';
// Better Auth JWKS lives on the web app; default to local dev origin
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CORS_ORIGIN = process.env.WS_CORS_ORIGIN || '*';

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

const JWKS = createRemoteJWKSet(new URL(`${APP_URL}/api/auth/jwks`));

async function validateJWT(token: string) {
    try {
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: APP_URL,
            audience: APP_URL,
        });
        return payload;
    } catch (e) {
        return null;
    }
}

io.use(async (socket, next) => {
    const {jwt: token, token: apiToken} = socket.handshake.auth as Record<string, string>;
    let ok = false;
    if (token) ok = !!(await validateJWT(token));
    // Optionally validate API key via API service if provided
    if (!ok && apiToken && process.env.API_BASE_URL) {
        try {
            const res = await fetch(`${process.env.API_BASE_URL}/v1/keys/check`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({key: apiToken}),
            });
            ok = res.ok;
        } catch {
        }
    }
    if (!ok) {
        console.warn('[ws] auth failed for', socket.id, 'origin=', socket.handshake.headers.origin);
        return next(new Error('Authentication error'));
    }
    next();
});

io.on('connection', (socket) => {
    console.log(`[ws] connected ${socket.id} from ${socket.handshake.address}`);

    socket.on('ping', (cb?: () => void) => cb && cb());

    socket.on('listen', (data: { id: string }, cb?: (ok: boolean) => void) => {
        const room = data?.id;
        if (!room) return cb && cb(false);
        socket.join(room);
        const size = io.sockets.adapter.rooms.get(room)?.size || 0;
        console.log(`[ws] ${socket.id} joined room ${room} (size=${size})`);
        cb && cb(true);
    });

    socket.on('leave', (data: { id: string }) => {
        const room = data?.id;
        if (!room) return;
        socket.leave(room);
        const size = io.sockets.adapter.rooms.get(room)?.size || 0;
        console.log(`[ws] ${socket.id} left room ${room} (size=${size})`);
    });

    socket.on('sendMessage', (data: any, cb?: (ok: boolean) => void) => {
        const room = data?.channel?.id;
        if (!room) return cb && cb(false);
        // emit to everyone else in the room
        socket.to(room).emit('message', data);
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

    socket.on('disconnect', (reason) => {
        console.log(`[ws] disconnected ${socket.id} (${reason})`);
    });
});

httpServer.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`WS listening on http://${HOST}:${PORT}`);
});
