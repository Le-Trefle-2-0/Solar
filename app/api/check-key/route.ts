import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/lib/auth";
import prisma from "@/lib/prisma";

const keySchema = z.object({
    key: z.string()
})

export async function POST(req: NextRequest) {
    try {
        const b = await req.json();
        const body = keySchema.parse(b);
        const {valid, error, key} = await auth.api.verifyApiKey({
            body: {
                key: body.key,
            },
        });

        if (valid) {
            const user = await prisma.user.findUnique({
                where: {
                    id: key?.userId,
                }
            });

            if (user) return NextResponse.json({valid, key, user}, {status: 200})
        }

        return NextResponse.json({valid, key}, {status: 200})
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({success: false, errors: err.flatten()}, {status: 400});
        }
        return NextResponse.json({success: false, message: "Internal server error"}, {status: 500});
    }
}