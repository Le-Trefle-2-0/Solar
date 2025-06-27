import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {getMessages} from "@/lib/messageManager";

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