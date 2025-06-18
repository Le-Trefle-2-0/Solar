import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {Msg} from "@/lib/interface";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ channel: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }
    const {channel} = await params;
    const message = await prisma.message.findMany({
        where: {
            channelId: channel
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
    return Response.json(messages);
}