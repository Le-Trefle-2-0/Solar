import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {findEvent, registerUserToEvent, unregisterUserToEvent} from "@/lib/eventManager";
import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";

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

const RegisterSchema = z.object({
    part: z.enum(['first', 'second']).optional(),
    roleSlotId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    type: z.enum(['register', 'unregister']),
});

export async function POST(req: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const body = await req.json();

    const {id} = await params;

    if (!session) {
        return new Response("Unauthorized", {status: 401});
    }

    try {
        const verifiedBody = RegisterSchema.parse(body);
        const userRole = session.user.role;

        const partToRegister = userRole?.includes('volunteer') ? verifiedBody.part : undefined;
        const roleSlotId = verifiedBody.roleSlotId;
        if (verifiedBody.type == "register") {
            const reg = await registerUserToEvent(id, session.user.id, partToRegister, roleSlotId);
            const event = await findEvent(reg.eventId || id);
            return Response.json(event);
        } else {
            const reg = await unregisterUserToEvent(id, session.user.id, partToRegister, roleSlotId);
            const event = await findEvent(reg.eventId || id);
            return Response.json(event);
        }
    } catch (err) {
        console.error("Event registration failed:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}