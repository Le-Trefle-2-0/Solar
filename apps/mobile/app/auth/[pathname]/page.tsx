const authViewPaths = [
    "sign-in",
    "sign-up",
    "forget-password",
    "reset-password",
    "change-email",
    "verify-email",
    "two-factor",
    "two-factor/otp",
    "two-factor/totp",
    "two-factor/backup-code",
    "accept-invitation"
];

import {AuthView} from "./view"

export function generateStaticParams() {
    return authViewPaths.map((pathname) => ({pathname}))
}

export default async function AuthPage({params}: { params: Promise<{ pathname: string }> }) {
    const {pathname} = await params

    return <AuthView pathname={pathname}/>
}