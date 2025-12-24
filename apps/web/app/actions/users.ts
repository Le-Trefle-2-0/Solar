"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {z} from "zod";
import prisma from "@/lib/prisma";
import {hashPassword} from "better-auth/crypto";

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    roles: z.array(z.string()).min(1),
});

export async function inviteUserAction(formData: z.infer<typeof inviteSchema>) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
        return {error: "Unauthorized"};
    }

    const validated = inviteSchema.safeParse(formData);
    if (!validated.success) {
        return {error: "Invalid data"};
    }

    const {name, email, roles} = validated.data;
    const primaryRole = roles[0];
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

    try {
        // 1. Create User and Account via Prisma to ensure reliability
        console.log(`[inviteAction] Creating user ${email}`);

        const userId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const hashedPassword = await hashPassword(tempPassword);

        const userData = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: userId,
                    email: email.toLowerCase(),
                    name,
                    emailVerified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    role: roles.join(","),
                },
            });

            await tx.account.create({
                data: {
                    id: Math.random().toString(36).slice(2),
                    userId: user.id,
                    accountId: user.id,
                    providerId: "credential",
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            return user;
        });

        // 2. Trigger Forget Password (which calls our sendResetPassword hook)
        console.log(`[inviteAction] Triggering forgetPassword for ${email}`);

        // Better Auth 1.4.6 uses forgetPassword on the client, but the server API 
        // operationId is requestPasswordReset for emailAndPassword plugin.
        const forgetPassword = (auth.api as any).forgetPassword || (auth.api as any).requestPasswordReset;

        if (typeof forgetPassword === "function") {
            await forgetPassword({
                body: {
                    email: email.toLowerCase(),
                    redirectTo: "/auth/reset-password",
                },
            });
        } else {
            console.error("[inviteAction] Could not find forgetPassword or requestPasswordReset on auth.api. Keys:", Object.keys(auth.api));
            throw new Error("Authentication API configuration error");
        }

        return {success: true, user: userData};
    } catch (e: any) {
        console.error("[inviteAction] Error:", e);
        return {error: e.message || "An error occurred during invitation"};
    }
}
