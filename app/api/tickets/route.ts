import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return new Response('unauthorized', {
            status: 401,
        });
    }
    let tickets = await prisma.ticket.findMany();

    return NextResponse.json(tickets, {status: 200});
}