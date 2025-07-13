import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
    channelID: z.string(),
})

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const ticket = await prisma.ticket.findUnique({
            where: {
                channelId: verifiedBody.channelID,
            }
        });

        if (!ticket) return new Response('No ticket found', {status: 400});

        return NextResponse.json({success: true, ticket}, {status: 200});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({success: false, error: error.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, error: error}, {status: 500});
    }
}