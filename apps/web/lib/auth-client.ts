import {createAuthClient} from "better-auth/react";
import {
    adminClient,
    apiKeyClient,
    emailOTPClient,
    organizationClient,
    twoFactorClient,
    usernameClient
} from "better-auth/client/plugins";
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
    forgetPassword,
    resetPassword,
} = authClient;