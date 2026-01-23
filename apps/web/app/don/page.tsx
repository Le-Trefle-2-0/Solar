import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {DonationForm} from "@/components/donations/donation-form";
import {Heart} from "lucide-react";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Faire un don",
    description: "Soutenez Le Trèfle 2.0. Vos dons nous permettent de maintenir nos services d'écoute gratuits et anonymes.",
});

export default async function DonationPage({
                                               searchParams,
                                           }: {
    searchParams: Promise<{ error?: string }>;
}) {
    const {error} = await searchParams;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 bg-muted/30">
                <section className="py-20 w-full">
                    <div className="px-4 md:px-8 w-full max-w-4xl mx-auto">
                        {error && (
                            <div
                                className="mb-8 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-center font-medium">
                                Une erreur est survenue lors de votre tentative de don. Veuillez réessayer.
                            </div>
                        )}
                        <div className="text-center mb-12">
                            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                                <Heart className="h-8 w-8 fill-current"/>
                            </div>
                            <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl italic mb-4">
                                Soutenez Le Trèfle 2.0
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Vos dons nous permettent de maintenir nos services d'écoute gratuits et anonymes,
                                de former nos bénévoles et de développer nos outils.
                            </p>
                        </div>

                        <DonationForm/>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            <div className="text-center space-y-2">
                                <div className="text-3xl font-bold text-primary">100%</div>
                                <div className="font-semibold text-sm uppercase tracking-wider">Sécurisé</div>
                                <p className="text-xs text-muted-foreground">Vos transactions sont protégées par
                                    HelloAsso.</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-3xl font-bold text-primary">66%</div>
                                <div className="font-semibold text-sm uppercase tracking-wider">Déductible</div>
                                <p className="text-xs text-muted-foreground">De vos impôts sur le revenu (dans la limite
                                    de 20% du revenu imposable).</p>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-3xl font-bold text-primary">0€</div>
                                <div className="font-semibold text-sm uppercase tracking-wider">Frais</div>
                                <p className="text-xs text-muted-foreground">Le Trèfle 2.0 reçoit l'intégralité de votre
                                    don.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
