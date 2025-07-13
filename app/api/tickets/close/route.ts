import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {z} from "zod";
import {createHash} from "crypto"

const bodySchema = z.object({
    id: z.number(),
})

export async function POST(req: NextRequest) {
    try {
        const verifiedBody = bodySchema.parse(req.body);
        const ticket = await prisma.ticket.findUnique({
            where: {
                id: verifiedBody.id
            }
        });

        if (!ticket) return NextResponse.json("No ticket found", {status: 400});

        const closedStatus = await prisma.ticketStatus.findUnique({
            where: {
                name: "closed"
            }
        });

        const update = await prisma.ticket.update({
            where: {
                id: ticket.id
            },
            data: {
                statusName: "closed",
                discordUserID: createHash('sha256').update(ticket.discordUserID).digest('hex')
            }
        });

        return NextResponse.json({sucess: true, update}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({sucess: false, error: e.flatten()}, {status: 400});
        }
        return NextResponse.json({sucess: false, error: e}, {status: 400});
    }
}