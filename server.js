import fs from 'fs';
import 'dotenv/config'
import {createServer as createHttpServer} from 'http';
import {Agent, createServer as createHttpsServer} from 'https';
import next from 'next';
import {Server} from 'socket.io';
import {createRemoteJWKSet, jwtVerify} from 'jose';

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.NEXT_PUBLIC_HOST || 'localhost';
const port = process.env.HTTPS_PORT || 443;
const httpPort = process.env.HTTP_PORT || 80;

const app = next({dev, hostname, port});
const handler = app.getRequestHandler();

if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const originalFetch = global.fetch || (await import('node-fetch')).default;
    const agent = new Agent({rejectUnauthorized: false});

    global.fetch = (url, options = {}) => {
        return originalFetch(url, {
            ...options,
            agent,
        });
    };
}

async function validateJWT(token) {
    try {
        const JWKS = createRemoteJWKSet(
            new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/jwks`)
        );

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
        const valid = await res.json();
        return valid;
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
        if (body.success) return body.accessedChannelIDs
    } catch (error) {
        return null;
    }
}

app.prepare().then(() => {
    const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };

    const httpsServer = createHttpsServer(sslOptions, handler);

    const httpServer = createHttpServer((req, res) => {
        const redirectHost = `${hostname}:${port}`;
        res.writeHead(301, {Location: `https://${redirectHost}${req.url}`});
        res.end();
    }).listen(httpPort, () => {
        console.log(`🌐 HTTP redirect server running on http://${hostname}:${httpPort}`);
    });

    const io = new Server(httpsServer);

    io.use(async (socket, next) => {
        try {
            let validJWT = false;
            if (socket.handshake.auth.jwt) {
                validJWT = await validateJWT(socket.handshake.auth.jwt);
            }
            let validToken = false;
            if (socket.handshake.auth.token) {
                validToken = await validateAPIKey(socket.handshake.auth.token);
            }
            if (validJWT) socket.user = validJWT;
            if (validToken) socket.user = validToken.user;
            if (!validJWT && !validToken) {
                throw new Error("Invalid API key");
            }
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        const userID = socket.user.id;
        const channels = await getChannels(userID)
        for (let id of channels) {
            socket.join(id)
        }

        socket.on("ping", (callback) => {
            callback();
        });

        socket.on("sendMessage", (data) => {
            socket.broadcast.to(data.channel.id).emit("message", data);
        });

        socket.on('typing', (data) => {
            socket.to(data.id).emit("typingIndicator", data);
        });

        socket.on('update', () => {
            socket.to('update').emit('updateRequest')
        });

        socket.on('reaction', (data) => {
            console.log(data);
            socket.broadcast.to(data.channelId).emit('reactionAdd', data.reaction);
        });

        socket.on('reactionRemove', (data) => {
            socket.to(data.channelId).emit('reactionRemove', data.reaction);
        })
    });

    global.io = io;

    httpsServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`✅ HTTPS server ready at https://${hostname}:${port}`);
        });
});
