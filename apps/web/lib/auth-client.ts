import {createAuthClient} from "better-auth/react";
import {
    adminClient,
    emailOTPClient,
    organizationClient,
    twoFactorClient,
    usernameClient
} from "better-auth/client/plugins";
import {passkeyClient} from "@better-auth/passkey/client";
import {apiKeyClient} from "@better-auth/api-key/client";
import {ac, admin, bot, manager, newsletterManager, training, volunteer} from "@/lib/permissions";


import {getWebBase} from "@/lib/api";

export const authClient = createAuthClient({
    baseURL: getWebBase(),
    plugins: [
        emailOTPClient(),
        adminClient({
            ac, roles: {
                training, volunteer, manager, bot, admin, newsletterManager
            }
        }),
        organizationClient(),
        twoFactorClient(),
        passkeyClient(),
        usernameClient(),
        apiKeyClient()
    ]
})

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    emailOtp,
} = authClient;