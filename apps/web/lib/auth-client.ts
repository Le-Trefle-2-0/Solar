import {createAuthClient} from "better-auth/react";
import {
    adminClient,
    apiKeyClient,
    emailOTPClient,
    organizationClient,
    twoFactorClient,
    usernameClient
} from "better-auth/client/plugins";
import {ac, admin, bot, manager, training, volunteer} from "@/lib/permissions";


import {getApiBase} from "@/lib/api";

export const authClient = createAuthClient({
    baseURL: getApiBase(),
    plugins: [
        emailOTPClient(),
        adminClient({
            ac, roles: {
                training, volunteer, manager, bot, admin
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