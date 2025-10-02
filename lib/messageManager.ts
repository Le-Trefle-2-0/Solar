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
                discordID: msg.discordID ?? undefined,
                replyID: msg.replyID ?? undefined,
            }
        });

    return (message);
}

export const getMessages = async (
    channelId: string,
    opts?: { limit?: number; before?: number }
) => {
    const limit = Math.max(1, Math.min(100, opts?.limit ?? 60));
    const beforeDate = opts?.before ? new Date(opts.before) : null;

    const prismaWhere = beforeDate
        ? {channelId, createdAt: {lt: beforeDate}}
        : {channelId};

    const raw = await prisma.message.findMany({
        where: prismaWhere,
        orderBy: {createdAt: 'desc'},
        take: limit,
    });

    const out: MsgWithID[] = [];
    for (const msg of raw) {
        const user = await prisma.user.findUnique({where: {id: msg.userId}});
        const reactions = await prisma.reaction.findMany({where: {messageID: msg.id}});
        if (user) {
            out.push({
                id: msg.id,
                author: {
                    id: user.id,
                    image: user.image as string,
                    name: (user.displayUsername || user.name) as string,
                    role: user.role as string,
                },
                content: Buffer.from(new Uint8Array(Object.values(msg.content))).toString('utf8'),
                timestamp: new Date(msg.createdAt).getTime(),
                channel: {id: channelId},
                discordID: msg.discordID,
                reactions,
                replyID: msg.replyID ?? null,
                edited: msg.edited,
            });
        }
    }
    return out.reverse();
}