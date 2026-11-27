"use client";

import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import {authClient} from "@/lib/auth-client";

/**
 * What an account the API refuses sees instead of the app: documents missing or refused
 * (the document dialog is shown over it), or a suspended account. Nothing here calls the API
 * or the realtime service, which would only answer "unauthorized".
 */
export function AccountOnHold({reason}: { reason: "documents" | "suspended" }) {
    const router = useRouter();
    const signOut = () => authClient.signOut({fetchOptions: {onSuccess: () => router.push("/auth/sign-in")}});

    return (
        <main className="flex min-h-svh items-center justify-center bg-background p-4">
            <div className="max-w-md space-y-4 text-center">
                <h1 className="text-xl font-semibold">
                    {reason === "documents" ? "Votre compte attend vos documents" : "Votre compte est suspendu"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {reason === "documents"
                        ? "Envoyez votre pièce d'identité et votre extrait de casier judiciaire pour accéder à Solar. Vous pourrez l'utiliser dès l'envoi, pendant leur vérification."
                        : "Contactez un responsable de l'association pour en savoir plus."}
                </p>
                <Button variant="outline" onClick={signOut}>
                    <LogOut/> Se déconnecter
                </Button>
            </div>
        </main>
    );
}
