import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import type {Channel} from "@prisma/client"

export async function POST(req: NextRequest) {
    const bodySchema = z.object({
        id: z.string()
    });

    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const channels = await prisma.channel.findMany();
        const accessedChannels: Channel[] = [];
        for (const channel of channels) {
            if (channel.id == "1") accessedChannels.push(channel);
            const ticket = await prisma.ticket.findUnique({
                where: {
                    channelId: channel.id,
                },
                include: {
                    status: true
                }
            });
            if (ticket) {
                if (ticket.status.id !== 4) {
                    const perm = await auth.api.userHasPermission({
                        body: {
                            userId: verifiedBody.id,
                            permissions: {
                                tickets: ['read_all']
                            }
                        },
                    });
                    if (perm.success) accessedChannels.push(channel);
                    else if (ticket.assignedUserId == verifiedBody.id) accessedChannels.push(channel);
                }
            }
        }

        return NextResponse.json({success: true, accessedChannels}, {status: 200});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({success: false, error: error.flatten()}, {status: 400})
        }
    }
}