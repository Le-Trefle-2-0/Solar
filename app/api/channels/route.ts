import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";

export async function POST(req: NextRequest) {
    const bodySchema = z.object({
        id: z.string()
    });

    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const channels = await prisma.channel.findMany();
        const accessedChannelIDs: string[] = [];
        for (const channel of channels) {
            if (channel.id == "1") accessedChannelIDs.push(channel.id);
            const ticket = await prisma.ticket.findUnique({
                where: {
                    channelId: channel.id,
                }
            });
            if (ticket) {
                const perm = await auth.api.userHasPermission({
                    body: {
                        userId: verifiedBody.id,
                        permissions: {
                            tickets: ['read_all']
                        }
                    }
                });

                if (perm.success) accessedChannelIDs.push(channel.id);
                else if (ticket.assignedUserId == verifiedBody.id) accessedChannelIDs.push(channel.id);

                console.log(perm);
            }
        }

        return NextResponse.json({success: true, accessedChannelIDs}, {status: 200});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({success: false, error: error.flatten()}, {status: 400})
        }
    }
}