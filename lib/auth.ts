import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import {resend} from "@/lib/resend";
import {emailOTP} from "better-auth/plugins";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            await resend.emails.send({
                from: "noreply@solar.letrefle.org",
                to: data.user.email,
                subject: "Réinitialisation de mot de passe",
                html: data.url
            });
        },
        autoSignIn: true,
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                await resend.emails.send({
                    from: "noreply@solar.letrefle.org",
                    to: email,
                    subject: "OTP connection",
                    html: otp
                });
            }
        })
    ]
});