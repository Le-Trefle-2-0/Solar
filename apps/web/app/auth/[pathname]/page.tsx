import {authViewPaths} from "@daveyplate/better-auth-ui/server"
import {AuthView} from "./view"
import {redirect} from "next/navigation";
import {constructMetadata} from "@/lib/metadata";
import prisma from "@/lib/prisma";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {InfoIcon} from "lucide-react";

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

export const dynamic = "force-dynamic";

export default async function AuthPage({params}: { params: Promise<{ pathname: string }> }) {
    const {pathname} = await params

    const userCount = await prisma.user.count();
    const isFirstAccount = userCount === 0;

    // Si on essaie d'accéder à sign-in alors qu'aucun compte n'existe, on redirige vers sign-up
    if (isFirstAccount && pathname === "sign-in") {
        redirect("/auth/sign-up");
    }

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            {isFirstAccount && (
                <Alert className="max-w-[400px] border-primary/50 bg-primary/5">
                    <InfoIcon className="h-4 w-4 text-primary"/>
                    <AlertTitle>Installation du système</AlertTitle>
                    <AlertDescription>
                        {pathname === "sign-up"
                            ? "Créez maintenant votre premier compte administrateur pour configurer votre instance Solar."
                            : "Aucun compte n'a été détecté. Veuillez créer le premier compte administrateur pour configurer votre instance Solar."}
                    </AlertDescription>
                </Alert>
            )}
            <AuthView pathname={pathname}/>
        </div>
    )
}
