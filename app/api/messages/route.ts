import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
    id: z.number(),
})

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const message = await prisma.message.findUnique({
            where: {
                id: verifiedBody.id
            },
            include: {
                channel: true
            }
        });

        if (!message) return NextResponse.json({success: false, error: "Not found"}, {status: 404});
        return NextResponse.json({success: true, message}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({success: false, error: e.flatten()}, {status: 400});
        } else return NextResponse.json({success: false, error: "Internal Server Error"}, {status: 500});
    }
}