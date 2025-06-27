import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {findEvent, registerUserToEvent} from "@/lib/eventManager";
import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";

const RegisterSchema = z.object({
    userId: z.string().min(1),
});

export async function GET(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
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

    const {id} = await params;

    const event = await findEvent(id)
    return Response.json(event);
}

export async function POST(req: NextRequest,
                           {params}: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const {id} = await params;

    if (!session) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    const perm = await auth.api.userHasPermission({
        body: {
            userId: session?.user.id,
            permissions: {
                event: ['view']
            }
        }
    });

    if (!perm.success) {
        return new Response('Unauthorized', {status: 401,});
    }

    try {
        const reg = await registerUserToEvent(id, session?.user.id);
        const event = await findEvent(reg.eventId || id)
        return Response.json(event);
    } catch (err) {
        console.error("Event creation failed:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}