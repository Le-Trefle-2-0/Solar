import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const bodySchema = z.object({
        image: z.string()
    });
    const body = await req.json()

    try {
        const verified = await bodySchema.parse(body);

        const image = await prisma.image.create({
            data: {
                link: verified.image
            }
        });

        return NextResponse.json({success: true, image}, {status: 200});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({success: false, error: error.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, error: error}, {status: 500});
    }
}