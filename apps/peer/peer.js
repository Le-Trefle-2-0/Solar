require("dotenv").config();

const fs = require("fs");
const crypto = require("crypto");
const {ExpressPeerServer} = require("peer");
const express = require("express");
const cors = require("cors");
const https = require("https");

/**
 * PeerJS signalling server for voice calls.
 * - No discovery: the list of connected peers (call ids) is not public (#226).
 * - CORS limited to the app's origin(s) (PEER_CORS_ORIGIN, else NEXT_PUBLIC_APP_URL).
 * - Peer ids must match the formats the app uses; anything else is refused and never
 *   written to the logs as is (#281).
 */

const ORIGINS = (process.env.PEER_CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "")
    .split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
if (!ORIGINS.length) {
    console.error("[peer] Set PEER_CORS_ORIGIN or NEXT_PUBLIC_APP_URL (allowed browser origins). Aborting startup.");
    process.exit(1);
}

// Volunteer side: "call-" + 32 hex chars (issued by the API); visitor side: "anon-" + 32 hex chars
const PEER_ID_RE = /^(call|anon)-[a-f0-9]{32}$/;
const isValidPeerId = (id) => typeof id === "string" && PEER_ID_RE.test(id);
/** Printable, bounded form of an untrusted id for the logs. */
const logId = (id) => JSON.stringify(String(id).slice(0, 80));

const corsOptions = {origin: ORIGINS, methods: ["GET", "POST"]};
const app = express();
app.use(cors(corsOptions));
app.use(express.static("public"));

const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

const PORT = process.env.PEER_PORT || 9000;

const server = https.createServer(sslOptions, app);

const peerServer = ExpressPeerServer(server, {
    debug: false,
    allow_discovery: false,
    path: "/",
    corsOptions,
    // Ids the server hands out on request follow the visitor format
    generateClientId: () => `anon-${crypto.randomBytes(16).toString("hex")}`,
});

app.use("/", peerServer);

peerServer.on("connection", (client) => {
    const id = client.getId();
    if (!isValidPeerId(id)) {
        console.warn(`[peer] refused peer with invalid id ${logId(id)}`);
        try {
            client.getSocket()?.close();
        } catch {
            // already gone
        }
        return;
    }
    console.log(`[peer] connected ${id}`);
});

peerServer.on("disconnect", (client) => {
    const id = client.getId();
    if (isValidPeerId(id)) console.log(`[peer] disconnected ${id}`);
});

server.listen(PORT, () => {
    console.log(`[peer] PeerJS server listening on https://localhost:${PORT}/`);
});
