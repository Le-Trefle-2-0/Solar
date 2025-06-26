import fs from 'fs';
import 'dotenv/config'
import {createServer as createHttpServer} from 'http';
import {createServer as createHttpsServer} from 'https';
import next from 'next';
import {Server} from 'socket.io';
import {createRemoteJWKSet, jwtVerify} from 'jose';

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.LOCAL_ADDRESS || 'localhost';
const port = process.env.HTTPS_PORT || 443;
const httpPort = process.env.HTTP_PORT || 80;

const app = next({dev, hostname, port});
const handler = app.getRequestHandler();

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
        return false;
    }
}

async function validateAPIKey(token) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-key`, {
            body: JSON.stringify({key: token}),
            method: 'POST',
        });
        const valid = await res.json();
        return valid;
    } catch (error) {
        return false;
    }
}

app.prepare().then(() => {
    const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };

    const httpsServer = createHttpsServer(sslOptions, handler);

    const io = new Server(httpsServer);

    io.use(async (socket, next) => {
        try {
            let validJWT = false;
            if (socket.handshake.auth.jwt)
                validJWT = await validateJWT(socket.handshake.auth.jwt);
            let validToken = false;
            if (socket.handshake.auth.token)
                validToken = await validateAPIKey(socket.handshake.auth.token);
            if (!validJWT && !validToken) {
                throw new Error("Invalid API key");
            }
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        socket.on("listen", (data) => {
            socket.join(data.id);
        });

        socket.on("sendMessage", (data) => {
            socket.to(data.channel.id).emit("message", data);
        });

        socket.on('typing', (data) => {
            socket.to(data.id).emit("typingIndicator", data);
        });
    });

    httpsServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`✅ HTTPS server ready at https://${hostname}:${port}`);
        });

    createHttpServer((req, res) => {
        const redirectHost = `${hostname}:${port}`;
        res.writeHead(301, {Location: `https://${redirectHost}${req.url}`});
        res.end();
    }).listen(httpPort, () => {
        console.log(`🌐 HTTP redirect server running on http://${hostname}:${httpPort}`);
    });
});
