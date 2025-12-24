import {io, Socket} from "socket.io-client";

let socket: Socket | null = null;

export async function initSocket(jwt: string): Promise<Socket | null> {
    if (socket) return socket;

    // Build a robust base URL for Socket.IO origin
    // Priority:
    //  1) NEXT_PUBLIC_WS_URL when provided (full URL like https://ws.example.com)
    //  2) NEXT_PUBLIC_WS_HOST when provided (host[:port] like ws.example.com) → protocol inferred from window
    //  3) In local dev, http://localhost:5000 (common default for the WS service)
    //  4) Try to derive a ws.* subdomain from current location as a last resort in production
    let base: string | undefined;
    const envUrl = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
    const envHost = (process.env.NEXT_PUBLIC_WS_HOST || '').trim();

    if (envUrl) {
        base = envUrl;
    } else if (typeof window !== 'undefined' && envHost) {
        const proto = window.location.protocol === 'https:' ? 'https://' : 'http://';
        base = `${proto}${envHost}`;
    } else if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
            base = 'http://localhost:5000';
        } else {
            // Attempt to derive a ws subdomain automatically (e.g., beta.example.com → ws.beta.example.com)
            const {protocol, hostname} = window.location;
            const proto = protocol === 'https:' ? 'https://' : 'http://';
            const derivedHost = hostname.startsWith('ws.') ? hostname : `ws.${hostname}`;
            base = `${proto}${derivedHost}`;
        }
    }
    if (!base) base = 'http://localhost:5000';

    // socket.io expects http(s) origin; normalize ws(s) → http(s)
    if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
    if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

    // eslint-disable-next-line no-console
    console.log('[ws] connecting to', base);
    const transportsEnv = (process.env.NEXT_PUBLIC_WS_TRANSPORTS || 'websocket')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const rejectUnauth = (process.env.NEXT_PUBLIC_WS_REJECT_UNAUTHORIZED || '').toLowerCase();
    const rejectUnauthorized = rejectUnauth ? rejectUnauth === 'true' : process.env.NODE_ENV === 'production';
    socket = io(base, {
        auth: {jwt},
        transports: transportsEnv as any, // default to websocket only for stability
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        rejectUnauthorized,
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
