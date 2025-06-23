import {betterAuth} from "better-auth";
import {dashboardPlugin} from "better-auth-dashboard";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {PrismaClient} from "@/generated/prisma";
import {resend} from "@/lib/resend";
import {ac, admin, myCustomRole, user} from "./permissions"
import {
    admin as adminPlugin,
    apiKey,
    bearer,
    emailOTP,
    jwt,
    organization,
    twoFactor,
    username
} from "better-auth/plugins";

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
        }),
        adminPlugin({
            ac, roles: {
                admin, user, myCustomRole
            }
        }),
        organization(),
        twoFactor(),
        username(),
        apiKey({
            rateLimit: {
                enabled: false
            }
        }),
        jwt(),
        bearer(),
        dashboardPlugin()
    ],
    account: {
        accountLinking: {
            enabled: true
        }
    },
    socialProviders: {
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
        }
    }
});