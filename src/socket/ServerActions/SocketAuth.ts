import { verify } from "jsonwebtoken";
import { Socket } from "socket.io";
import { IoData } from "../../../pages/api/socket";
import session, { sessionAccountWithRoles } from "../../interfaces/session";
import { ClientEvents } from "../Enums";

export type SessionType = "eventChat" | "listenChat";
export type ClientType = "bot" | "app";
export type BotSession = {jwt: string, discordId: string}
export type SocketAuthSession = {
    socket_id: string,
    id:number,
    session: session | BotSession,
    client_type: ClientType
    session_type: SessionType
}

export default class socketAuth{
    private constructor(){}
    static register(socket: Socket, ioData: IoData, session: session | BotSession, sessionType: SessionType, id:number, clientType: ClientType, ...args: any){
        if(!session) {socket.emit(ClientEvents.auth_refused); return;}
        let jwtSession: sessionAccountWithRoles;
        let jwtPayload;
        try{
            jwtPayload = verify(session.jwt, process.env.JWT_SECRET || "secret");
        } catch {
            socket.emit(ClientEvents.auth_refused);
            return;
        }
        if(typeof jwtPayload == "string") {socket.emit(ClientEvents.auth_refused); return;}
        jwtSession = jwtPayload as sessionAccountWithRoles;
        if(jwtSession.roles.name != "bot" && clientType == "bot") {socket.emit(ClientEvents.auth_refused); return;}
        if(clientType == "bot"){
            session = session as BotSession || null;
            if(sessionType == "listenChat"){
                ioData.listenSessions.push({socket_id: socket.id, id:id, session: session, client_type: clientType});
                socket.emit(ClientEvents.auth_accepted);
            } else {socket.emit(ClientEvents.auth_refused); return;}
        } else {
            session = session as session || null;
            if(sessionType == "listenChat"){
                ioData.listenSessions.push({socket_id: socket.id, id:id, session: session, client_type: clientType});
                console.log("user connected!")
                socket.emit(ClientEvents.auth_accepted);
            } else {
                ioData.eventSessions.push({socket_id: socket.id, id:id, session: session});
                socket.emit(ClientEvents.auth_accepted);
            }
        }
    }
    static checkSession(socket: Socket, ioData: IoData) : boolean {
        if(
            ioData.eventSessions.find(s=>s.socket_id == socket.id) != undefined
         || ioData.listenSessions.find(s=>s.socket_id == socket.id) != undefined
        ){
            return true;
        } else {
            socket.emit(ClientEvents.auth_invalid);
        }
        return false;
    }
    static getSession(socket: Socket, ioData: IoData) : SocketAuthSession | null {
        let eventSession = ioData.eventSessions.find(s=>s.socket_id == socket.id);
        let listenSession = ioData.listenSessions.find(s=>s.socket_id == socket.id);
        if(eventSession){
            return {
                socket_id: eventSession.socket_id,
                id: eventSession.id,
                session: eventSession.session,
                client_type: "app",
                session_type: "eventChat"
            }
        } else if(listenSession) {
            return {
                socket_id: listenSession.socket_id,
                id: listenSession.id,
                session: listenSession.session,
                client_type: listenSession.client_type,
                session_type: "listenChat"
            }
        }
        socket.emit(ClientEvents.auth_invalid);
        return null;
    }
    static removeSession(socket: Socket, ioData: IoData) {
        ioData.eventSessions = ioData.eventSessions.filter(s=>s.socket_id != socket.id);
        ioData.listenSessions = ioData.listenSessions.filter(s=>s.socket_id != socket.id);
    }
}