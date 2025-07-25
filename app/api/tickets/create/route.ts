import {NextRequest, NextResponse} from "next/server";
import {createTicket, findTicket} from "@/lib/ticketManager";
import {auth} from "@/lib/auth";
import {z} from "zod";

const bodySchema = z.object({
    discordUserID: z.string(),
    token: z.string(),
})

export async function POST(req: NextRequest) {
    const body = await req.json();
    try {
        const verifiedBody = bodySchema.parse(body);
        const {valid, error, key} = await auth.api.verifyApiKey({
            body: {
                key: verifiedBody.token
            }
        });

        if (!valid) return new Response('Unauthorized', {status: 401});

        const hasTicket = await findTicket(verifiedBody.discordUserID);
        if (!hasTicket) return NextResponse.json({
            success: false,
            error: "User already has an open ticket"
        }, {status: 401});

        const ticket = await createTicket(verifiedBody.discordUserID);
        return NextResponse.json({success: true, ticket}, {status: 200});

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}