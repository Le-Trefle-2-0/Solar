import {NextRequest, NextResponse} from "next/server";
import {getEvents, saveEvent} from "@/lib/eventManager";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

const EventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    userId: z.string().min(1),
    roleSlots: z.array(
        z.object({
            role: z.string().min(1),
            goalCount: z.number().int().nonnegative(),
        })
    ),
});

export async function POST(req: NextRequest) {
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

    // const perm = await auth.api.userHasPermission({
    //     body: {
    //         userId: session?.user.id,
    //         permissions: {
    //             event: ['view']
    //         }
    //     }
    // });
    //
    // if (!perm.success) {
    //     return new Response('Unauthorized', {status: 401,});
    // }

    try {
        const body = await req.json();
        const validated = EventSchema.parse(body);
        const event = await saveEvent(validated);
        return NextResponse.json({success: true, event}, {status: 201});
    } catch (err) {
        console.error("Event creation failed:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    // const perm = await auth.api.userHasPermission({
    //     body: {
    //         userId: session?.user.id,
    //         permissions: {
    //             event: ['view']
    //         }
    //     }
    // });
    //
    // if (!perm.success) {
    //     return new Response('Unauthorized', {status: 401,});
    // }

    try {
        const events = await getEvents();
        return NextResponse.json({success: true, events});
    } catch (err) {
        console.error("Failed to fetch events:", err);
        return NextResponse.json({success: false, message: "Failed to load events"}, {status: 500});
    }
}
