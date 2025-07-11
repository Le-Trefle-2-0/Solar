import {NextResponse} from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    const {id} = await params;
    const user = await prisma.user.findFirst({
        where: {
            id
        }
    });

    if (!user) return new NextResponse('Not found', {status: 404})
    return Response.json(user)
}