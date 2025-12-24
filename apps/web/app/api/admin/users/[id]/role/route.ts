import {NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export async function POST(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== 'admin') {
        return new NextResponse('Unauthorized', {status: 401});
    }

    const {id} = await params;
    const {roles} = await request.json();

    if (!Array.isArray(roles)) {
        return new NextResponse('Invalid roles', {status: 400});
    }

    const user = await prisma.user.update({
        where: {id},
        data: {
            role: roles.join(',')
        }
    });

    return NextResponse.json({user});
}
