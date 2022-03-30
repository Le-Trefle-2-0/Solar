import type { NextApiRequest, NextApiResponse } from "next";
import { Server,  ServerOptions } from 'socket.io'
import http from "http";
import SocketEvent from "../../src/socket/SocketEvent";

type NextApiResponseWithSocket = NextApiResponse & {socket: {server: (Partial<ServerOptions> | http.Server | number) & { io: Server } }};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket){
    if (res.socket.server.io) {
        console.log('Socket is already running')
    } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server)
        res.socket.server.io = io;

        io.on('connection', socket => {
            socket.onAny((eventName, ...args) => {
                SocketEvent.dispatchEvent(socket, eventName, ...args);
            });
        })
    }
    res.end()
}