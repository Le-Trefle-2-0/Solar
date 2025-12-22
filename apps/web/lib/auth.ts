import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {PrismaClient} from "@prisma/client";
import {getResendClient} from "@/lib/resend";
import {ac, admin, bot, manager, training, volunteer} from "./permissions";
// Namespace import to access optional plugins that may not exist in older versions
import * as betterPlugins from "better-auth/plugins";
import {
    admin as adminPlugin,
    apiKey,
    bearer,
    emailOTP,
    jwt,
    openAPI,
    organization,
    twoFactor,
    username
} from "better-auth/plugins";

const prisma = new PrismaClient;

// Development-friendly base URL and trusted origins
const IS_DEV = process.env.NODE_ENV !== "production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const TRUSTED_ORIGINS = Array.from(new Set(IS_DEV ? [APP_URL, ...DEFAULT_DEV_ORIGINS] : [APP_URL]));

// Build plugin list and include passkey only if available in the installed better-auth version
const pluginList: any[] = [
    emailOTP({
        async sendVerificationOTP({email, otp, type}) {
            const resend = getResendClient();
            const {error} = await resend.emails.send({
                from: "noreply@solar.letrefle.org",
                to: email,
                subject: "OTP connection",
                html: otp
            });
            if (error) {
                console.error("Resend error sending OTP:", error);
            }
        }
    }),
    adminPlugin({
        ac, roles: {
            training, volunteer, manager, bot, admin
        },
        adminRoles: ['admin'],
        defaultRole: 'admin',
        // defaultRole: process.env.NODE_ENV === "production" ? "training" : "admin",
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
];

// Insert passkey plugin before openAPI if it exists and is a function
if (typeof (betterPlugins as any).passkey === 'function') {
    try {
        pluginList.push((betterPlugins as any).passkey());
        // eslint-disable-next-line no-console
        console.log("[auth] passkey plugin enabled");
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[auth] failed to initialize passkey plugin, continuing without it", e);
    }
} else {
    // eslint-disable-next-line no-console
    console.warn("[auth] passkey plugin not available in installed better-auth version; skipping");
}

// Always add OpenAPI at the end
pluginList.push(openAPI());

export const auth = betterAuth({
    // Allow non-secure http origin in development and make origins explicit
    baseURL: APP_URL,
    trustedOrigins: TRUSTED_ORIGINS,
    advanced: {
        // Disable secure cookies on http during development so OAuth works on localhost
        useSecureCookies: !IS_DEV,
    },
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            const resend = getResendClient();
            const {error} = await resend.emails.send({
                from: "noreply@solar.letrefle.org",
                to: data.user.email,
                subject: "Réinitialisation de mot de passe",
                html: data.url
            });
            if (error) {
                console.error("Resend error sending reset password email:", error);
            }
        },
        autoSignIn: true,
    },
    plugins: pluginList as any,
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