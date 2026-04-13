import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";
import {ac, admin, bot, manager, newsletterManager, training, volunteer} from "./permissions";
// Namespace import to access optional plugins that may not exist in older versions
import {
    admin as adminPlugin,
    bearer,
    emailOTP,
    jwt,
    openAPI,
    organization,
    twoFactor,
    username
} from "better-auth/plugins";
import {apiKey} from "@better-auth/api-key";
import {passkey} from "@better-auth/passkey";

const pluginList: any[] = [
    emailOTP({
        async sendVerificationOTP({email, otp, type}) {
            const resend = getResendClient();
            const {html} = renderEmailTemplate({
                title: "Code de vérification",
                content: `
                    <p>Bonjour,</p>
                    <p>Voici votre code de vérification pour vous connecter au Trèfle 2.0 :</p>
                    <div style="font-size: 32px; font-weight: 700; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px; color: #8cc088; border: 1px dashed #8cc088;">
                        ${otp}
                    </div>
                    <p>Ce code expirera dans 10 minutes.</p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                `,
            });
            const {error} = await resend.emails.send({
                from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
                to: email,
                subject: "Le Trèfle 2.0 - Votre code de vérification",
                html,
            });
            if (error) {
                console.error("Resend error sending OTP:", error);
            }
        }
    }),
    adminPlugin({
        ac, roles: {
            training, volunteer, manager, bot, admin, newsletterManager
        },
        adminRoles: ['admin', 'manager'],
        defaultRole: 'admin',
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
    passkey(),
];

// Always add OpenAPI at the end
pluginList.push(openAPI());

// Development-friendly base URL and trusted origins
const IS_DEV = process.env.NODE_ENV !== "production";
const APP_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn("[auth] BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL not set, falling back to http://localhost:3000");
}
const DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const TRUSTED_ORIGINS = Array.from(new Set(IS_DEV ? [APP_URL, ...DEFAULT_DEV_ORIGINS] : [APP_URL]));

export const auth = betterAuth({
    // Allow non-secure http origin in development and make origins explicit
    baseURL: APP_URL,
    trustedOrigins: TRUSTED_ORIGINS,
    advanced: {
        // Disable secure cookies on http during development so OAuth works on localhost
        useSecureCookies: !IS_DEV,
        trustProxy: true,
    },
    user: {
        additionalFields: {
            documentsStatus: {
                type: "string",
                required: false,
                defaultValue: "missing",
            },
            documentsSentAt: {
                type: "date",
                required: false,
            },
            documentsValidatedAt: {
                type: "date",
                required: false,
            },
            documentsRenewalAt: {
                type: "date",
                required: false,
            },
            documentsText: {
                type: "string",
                required: false,
            },
            firstName: {
                type: "string",
                required: false,
            },
            lastName: {
                type: "string",
                required: false,
            },
            birthDate: {
                type: "date",
                required: false,
            },
            addressStreet: {
                type: "string",
                required: false,
            },
            addressNumber: {
                type: "string",
                required: false,
            },
            addressPostalCode: {
                type: "string",
                required: false,
            },
            addressCity: {
                type: "string",
                required: false,
            },
            idCardFileId: {
                type: "string",
                required: false,
            },
            idCardStatus: {
                type: "string",
                required: false,
                defaultValue: "missing",
            },
            idCardRejectReason: {
                type: "string",
                required: false,
            },
            casierFileId: {
                type: "string",
                required: false,
            },
            casierStatus: {
                type: "string",
                required: false,
                defaultValue: "missing",
            },
            casierRejectReason: {
                type: "string",
                required: false,
            },
            newsletterSubscription: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
        }
    },
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            console.log(`[auth] sendResetPassword triggered for ${data.user.email}`);
            const resend = getResendClient();

            const title = "Réinitialisation de mot de passe";
            const subject = "Le Trèfle 2.0 - Réinitialisation de mot de passe";
            const buttonText = "Réinitialiser mon mot de passe";

            const content = `
                <p>Bonjour ${data.user.name || ""},</p>
                <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Le Trèfle 2.0.</p>
                <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.url}" class="button" style="color: white !important;">${buttonText}</a>
                </div>
                <p>Ce lien expirera bientôt.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
            `;

            const {html} = renderEmailTemplate({
                title,
                content,
            });

            console.log(`[auth] Sending reset email via Resend to ${data.user.email}`);
            const {error} = await resend.emails.send({
                from: "Le Trèfle 2.0 <noreply@solar.letrefle.org>",
                to: data.user.email,
                subject,
                html,
            });
            if (error) {
                console.error("[auth] Resend error sending email:", error);
            }
        },
        autoSignIn: true,
    },
    hooks: {
        before: async (context) => {
            const path = (context as any)?.request?.url || (context as any)?.path || "";
            if (path.includes("sign-up")) {
                const userCount = await prisma.user.count();
                if (userCount > 0) {
                    throw new Error("Registration is closed. Please contact an administrator.");
                }
            }
            return context;
        }
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