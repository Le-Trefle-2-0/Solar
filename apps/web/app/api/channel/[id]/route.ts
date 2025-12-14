import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {channelInfo} from "@/lib/channelsManager";

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
    const info = await channelInfo(id);

    return Response.json(info);
}