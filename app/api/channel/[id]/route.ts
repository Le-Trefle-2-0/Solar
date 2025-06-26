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
        return new Response('Unauthorized', {
            status: 401,
        });
    }
    const {id} = await params;
    const info = await channelInfo(id);

    return Response.json(info);
}