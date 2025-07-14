"use server"
import prisma from "@/lib/prisma";
import {Msg, MsgWithID} from '@/lib/interface'

export const saveMessage = async (msg: Msg) => {
        const message = await prisma.message.create({
            data: {
                createdAt: new Date(),
                userId: msg.author.id,
                channelId: msg.channel.id,
                content: Buffer.from(msg.content, "utf8"),
            }
        });

    return (message);
}

export const getMessages = async (channelId: string) => {
    const message = await prisma.message.findMany({
        where: {
            channelId
        }
    });

    let messages: MsgWithID[] = []
    for (const msg of message) {
        let user = await prisma.user.findUnique({
            where: {
                id: msg.userId,
            }
        });

        const reactions = await prisma.reaction.findMany({
            where: {
                messageID: msg.id,
            }
        });

        if (user) messages.push({
            id: msg.id,
            author: {
                id: user.id,
                image: user.image as string,
                name: user.displayUsername || user.name,
                role: user.role as string
            },
            content: Buffer.from(new Uint8Array(Object.values(msg.content))).toString('utf8'),
            timestamp: new Date(msg.createdAt).getTime(),
            channel: {
                id: '1',
            },
            reactions: reactions,
        });
    }
    return messages;
}