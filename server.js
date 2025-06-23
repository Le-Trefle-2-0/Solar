import {createServer} from "node:http";
import next from "next";
import {Server} from "socket.io";
import {createRemoteJWKSet, jwtVerify} from 'jose'

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({dev, hostname, port});
const handler = app.getRequestHandler();

async function validateJWT(token) {
    try {
        const JWKS = createRemoteJWKSet(
            new URL('http://localhost:3000/api/auth/jwks')
        )
        const {payload} = await jwtVerify(token, JWKS, {
            issuer: 'http://localhost:3000', // Should match your JWT issuer, which is the BASE_URL
            audience: 'http://localhost:3000', // Should match your JWT audience, which is the BASE_URL by default
        })
        return payload
    } catch (error) {
        return false;
    }
}

async function validateAPIKey(token) {
    try {
        const res = await fetch('http://localhost:3000/api/check-key', {
            body: JSON.stringify({
                key: token,
            }),
            method: 'POST',
        });

        const valid = await res.json();
        return valid;
    } catch (error) {
        return false;
    }
}

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.use(async (socket, next) => {
        try {
            console.log(socket.handshake.auth);
            const validJWT = await validateJWT(socket.handshake.auth.jwt);
            const validToken = await validateAPIKey(socket.handshake.auth.token);
            if (!validJWT && !validToken) {
                throw new Error("Invalid API key");
            }
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    // io.use(async (socket, next) => {
    //     const session = await auth.api.getSession({
    //         headers: fromNodeHeaders(socket.request.headers),
    //     });
    //
    //     if (session) {
    //         // socket.session = session;
    //         next();
    //     } else {
    //         next(new Error("unauthorized"));
    //     }
    // });

    io.on("connection", async (socket) => {
        socket.on("listen", (data) => {
            socket.join(data.id)
        });

        socket.on("sendMessage", (data) => {
            socket.to(data.channel.id).emit("message", data);
        });

        socket.on('typing', (data) => {
            socket.to(data.id).emit("typingIndicator", data);
        })
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});