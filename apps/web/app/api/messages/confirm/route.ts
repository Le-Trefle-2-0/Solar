import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
    id: z.number(),
    discordID: z.string(),
})

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);

        const message = await prisma.message.findUnique({
            where: {
                id: verifiedBody.id,
            }
        })

        if (!message) return NextResponse.json({success: false, error: "Not found"}, {status: 404})

        const update = await prisma.message.update({
            where: {
                id: message.id
            }, data: {
                discordID: verifiedBody.discordID,
            }
        });

        return NextResponse.json({success: true, message}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({success: false, error: e.flatten()}, {status: 400});
        } else return NextResponse.json({success: false, error: e}, {status: 500});
    }
}