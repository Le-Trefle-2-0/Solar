"use server"
import prisma from "@/lib/prisma";
import {Msg} from '@/lib/interface'

export const saveMessage = async (msg: Msg) => {
    return new Promise(async (resolve, reject) => {
        const message = await prisma.message.create({
            data: {
                createdAt: new Date(),
                userId: msg.author.id,
                channelId: '1',
                content: msg.content,
            }
        });

        resolve(message);
    })
}

export const getMessages = async (channelId: string) => {
    const message = await prisma.message.findMany({
        where: {
            channelId
        }
    });

    let messages: Msg[] = []
    for (const msg of message) {
        let user = await prisma.user.findUnique({
            where: {
                id: msg.userId,
            }
        });

        if (user) messages.push({
            author: {
                id: user.id,
                image: user.image as string,
                name: user.name
            },
            content: msg.content,
            timestamp: new Date(msg.createdAt).getTime(),
            channel: {
                id: '1',
            }
        });
    }
    console.log(messages);
    return messages;
}