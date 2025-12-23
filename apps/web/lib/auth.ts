import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import {PrismaClient} from "@prisma/client";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";
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
            const {html} = renderEmailTemplate({
                title: "Code de vérification",
                content: `
                    <p>Bonjour,</p>
                    <p>Voici votre code de vérification pour vous connecter à Solar :</p>
                    <div style="font-size: 32px; font-weight: 700; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px; color: #8cc088; border: 1px dashed #8cc088;">
                        ${otp}
                    </div>
                    <p>Ce code expirera dans 10 minutes.</p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                `,
            });
            const {error} = await resend.emails.send({
                from: "noreply@solar.letrefle.org",
                to: email,
                subject: "Solar - Votre code de vérification",
                html,
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
            const {html} = renderEmailTemplate({
                title: "Réinitialisation de mot de passe",
                content: `
                    <p>Bonjour ${data.user.name || ""},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Solar.</p>
                    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.url}" class="button">Réinitialiser mon mot de passe</a>
                    </div>
                    <p>Ce lien expirera bientôt.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                `,
            });
            const {error} = await resend.emails.send({
                from: "noreply@solar.letrefle.org",
                to: data.user.email,
                subject: "Solar - Réinitialisation de mot de passe",
                html,
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