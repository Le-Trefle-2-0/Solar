import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {Scale} from "lucide-react";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Mentions Légales",
    description: "Informations juridiques concernant l'association Le Trèfle 2.0.",
});

export default async function LegalPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 bg-muted/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div
                        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"/>
                    <div
                        className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"/>
                </div>

                <section className="py-20 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                            <Scale className="h-10 w-10"/>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight italic mb-6">
                            Mentions Légales
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Informations juridiques concernant l'association Le Trèfle 2.0.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
                        <div className="bg-background border rounded-3xl p-8 md:p-12 shadow-sm space-y-12">
                            <section>
                                <h2 className="text-2xl font-bold mb-4">Propriété du site</h2>
                                <p className="text-lg">
                                    Association Le Trèfle 2.0<br/>
                                    324, chemin de Goulsou<br/>
                                    30120 Le Vigan<br/>
                                    RNA : W30 300 5428
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">Responsable de publication</h2>
                                <p className="text-lg">
                                    Paul Peron-Redon, Technicien principal<br/>
                                    paul.peronredon@letrefle.org
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">Liens hypertextes</h2>
                                <p className="text-lg leading-relaxed">
                                    La création et la publication de liens menant vers l'URL https://letrefle.org/ ou
                                    toutes les pages en découlant est libre. L'association se reserve le droit d'exiger
                                    la suppression de tout lien menant vers son site internet.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">Hébergement</h2>
                                <p className="text-lg">
                                    Ce site internet est hébergé par le service <a href="https://azure.com"
                                                                                   className="text-primary hover:underline">Microsoft
                                    Azure</a> de la société Microsoft Ireland Operations Limited.<br/>
                                    37 Quai du Président Roosevelt<br/>
                                    92130 Issy-les-Moulineaux<br/>
                                    France
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold mb-4">Propriété Intellectuelle</h2>
                                <p className="text-lg leading-relaxed">
                                    Sauf mention contraire, tout contenu sur ce site relève de la propriété
                                    intellectuelle de l'association Le Trèfle 2.0, et est publié sous licence GPL-v3
                                </p>
                            </section>

                            <div className="pt-8 border-t text-sm text-muted-foreground">
                                Mentions légales du 5 mai 2023
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
