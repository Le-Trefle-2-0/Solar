import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/lib/auth";

const keySchema = z.object({
    key: z.string()
})

export async function POST(req: NextRequest) {
    const b = await req.json();
    const body = keySchema.parse(b);
    const {valid, error, key} = await auth.api.verifyApiKey({
        body: {
            key: body.key,
        },
    });

    return NextResponse.json(valid, {status: 200})
}