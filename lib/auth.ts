import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import {resend} from "@/lib/resend";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            await resend.emails.send({
                from: "noreply@example.com",
                to: data.user.email,
                subject: "Réinitialisation de mot de passe",
                html: data.url
            });
        }
    },
});