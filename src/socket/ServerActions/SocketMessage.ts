import { Socket } from "socket.io";
import { IoData } from "../../../pages/api/socket";
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
    }
}