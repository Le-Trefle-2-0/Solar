require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {ExpressPeerServer} = require("peer");
const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.static("public"));

const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

const PORT = process.env.PEER_PORT || 9000;

const server = https.createServer(sslOptions, app);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    allow_discovery: true,
    path: "/",
});

app.use("/", peerServer);

// 🔽 Event listeners for peer connections
peerServer.on("connection", (client) => {
    console.log(`✅ Peer connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client) => {
    console.log(`❌ Peer disconnected: ${client.getId()}`);
});

server.listen(PORT, () => {
    console.log(`🔒 PeerJS server running securely on https://localhost:${PORT}/peerjs`);
});
