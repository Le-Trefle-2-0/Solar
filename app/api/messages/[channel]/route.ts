import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {getMessages, saveMessage} from "@/lib/messageManager";
import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {Msg} from "@/lib/interface";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ channel: string }> }
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

    const {channel} = await params;

    const messages = await getMessages(channel);
    return Response.json(messages);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const messageSchema = z.object({
        author: z.object({
            id: z.string(),
            name: z.string(),
            image: z.string(),
        }),
        content: z.string(),
        timestamp: z.number(),
        channel: z.object({
            id: z.string(),
        }),
        token: z.string(),
    })
    try {
        const verifiedBody = messageSchema.parse(body);
        const {valid, error, key} = await auth.api.verifyApiKey({
            body: {
                key: verifiedBody.token
            }
        });

        if (!valid) return new Response('Unauthorized', {status: 401});

        const message = await saveMessage(verifiedBody as Msg);
        return NextResponse.json({success: true, message}, {status: 200});

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}