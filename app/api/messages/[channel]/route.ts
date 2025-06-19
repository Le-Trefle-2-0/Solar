import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {Msg} from "@/lib/interface";
import {getMessages} from "@/lib/messageManager";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ channel: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    // if (!session) {
    //     return new Response('Unauthorized', {
    //         status: 401,
    //     });
    // }
    const {channel} = await params;
    const message = await prisma.message.findMany({
        where: {
            channelId: channel
        }
    });

    let messages: Msg[] = await getMessages(channel);
    return Response.json(messages);
}