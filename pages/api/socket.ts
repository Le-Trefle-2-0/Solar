import { Server, ServerOptions } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from "next";
import http from "http";
import session from "../../src/interfaces/session";
import SocketEvent from "../../src/socket/SocketEvent";
import io_data from "../../src/utils/io_data";
import socketAuth, { BotSession, ClientType } from "../../src/socket/ServerActions/SocketAuth";

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

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
  } else {
    console.log('[INFO] Socket is initializing')
    const io = new Server(res.socket.server, {
        addTrailingSlash: false
    })
    res.socket.server.io = io

    io.on('connection', socket => {            
        socket.onAny((eventName, ...args) => {
            SocketEvent.dispatchEvent(socket, eventName, io_data, ...args);
        });

        socket.on('bot_connect', () => {
            globalThis.botSocket = socket;
        });

        socket.emit('hello', {});

        socket.on("disconnect", () => socketAuth.removeSession(socket, io_data))
    })
  }
  res.end()
}

export default SocketHandler