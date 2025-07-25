import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const event = await prisma.event.findFirst({
        where: {
            start: {
                lte: new Date()
            },
            end: {
                gte: new Date(Date.now() + 15 * 60 * 1000)
            }
        }
    });

    if (!event) {
        return NextResponse.json({success: true, open: false}, {status: 200});
    } else return NextResponse.json({success: true, open: true}, {status: 200});
}