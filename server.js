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
        const JWKS = createRemoteJWKSet(new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/jwks`));
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-key`, {
            body: JSON.stringify({key: token}),
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        });
        return await res.json();
    } catch (error) {
        return false;
    }
}

async function getChannels(id) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/channels`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id}),
        });
        const body = await res.json();
        if (body.success) return body.accessedChannels;
    } catch (error) {
        return null;
    }
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
            if (socket.handshake.auth.jwt) validJWT = await validateJWT(socket.handshake.auth.jwt);

            let validToken = false;
            if (socket.handshake.auth.token) validToken = await validateAPIKey(socket.handshake.auth.token);

            if (validJWT) socket.user = validJWT;
            if (validToken) socket.user = validToken.user;

            if (!validJWT && !validToken) throw new Error("Invalid API key");

            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        const userID = socket.user.id;
        const channels = await getChannels(userID);
        if (!channels) return;

        for (let channel of channels) {
            const id = channel.id;
            socket.join(id);

            const userObject = {
                id: socket.user.id,
                username: socket.user.displayUsername || socket.user.name,
                image: socket.user.image,
                role: socket.user.role
            };

            socket.to(id).emit("joined", {channelId: id, user: userObject});

            const sockets = await io.in(id).fetchSockets();
            const users = sockets.map(s => ({
                id: s.user.id,
                username: s.user.displayUsername || s.user.name,
                image: s.user.image,
                role: s.user.role
            }));
            io.in(id).emit("userList", users);
        }

        let lastSeen = Date.now();
        socket.onAny(() => {
            lastSeen = Date.now();
        });
        socket.on("heartbeat", () => {
            lastSeen = Date.now();
        });

        const interval = setInterval(() => {
            if (Date.now() - lastSeen > 10000) {
                for (let channel of channels) {
                    socket.to(channel.id).emit("left", {
                        channelId: channel.id,
                        user: {
                            id: socket.user.id,
                            username: socket.user.displayUsername || socket.user.name,
                            image: socket.user.image,
                            role: socket.user.role
                        }
                    });
                }
                socket.disconnect(true);
                clearInterval(interval);
            }
        }, 5000);

        socket.on("disconnect", async () => {
            for (let channel of channels) {
                socket.to(channel.id).emit("left", {
                    channelId: channel.id,
                    user: {
                        id: socket.user.id,
                        username: socket.user.displayUsername || socket.user.name,
                        image: socket.user.image,
                        role: socket.user.role
                    }
                });
                const sockets = await io.in(channel.id).fetchSockets();
                const users = sockets.map(s => ({
                    id: s.user.id,
                    username: s.user.displayUsername || s.user.name,
                    image: s.user.image,
                    role: s.user.role
                }));
                io.in(channel.id).emit("userList", users);
            }
            clearInterval(interval);
        });
        socket.on('listen', async (data) => {
            socket.join(data.id);
        })

        socket.on('getOnlineUsers', async (data, cb) => {
            const sockets = await io.in(data.channelID).fetchSockets();
            cb(sockets.map(s => ({
                id: s.user.id,
                username: s.user.displayUsername || s.user.name,
                image: s.user.image,
                role: s.user.role
            })));
        });
        socket.on("ping", (cb) => cb());
        socket.on("sendMessage", (data) => socket.broadcast.to(data.channel.id).emit("message", data));
        socket.on('typing', (data) => socket.to(data.id).emit("typingIndicator", data));
        socket.on('update', () => io.emit('updateRequest'));
        socket.on('reaction', (data) => io.to(data.channelId).emit('reactionAdd', data.reaction));
        socket.on('reactionRemove', (data) => io.to(data.channelId).emit('reactionRemove', data.reaction));
    });

    global.io = io;

    server.listen(port, () => {
        console.log(`✅ Server ready at ${useHttps ? 'https' : 'http'}://${hostname}:${port}`);
    });
});
