import { Socket } from "socket.io";
import { IoData } from "../../pages/api/socket";
import session from "../interfaces/session";
import SocketAuth, { BotSession, ClientType, SessionType } from "./ServerActions/SocketAuth";
import SocketMessage from "./ServerActions/SocketMessage";

type EnumEventCallback = (socket: Socket, ...args:any) => any;

export class ServerEventCallbacks {
    static login: EnumEventCallback = (socket: Socket, ioData: IoData, session: session | BotSession, sessionType: SessionType, id:number, clientType: ClientType, ...args: any) => SocketAuth.register(socket, ioData, session, sessionType, id, clientType, ...args);
    static logout: EnumEventCallback = (socket: Socket, ioData: IoData) => SocketAuth.removeSession(socket, ioData);
    static get_history: EnumEventCallback = (socket: Socket, ioData: IoData) => SocketMessage.getHistory(socket, ioData);
    static send_message: EnumEventCallback = (socket: Socket, ioData: IoData, message: string) => SocketMessage.sendMessage(socket, ioData, message);
    static bot_message: EnumEventCallback = (socket: Socket, ioData: IoData, messageInfo: any) => {
        SocketMessage.recieveBotMessage(socket, ioData, messageInfo.messageContent, messageInfo.userID);
    }
}

export default class SocketEvent{
    private constructor(){}
    static dispatchEvent(socket: Socket, eventName: string, ioData: IoData, ...args:any) : void{
        if(Object.keys(ServerEventCallbacks).includes(eventName)) (Object.entries(ServerEventCallbacks).find(e=>e[0] == eventName)![1] as EnumEventCallback)(socket, ioData, ...args);
        return;
    }
}