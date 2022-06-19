import { Socket } from "socket.io";
import { IoData } from "../../../pages/api/socket";
import session from "../../interfaces/session";
import MessageEncryptService from "../../utils/message_encrypt_service";
import prisma_instance from "../../utils/prisma_instance";
import { ClientEvents } from "../Enums";
import socketAuth from "./SocketAuth";

export default class SocketMessage{
    private constructor (){}

    static async getHistory(socket: Socket, ioData: IoData){
        let session = socketAuth.getSession(socket, ioData);
        if(session?.session_type == "eventChat"){
            let messages = await prisma_instance.event_messages.findMany({
                where:{
                    calendar_event_message:{
                        every:{
                            calendar_event_id: session.id
                        }
                    }
                },
                include:{
                    accounts: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            messages.map(m=>{
                m.content_encrypted = MessageEncryptService.decrypt(m.content_encrypted);
            })
            socket.emit(ClientEvents.history, messages);
            return;
        } else if (session?.session_type == "listenChat") {
            let messages =  await prisma_instance.messages.findMany({
                where:{
                    listen_message:{
                        every:{
                            listen_id: session.id
                        }
                    }
                },
                include:{
                    accounts: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            messages.map(m=>{
                m.content_encrypted = MessageEncryptService.decrypt(m.content_encrypted);
                m.discord_message_encrypted = MessageEncryptService.decrypt(m.discord_message_encrypted);
            })
            socket.emit(ClientEvents.history, messages);
            return;
        }
        socket.emit(ClientEvents.auth_invalid);
        return;
    }

    static async sendMessage(socket: Socket, ioData: IoData, messageStr: string, discordCtn?:string){
        let session = socketAuth.getSession(socket, ioData);
        if(session?.session_type == "eventChat"){
            let message = await prisma_instance.event_messages.create({
                data: {
                    content_encrypted: MessageEncryptService.encrypt(messageStr),
                    account_id: session.session.user.id
                },
                include: {
                    accounts: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            await prisma_instance.calendar_event_message.create({
                data:{
                    event_message_id: message.id,
                    calendar_event_id: session.id
                }
            })
            message.content_encrypted = MessageEncryptService.decrypt(message.content_encrypted);
            socket.to(ioData.eventSessions.filter(s=>s.id == session?.id).map(s=>s.socket_id)).emit(ClientEvents.new_message, message);
            socket.emit(ClientEvents.new_message, message);
            return;
        } else if (session?.session_type == "listenChat") {
            let message =  await prisma_instance.messages.create({
                data: {
                    content_encrypted: MessageEncryptService.encrypt(messageStr),
                    discord_message_encrypted: discordCtn ? MessageEncryptService.encrypt(discordCtn) : "",
                    account_id: session.session.user.id
                },
                include:{
                    accounts: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            await prisma_instance.listen_message.create({
                data:{
                    message_id: message.id,
                    listen_id: session.id
                }
            })
            message.content_encrypted = MessageEncryptService.decrypt(message.content_encrypted);
            message.discord_message_encrypted = MessageEncryptService.decrypt(message.discord_message_encrypted);
            socket.to(ioData.listenSessions.filter(s=>s.id == session?.id).map(s=>s.socket_id)).emit(ClientEvents.new_message, message);
            socket.emit(ClientEvents.new_message, message);
            return;
        }
        socket.emit(ClientEvents.auth_invalid);
        return;
    }
}