import {NextRequest, NextResponse} from "next/server";
import {createTicket} from "@/lib/ticketManager";

// Create a ticket for a website visitor without Discord chatbot
// We generate a synthetic visitor identifier so we don't need schema changes
export async function POST(_req: NextRequest) {
    try {
        const syntheticId = `web:${crypto.randomUUID()}`;
        const ticket = await createTicket(syntheticId);
        return NextResponse.json({success: true, ticket}, {status: 200});
    } catch (e) {
        return NextResponse.json({success: false, message: 'Internal server error'}, {status: 500});
    }
}
