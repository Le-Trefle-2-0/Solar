import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
    id: z.string(),
    discordID: z.string(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const reaction = await prisma.reaction.findUnique({
            where: {
                id: verifiedBody.id,
            }
        });

        if (!reaction) return NextResponse.json({success: false, error: "No reaction found"}, {status: 404});

        // const update = await prisma.reaction.update({
        //     where: {
        //         id: verifiedBody.id
        //     }, data: {
        //         discordID: verifiedBody.discordID,
        //     }
        // });

        return NextResponse.json({success: true}, {status: 200});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({success: false, error: e.flatten()}, {status: 400});
        } else return NextResponse.json({success: false, error: e}, {status: 500});
    }
}