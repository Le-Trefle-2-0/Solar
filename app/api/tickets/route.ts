import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {Ticket} from "@/generated/prisma";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    let tickets: Ticket[] = [];
    if (!session) {
        const reqHeaders = await headers()
        const {valid, error, key} = await auth.api.verifyApiKey({
            body: {
                key: reqHeaders.get("token") as string
            }
        });

        if (!valid) return new Response('unauthorized', {
            status: 401,
        });
    }

    const perm = await auth.api.userHasPermission({
        body: {
            userId: session?.user.id,
            permission: {
                tickets: ["read_all"]
            }
        }
    });

    if (!perm.success) {
        console.log("NO READ ALL PERM");
        tickets = await prisma.ticket.findMany({
            where: {
                assignedUserId: session?.user.id,
                statusName: {
                    in: ["started", "closed"]
                }
            }
        });

        return NextResponse.json({success: true, tickets}, {status: 200});
    }

    tickets = await prisma.ticket.findMany({
        where: {
            statusName: {
                in: ["waiting", "started", "closed"]
            }
        }
    });
    return NextResponse.json({success: true, tickets}, {status: 200});
}