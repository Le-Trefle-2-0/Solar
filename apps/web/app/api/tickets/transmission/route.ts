import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const bodySchema = z.object({
        channelID: z.string(),
        problematic: z.string(),
        observations: z.string(),
        info: z.string().optional(),
    });
    const body = await req.json()

    try {
        const verifiedBody = bodySchema.parse(body);

        const ticket = await prisma.ticket.findUnique({
            where: {
                channelId: verifiedBody.channelID,
            }
        });

        if (!ticket) return NextResponse.json({success: false, error: "No ticket found"}, {status: 400});

        const status = await prisma.ticketStatus.findUnique({
            where: {
                name: "commented"
            }
        });

        if (!status) return NextResponse.json({success: false, error: status}, {status: 500});

        const update = await prisma.ticket.update({
            where: {
                id: ticket.id
            },
            include: {
                status: true
            },
            data: {
                problematic: verifiedBody.problematic,
                observations: verifiedBody.observations,
                info: verifiedBody.info,
                statusName: status.name,
                statusLabel: status.label,
            }
        });

        return NextResponse.json({success: true, update}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({success: false, error: e.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, error: e}, {status: 500});
    }
}