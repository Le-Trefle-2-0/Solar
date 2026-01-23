import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {Button} from "@/components/ui/button";
import {ArrowRight, CheckCircle} from "lucide-react";
import Link from "next/link";

export default async function DonationSuccessPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 flex items-center justify-center bg-muted/30 py-20">
                <div className="px-4 w-full max-w-lg text-center">
                    <div className="inline-flex p-4 rounded-full bg-primary/20 text-primary mb-6">
                        <CheckCircle className="h-16 w-16"/>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Merci pour votre don !</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        Votre générosité nous aide à poursuivre notre mission.
                        Vous recevrez prochainement un reçu fiscal par email de la part de HelloAsso.
                    </p>
                    <div className="flex flex-col gap-4">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full">
                            <Link href="/benevoles">
                                Découvrir nos opportunités de bénévolat <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
            <PublicFooter/>
        </div>
    );
}
