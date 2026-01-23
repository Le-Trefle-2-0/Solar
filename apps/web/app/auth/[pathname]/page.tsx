import {authViewPaths} from "@daveyplate/better-auth-ui/server"
import {AuthView} from "./view"
import {constructMetadata} from "@/lib/metadata";

export function generateStaticParams() {
    return Object.values(authViewPaths).map((pathname) => ({pathname}))
}

export async function generateMetadata({params}: { params: Promise<{ pathname: string }> }) {
    const {pathname} = await params

    let title = "Connexion";
    if (pathname === "sign-up") title = "Inscription";
    if (pathname === "forgot-password") title = "Mot de passe oublié";
    if (pathname === "reset-password") title = "Réinitialisation du mot de passe";

    return constructMetadata({
        title,
        noIndex: true,
    });
}

export default async function AuthPage({params}: { params: Promise<{ pathname: string }> }) {
    const {pathname} = await params

    return <AuthView pathname={pathname}/>
}