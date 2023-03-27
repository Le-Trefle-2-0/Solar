import type { NextApiRequest, NextApiResponse } from "next";
import { Server,  ServerOptions } from 'socket.io'
import http from "http";
import SocketEvent from "../../src/socket/SocketEvent";
import session from "../../src/interfaces/session";
import socketAuth, { BotSession, ClientType, SessionType } from "../../src/socket/ServerActions/SocketAuth";
import io_data from "../../src/utils/io_data";

type NextApiResponseWithSocket = NextApiResponse & {socket: {server: (Partial<ServerOptions> | http.Server | number) & { io: Server, ioData: IoData } }};
export type IoData = {
    eventSessions: {
        socket_id: string,
        id:number,
        session: session
    }[],
    listenSessions: {
        socket_id: string,
        id:number,
        session: session | BotSession,
        client_type: ClientType
    }[]
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket){
    if (res.socket.server.io) {
    } else {
        console.log('[INFO] Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io;

        io.on('connection', socket => {
            socket.onAny((eventName, ...args) => {
                SocketEvent.dispatchEvent(socket, eventName, io_data, ...args);
            });

            socket.on('bot_connect', () => {
                globalThis.botSocket = socket;
                console.log('[INFO] Bot socket is connected')
            });

            socket.emit('hello', {});

            socket.on("disconnect", () => socketAuth.removeSession(socket, io_data))
        })
    }
    res.end()
}