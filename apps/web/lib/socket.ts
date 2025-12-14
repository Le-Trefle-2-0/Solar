import {io, Socket} from "socket.io-client";

let socket: Socket | null = null;

export async function initSocket(jwt: string): Promise<Socket | null> {
    if (socket) return socket;

    // Build a robust base URL for Socket.IO origin
    // Priority:
    //  1) NEXT_PUBLIC_WS_URL when provided
    //  2) http://localhost:5000 in dev (common default for the WS service)
    //  3) window.location.origin as a last resort
    const candidates: string[] = [];
    const envUrl = process.env.NEXT_PUBLIC_WS_URL as string | undefined;
    if (envUrl && envUrl.trim().length > 0) candidates.push(envUrl.trim());
    if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) candidates.push('http://localhost:5000');
        candidates.push(window.location.origin);
    }
    let base = candidates[0] || 'http://localhost:5000';
    // socket.io expects http(s) origin; normalize ws(s) → http(s)
    if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
    if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

    // eslint-disable-next-line no-console
    console.log('[ws] connecting to', base);
    socket = io(base, {
        auth: {jwt},
        // Let socket.io decide transports (websocket + fallback) to improve connectivity
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        rejectUnauthorized: process.env.NODE_ENV === "production"
    });

    // Debug listeners to help diagnose connection issues
    socket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('[ws] connected', socket?.id);
    });
    socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[ws] connect_error', err?.message || err);
    });
    socket.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[ws] error', err);
    });
    socket.io.on('reconnect_attempt', (attempt) => {
        // eslint-disable-next-line no-console
        console.warn('[ws] reconnect_attempt', attempt);
    });
    socket.io.on('reconnect', (n) => {
        // eslint-disable-next-line no-console
        console.log('[ws] reconnected', n);
    });

    return socket;
}

export function joinChannel(channelID: string) {
    socket?.emit("listen", {id: channelID});
}

export function leaveChannel(channelID: string) {
    socket?.emit("leave", {id: channelID});
}

export function getSocket() {
    return socket;
}

export function closeSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
