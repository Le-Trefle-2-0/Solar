import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const reactionAddSchema = z.object({
        id: z.string().optional(),
        messageID: z.number(),
        authorID: z.string(),
        reaction: z.string(),
        option: z.string(),
    });

    try {
        const verifiedBody = reactionAddSchema.parse(body);
        if (verifiedBody.option == "add") {
            const reaction = await prisma.reaction.create({
                data: {
                    messageID: verifiedBody.messageID,
                    userID: verifiedBody.authorID,
                    emoji: verifiedBody.reaction
                }
            });

            return NextResponse.json({success: true, reaction}, {status: 200});
        } else if (verifiedBody.option == "remove") {
            const reaction = await prisma.reaction.delete({
                where: {
                    id: verifiedBody.id,
                    userID: verifiedBody.authorID
                }
            });

            if (reaction) return NextResponse.json({success: true, reaction}, {status: 200});
            else return NextResponse.json({success: false, error: "Reaction not found"}, {status: 400});
        } else return NextResponse.json({success: false, error: "Bad request"}, {status: 400});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({success: false, error: e.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, e}, {status: 500});
    }
}