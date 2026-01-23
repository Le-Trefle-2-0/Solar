import {io, Socket} from "socket.io-client";
import {getWsBase} from "@/lib/api";

let socket: Socket | null = null;

export async function initSocket(jwt: string): Promise<Socket | null> {
    if (socket) return socket;

    let base = getWsBase();

    // socket.io expects http(s) origin; normalize ws(s) → http(s)
    if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
    if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);

    // eslint-disable-next-line no-console
    console.log('[ws] connecting to', base);
    const transportsEnv = (process.env.NEXT_PUBLIC_WS_TRANSPORTS || 'polling,websocket')
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
