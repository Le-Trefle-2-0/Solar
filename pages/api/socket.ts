import { Server, ServerOptions } from 'socket.io'
import http from "http";
import session from "../../src/interfaces/session";
import type { NextApiRequest, NextApiResponse } from "next";
import SocketEvent from "../../src/socket/SocketEvent";
import io_data from "../../src/utils/io_data";
import socketAuth, { BotSession, ClientType } from "../../src/socket/ServerActions/SocketAuth";

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

type NextApiResponseWithSocket = NextApiResponse & {socket: {server: (Partial<ServerOptions> | http.Server | number) & { io: Server, ioData: IoData } }};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {            
        socket.onAny((eventName, ...args) => {
            SocketEvent.dispatchEvent(socket, eventName, io_data, ...args);
        });
    })
  }
  res.end()
}

export default SocketHandler