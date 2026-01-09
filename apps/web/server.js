import fs from 'fs';
import 'dotenv/config';
import {createServer as createHttpServer} from 'http';
import {createServer as createHttpsServer} from 'https';
import next from 'next';
import {Server} from 'socket.io';
import {createRemoteJWKSet, jwtVerify} from 'jose';

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.NEXT_PUBLIC_HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

// Toggle: use HTTPS internally if INTERNAL_HTTPS="true"
const useHttps = process.env.INTERNAL_HTTPS === "false";

const app = next({dev, hostname, port});
const handler = app.getRequestHandler();

setInterval(() => {
    const used = process.memoryUsage();
    console.log(`Memory: RSS=${(used.rss / 1024 / 1024).toFixed(1)} MB, HeapUsed=${(used.heapUsed / 1024 / 1024).toFixed(1)} MB, HeapTotal=${(used.heapTotal / 1024 / 1024).toFixed(1)} MB`);
}, 10000);

async function validateJWT(token) {
    try {
        const authUrl = (process.env.INTERNAL_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        const JWKS = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: process.env.NEXT_PUBLIC_APP_URL,
            audience: process.env.NEXT_PUBLIC_APP_URL,
        });
        return payload;
    } catch (error) {
        console.error('JWT validation failed:', error);
        return false;
    }
}

async function validateAPIKey(token) {
    try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
        console.log(`[ws] Validating API key against ${apiUrl}/v1/keys/check`);
        const res = await fetch(`${apiUrl}/v1/keys/check`, {
            body: JSON.stringify({key: token}),
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        });
        const data = await res.json();
        return data.valid ? data : false;
    } catch (error) {
        console.error('[ws] API key validation error:', error);
        return false;
    }
}

async function getChannels(id) {
    // This function is now superseded by getChannelsWithAuth(socket)
    return null;
}

app.prepare().then(() => {
    let server;

    if (useHttps) {
        console.log("🔒 Starting internal HTTPS server...");
        const sslOptions = {
            key: fs.readFileSync(process.env.SSL_KEY_PATH),
            cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        };
        server = createHttpsServer(sslOptions, handler);
    } else {
        console.log("🌐 Starting HTTP server (expecting external HTTPS termination)...");
        server = createHttpServer(handler);
    }

    const io = new Server(server, {
        cors: {origin: '*'},
        transports: ['websocket'],
        pingInterval: 10000,
        pingTimeout: 20000
    });

    io.use(async (socket, next) => {
        try {
            let validJWT = false;
            if (socket.handshake.auth.jwt) {
                validJWT = await validateJWT(socket.handshake.auth.jwt);
                if (validJWT) {
                    socket.jwt = socket.handshake.auth.jwt;
                    socket.user = {
                        ...validJWT,
                        id: validJWT.id || validJWT.sub,
                    };
                }
            }

            let validToken = false;
            if (socket.handshake.auth.token) {
                validToken = await validateAPIKey(socket.handshake.auth.token);
                if (validToken) {
                    socket.user = validToken.user;
                    socket.token = socket.handshake.auth.token;
                }
            }

            if (!socket.user) throw new Error("Authentication failed");

            console.log(`[ws] User ${socket.user.id} authenticated`);
            next();
        } catch (err) {
            console.error('[ws] Auth middleware error:', err.message);
            next(new Error("Authentication error"));
        }
    });

    async function getChannelsWithAuth(socket) {
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
            const headers = {'Content-Type': 'application/json'};
            if (socket.jwt) headers['Authorization'] = `Bearer ${socket.jwt}`;
            if (socket.token) headers['token'] = socket.token;

            const res = await fetch(`${apiUrl}/v1/channels`, {
                method: 'POST',
                headers: headers
            });
            const body = await res.json();
            if (body.success) return body.accessedChannels;
            return null;
        } catch (error) {
            console.error('[ws] getChannels error:', error);
            return null;
        }
    }

    function normalizeUser(u) {
        if (!u) return null;
        let role = u.role || 'training';
        if (typeof role === 'string') {
            role = role.split(',').map(r => r.trim().toLowerCase());
        }
        return {
            id: u.id,
            username: u.displayUsername || u.name || 'Inconnu',
            image: u.image || null,
            role: role
        };
    }

    io.on("connection", async (socket) => {
        const userID = socket.user.id;
        const channels = await getChannelsWithAuth(socket);
        if (!channels) {
            console.warn(`[ws] No channels found for user ${userID}`);
            // Still join internal update room
            socket.on('update', () => io.emit('updateRequest'));
            return;
        }

        console.log(`[ws] User ${userID} joining ${channels.length} channels`);
        for (let channel of channels) {
            const id = channel.id;
            socket.join(id);

            const userObject = normalizeUser(socket.user);
            socket.to(id).emit("joined", {channelId: id, user: userObject});

            const sockets = await io.in(id).fetchSockets();
            const users = sockets.map(s => normalizeUser(s.user)).filter(Boolean);
            io.in(id).emit("userList", {channelId: id, users});
        }

        let lastSeen = Date.now();
        socket.onAny(() => {
            lastSeen = Date.now();
        });
        socket.on("heartbeat", () => {
            lastSeen = Date.now();
        });

        const interval = setInterval(() => {
            if (Date.now() - lastSeen > 15000) { // Increased to 15s to be safer
                for (let channel of channels) {
                    socket.to(channel.id).emit("left", {
                        channelId: channel.id,
                        user: normalizeUser(socket.user)
                    });
                }
                socket.disconnect(true);
                clearInterval(interval);
            }
        }, 5000);

        socket.on("disconnect", async () => {
            console.log(`[ws] User ${userID} disconnected`);
            for (let channel of channels) {
                const payload = {
                    channelId: channel.id,
                    user: normalizeUser(socket.user)
                };
                socket.to(channel.id).emit("left", payload);

                const sockets = await io.in(channel.id).fetchSockets();
                const users = sockets.map(s => normalizeUser(s.user)).filter(Boolean);
                io.in(channel.id).emit("userList", {channelId: channel.id, users});
            }
            clearInterval(interval);
        });
        socket.on('listen', async (data) => {
            if (!data.id) return;
            socket.join(data.id);
            // After joining, broadcast presence to others and send current list to the user
            const userObject = normalizeUser(socket.user);
            socket.to(data.id).emit("joined", {channelId: data.id, user: userObject});

            const sockets = await io.in(data.id).fetchSockets();
            const users = sockets.map(s => normalizeUser(s.user)).filter(Boolean);
            io.in(data.id).emit("userList", {channelId: data.id, users});
        })

        socket.on('getOnlineUsers', async (data, cb) => {
            if (!data.channelID) return cb([]);
            const sockets = await io.in(data.channelID).fetchSockets();
            cb(sockets.map(s => normalizeUser(s.user)).filter(Boolean));
        });
        socket.on("ping", (cb) => cb());
        socket.on("sendMessage", (data) => socket.broadcast.to(data.channel.id).emit("message", data));
        socket.on('typing', (data) => socket.to(data.id).emit("typingIndicator", data));
        socket.on('update', () => io.emit('updateRequest'));
        socket.on('reaction', (data) => socket.broadcast.to(data.channelId).emit('reactionAdd', data.reaction));
        socket.on('reactionRemove', (data) => socket.broadcast.to(data.channelId).emit('reactionRemove', data.reaction));
    });

    global.io = io;

    server.listen(port, () => {
        console.log(`✅ Server ready at ${useHttps ? 'https' : 'http'}://${hostname}:${port}`);
    });
});
