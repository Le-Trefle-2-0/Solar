import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {z} from "zod";
import {createHash} from "crypto"

const bodySchema = z.object({
    channelID: z.string(),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    try {
        const verifiedBody = bodySchema.parse(body);
        const ticket = await prisma.ticket.findUnique({
            where: {
                channelId: verifiedBody.channelID
            }
        });

        if (!ticket) return NextResponse.json("No ticket found", {status: 400});

        const status = await prisma.ticketStatus.findUnique({
            where: {
                name: "closed"
            }
        });

        if (!status) return NextResponse.json({success: false, error: status}, {status: 500});

        const update = await prisma.ticket.update({
            where: {
                id: ticket.id
            },
            include: {
                status: true,
            },
            data: {
                statusName: status.name,
                statusLabel: status.label,
                discordUserID: createHash('sha256').update(ticket.discordUserID).digest('hex')
            }
        });

        return NextResponse.json({success: true, update}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({sucess: false, error: e.flatten()}, {status: 400});
        }
        return NextResponse.json({sucess: false, error: e}, {status: 400});
    }
}