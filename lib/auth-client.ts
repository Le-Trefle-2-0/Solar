import {createAuthClient} from "better-auth/react";
import {
    adminClient,
    emailOTPClient,
    organizationClient,
    twoFactorClient,
    usernameClient
} from "better-auth/client/plugins";
import {ac, admin, myCustomRole, user} from "@/lib/permissions";


export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    plugins: [
        emailOTPClient(),
        adminClient({
            ac, roles: {
                admin, user, myCustomRole
            }
        }),
        organizationClient(),
        twoFactorClient(),
        usernameClient()
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