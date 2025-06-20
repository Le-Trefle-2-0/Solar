import {auth} from "@/lib/auth";
import {headers} from "next/headers";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ channel: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
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


}