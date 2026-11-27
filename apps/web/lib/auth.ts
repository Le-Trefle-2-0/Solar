import {betterAuth} from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import {getResendClient} from "@/lib/resend";
import {renderEmailTemplate} from "@/lib/email-template";
import {ac, admin, bot, manager, newsletterManager, none, training, volunteer} from "./permissions";
// Namespace import to access optional plugins that may not exist in older versions
import {
    admin as adminPlugin,
    bearer,
    jwt,
    openAPI,
    organization,
    twoFactor,
    username
} from "better-auth/plugins";
import {apiKey} from "@better-auth/api-key";
import {userAdditionalFields} from "./security/userFields";
import {APIError} from "better-auth/api";
import {allowResetEmail} from "./security/resetEmailLimit";
import {escapeHtml} from "./security/escape";

/** A profile photo (data URL) of about 300 KB at most; the WebSocket service drops larger ones. */
const MAX_AVATAR_LENGTH = 400_000;

/** Same key as OWNER_SETTING_KEY in lib/userPermissions.ts and the API. */
const OWNER_SETTING_KEY = "owner_user_id";
import {passkey} from "@better-auth/passkey";

// No sign-in by e-mail code: the app never offered it, and it bypassed the second factor and
// could send codes to any address (#251, #252).
const pluginList: any[] = [
    adminPlugin({
        ac, roles: {
            training, volunteer, manager, bot, admin, newsletterManager, none
        },
        // Its endpoints are blocked in hooks.before; kept for the role/ban columns it manages
        adminRoles: ['admin'],
        // Also applied when a stored role is empty, so it must grant nothing
        defaultRole: 'none',
    }),
    organization(),
    twoFactor(),
    username(),
    apiKey({
        rateLimit: {
            enabled: false
        },
        // better-auth 1.7 calls the owner column `referenceId`; keep the existing `userId`
        // column, which the API reads (#244)
        schema: {apikey: {fields: {referenceId: "userId"}}},
    }),
    jwt({
        jwt: {
            expirationTime: "15m",
            // The API, the realtime and the voice services check that this session is still
            // open: signing out or resetting the password ends their access at once (#276)
            definePayload: ({user, session}) => ({...user, sid: session.id}),
        },
    }),
    // The app signs in with cookies only: a session token sent as "Authorization: Bearer", and
    // the set-auth-token response header, only when explicitly enabled
    ...(process.env.AUTH_BEARER_TOKENS === "true" ? [bearer()] : []),
    passkey(),
];

// The OpenAPI reference loads a third-party script: development only (#282)
if (process.env.NODE_ENV !== "production") pluginList.push(openAPI());

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
        additionalFields: userAdditionalFields,
    },
    database: prismaAdapter(prisma, {
        provider: "mysql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            // At most a few reset e-mails per address and per hour, whoever asks (#252)
            if (!allowResetEmail(data.user.email)) {
                console.warn("[auth] reset e-mail skipped: too many requests for this address");
                return;
            }
            console.log(`[auth] sendResetPassword triggered for ${data.user.email}`);
            const resend = getResendClient();

            const title = "Réinitialisation de mot de passe";
            const subject = "Le Trèfle 2.0 - Réinitialisation de mot de passe";
            const buttonText = "Réinitialiser mon mot de passe";

            const content = `
                <p>Bonjour ${escapeHtml(data.user.name || "")},</p>
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
        // A new password closes every open session, including the one that may have leaked (#276)
        revokeSessionsOnPasswordReset: true,
    },
    // Better Auth's limiter (in memory: one web instance). Server-side auth.api calls are not
    // counted, so password changes go through the client endpoints (#252).
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": {window: 60, max: 5},
            "/sign-in/username": {window: 60, max: 5},
            "/change-password": {window: 300, max: 5},
            "/request-password-reset": {window: 300, max: 3},
            "/reset-password": {window: 300, max: 5},
            "/two-factor/verify-totp": {window: 60, max: 5},
            "/two-factor/verify-backup-code": {window: 60, max: 5},
        },
    },
    hooks: {
        before: async (context) => {
            const path = (context as any)?.request?.url || (context as any)?.path || "";
            // Better Auth's admin endpoints (set-role, ban, remove-user, impersonate...) only know
            // role names and would bypass the owner and the role hierarchy. Users and roles are
            // managed through the API and server actions instead.
            const endpoint = (context as any)?.path || "";
            if (endpoint.startsWith("/admin/") || path.includes("/api/auth/admin/")) {
                throw new APIError("FORBIDDEN", {message: "Not available"});
            }
            // Plugin endpoints no screen of the app calls stay closed unless explicitly enabled:
            // API keys (the bot's key is made by the API itself), sign-in by username,
            // organizations. Checked on the matched endpoint, before its body is validated.
            // better-auth-ui's provider reads the organization list and the active organization on
            // every signed-in page: those two stay open, and answer empty since nobody can join one.
            const organizationRead = endpoint === "/organization/list" || endpoint === "/organization/get-full-organization";
            if ((endpoint.startsWith("/api-key/") && process.env.AUTH_API_KEY_ENDPOINTS !== "true")
                || ((endpoint === "/sign-in/username" || endpoint === "/is-username-available")
                    && process.env.AUTH_USERNAME_SIGN_IN !== "true")
                || (endpoint.startsWith("/organization/") && !organizationRead && process.env.AUTH_ORGANIZATIONS !== "true")) {
                throw new APIError("NOT_FOUND", {message: "Not available"});
            }
            // No e-mail verification is configured, so no verification link is ever sent: its
            // tokens are not parsed at all until it is (emailVerification or user.changeEmail)
            const authOptions = (context as any)?.context?.options;
            if (endpoint === "/verify-email" && !authOptions?.emailVerification?.sendVerificationEmail
                && !authOptions?.user?.changeEmail?.enabled) {
                throw new APIError("NOT_FOUND", {message: "Not available"});
            }
            // Profile fields: bounded, an avatar is a small image (#262)
            if (endpoint === "/update-user") {
                const body = ((context as any)?.body ?? {}) as { name?: unknown; image?: unknown };
                if (body.name !== undefined && (typeof body.name !== "string" || body.name.length > 100)) {
                    throw new APIError("BAD_REQUEST", {message: "Nom trop long (100 caractères au plus)."});
                }
                if (body.image !== undefined && body.image !== null
                    && (typeof body.image !== "string" || body.image.length > MAX_AVATAR_LENGTH)) {
                    throw new APIError("BAD_REQUEST", {message: "Image de profil trop lourde."});
                }
            }
            if (path.includes("sign-up")) {
                const userCount = await prisma.user.count();
                if (userCount > 0) {
                    throw new Error("Registration is closed. Please contact an administrator.");
                }
            }
            return context;
        }
    },
    databaseHooks: {
        session: {
            create: {
                // Discord sign-in has no second factor: accounts that enabled it sign in with
                // their password (then the code) or a passkey (#251)
                before: async (session, ctx) => {
                    const path = (ctx as any)?.path || "";
                    if (!path.startsWith("/callback/") && !path.startsWith("/oauth2/callback/")) return;
                    const user = await prisma.user.findUnique({where: {id: session.userId}, select: {twoFactorEnabled: true}});
                    if (user?.twoFactorEnabled) {
                        throw new APIError("FORBIDDEN", {
                            message: "La double authentification est activée sur ce compte : connectez-vous avec votre mot de passe ou une clé de sécurité.",
                        });
                    }
                },
            },
        },
        user: {
            create: {
                // The very first account (created at setup, sign-up is closed afterwards) owns the app
                after: async (user) => {
                    const owner = await prisma.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
                    if (owner?.value) return;
                    const topRole = await prisma.role.findFirst({orderBy: {weight: "desc"}, select: {name: true}});
                    await prisma.$transaction([
                        prisma.settings.create({data: {key: OWNER_SETTING_KEY, value: user.id}}),
                        prisma.user.update({where: {id: user.id}, data: {role: topRole?.name ?? "none"}}),
                    ]);
                },
            },
        },
    },
    plugins: pluginList as any,
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true
        }
    },
    socialProviders: {
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
            // Discord can only be linked to an existing (invited) account
            disableSignUp: true,
        }
    }
});