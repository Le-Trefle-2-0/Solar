import {NextRequest, NextResponse} from "next/server";
import {createTicket} from "@/lib/ticketManager";
import {auth} from "@/lib/auth";
import {z} from "zod";

const bodySchema = z.object({
    discordUserID: z.string(),
    token: z.string(),
})

export async function POST(req: NextRequest, res: NextResponse) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const {valid, error, key} = await auth.api.verifyApiKey({
            body: {
                key: verifiedBody.token
            }
        });

        if (!valid) return new Response('Unauthorized', {status: 401});

        const ticket = await createTicket(verifiedBody.discordUserID);
        return NextResponse.json({success: true, ticket}, {status: 200});

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}