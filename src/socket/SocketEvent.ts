import { Socket } from "socket.io";
import MessageEncryptService from "../utils/message_encrypt_service";

type EnumEventCallback = {key: string, cb: (socket: Socket, ...args:any) => any};

export class ServerEvents {
    static encrypt: EnumEventCallback = {key: "encrypt", cb: (socket, data) => {socket.emit("text", MessageEncryptService.encrypt(data))}};
    static decrypt: EnumEventCallback = {key: "decrypt", cb: (socket, data) => {socket.emit("text", MessageEncryptService.decrypt(data))}};
}

export default class SocketEvent{
    private constructor(){}
    static dispatchEvent(socket: Socket, eventName: string, ...args:any) : void{
        if(Object.keys(ServerEvents).includes(eventName)) (Object.entries(ServerEvents).find(e=>e[0] == eventName)![1] as EnumEventCallback).cb(socket, ...args);
        return;
    }
}