import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
    ticketID: z.number(),
    assignmentID: z.string(),
})

export async function POST(req: NextRequest) {
    // const session = await auth.api.getSession({
    //     headers: await headers()
    // });
    // if (!session) return new Response('unauthorized', { status: 401 });
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const ticket = await prisma.ticket.findUnique({
            where: {
                id: verifiedBody.ticketID
            }
        });

        if (!ticket) return new Response('Ticket not found', {status: 400});

        const user = await prisma.user.findUnique({
            where: {
                id: verifiedBody.assignmentID
            }
        });

        if (!user) return new Response('User not found', {status: 400});

        const status = await prisma.ticketStatus.findUnique({
            where: {
                name: "started"
            }
        });

        if (!status) return NextResponse.json({success: false, error: status}, {status: 500});

        const update = await prisma.ticket.update({
            where: {
                id: verifiedBody.ticketID,
            },
            include: {
                status: true,
            },
            data: {
                assignedUserId: user.id,
                updatedAt: new Date(),
                statusName: status.name,
                statusLabel: status.label,
            }

        });

        return NextResponse.json({success: true, update}, {status: 200});

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}