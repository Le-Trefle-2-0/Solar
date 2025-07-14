import {io, Socket} from "socket.io-client";

let socket: Socket | null = null;

export async function initSocket(jwt: string): Promise<Socket | null> {
    if (socket) return socket;

    socket = io(process.env.NEXT_PUBLIC_APP_URL!, {
        auth: {jwt},
        transports: ["websocket"],
        withCredentials: true,
        rejectUnauthorized: process.env.NODE_ENV === "production"
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
