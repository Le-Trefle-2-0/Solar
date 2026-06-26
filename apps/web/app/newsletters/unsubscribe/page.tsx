"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { unsubscribeById } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            autoUnsubscribe(id);
        } else {
            setStatus("error");
            setErrorMessage("Lien de désinscription invalide.");
        }
    }, [searchParams]);

    const autoUnsubscribe = async (id: string) => {
        setStatus("loading");
        const result = await unsubscribeById(id);
        if (result.success) {
            if (result.email) {
                setEmail(result.email);
            }
            setStatus("success");
        } else {
            setStatus("error");
            setErrorMessage(result.error || "Une erreur est survenue.");
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Désinscription</CardTitle>
                <CardDescription className="text-center">
                    {status === "loading" ? "Traitement de votre demande..." : "Mise à jour de vos préférences de newsletter."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {status === "loading" && (
                    <div className="flex flex-col items-center py-8">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground text-center">
                            Nous vous désinscrivons, veuillez patienter...
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center space-y-4 py-4 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <p className="text-lg font-medium">Vous avez été désinscrit avec succès.</p>
                        <p className="text-muted-foreground text-sm">
                            {email 
                                ? <>Vous ne recevrez plus de newsletters de notre part à l'adresse <strong>{email}</strong>.</>
                                : "Vous ne recevrez plus de newsletters de notre part."
                            }
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center space-y-4 py-4 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <p className="text-lg font-medium">Une erreur est survenue</p>
                        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100 w-full">
                            {errorMessage}
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
                <Link href="/" className="text-sm text-primary hover:underline">
                    Retour à l'accueil
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="container flex items-center justify-center min-h-[60vh] py-12">
            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Désinscription</CardTitle>
                        <CardDescription className="text-center">Chargement...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-8">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    </CardContent>
                </Card>
            }>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}
