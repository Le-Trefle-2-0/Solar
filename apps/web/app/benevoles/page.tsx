import {getRecruitments} from "@/app/actions/recruitments";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {Card, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import * as Icons from "lucide-react";
import {cn} from "@/lib/utils";
import ReactMarkdown from "react-markdown";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Devenir Bénévole",
    description: "Rejoignez l'aventure Le Trèfle 2.0 et donnez de votre temps pour une cause qui a du sens. Découvrez nos opportunités de bénévolat.",
});

export const dynamic = "force-dynamic";

export default async function BenevolesPage() {
    const recruitments = await getRecruitments();
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1">
                <section className="py-20 bg-gradient-to-b from-primary/10 to-background dark:from-primary/5 w-full">
                    <div className="px-4 md:px-8 w-full max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl md:text-6xl italic mb-6 font-barlow">
                                « Une petite action pour vous, mais une grande aide pour les autres »
                            </h1>
                            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                                Vous souhaitez donner de votre temps pour une cause qui a du sens ?
                                Découvrez nos opportunités de bénévolat.
                            </p>
                        </div>

                        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
                            {recruitments.map((recruitment) => {
                                const IconName = (recruitment.icon || "Users") as keyof typeof Icons;
                                const Icon = (Icons[IconName] || Icons.Users) as any;

                                return (
                                    <Link href={`/benevoles/${recruitment.id}`} key={recruitment.id}
                                          className="block group">
                                        <Card
                                            className={cn(
                                                "flex flex-col md:flex-row transition-all group-hover:shadow-xl p-3 border-none shadow-md",
                                                !recruitment.enabled && "opacity-60 grayscale"
                                            )}
                                        >
                                            <div className={cn(
                                                "md:w-64 flex items-center justify-center p-8 rounded-xl",
                                                recruitment.enabled ? "bg-primary/5" : "bg-muted/50"
                                            )}>
                                                <div className={cn(
                                                    "p-6 rounded-2xl",
                                                    recruitment.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Icon className="h-16 w-16"/>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col p-6 md:p-10">
                                                <CardTitle
                                                    className="text-2xl md:text-4xl mb-4">{recruitment.title}</CardTitle>
                                                <div
                                                    className="text-muted-foreground line-clamp-3 mb-8 text-lg prose prose-snippet dark:prose-invert max-w-none">
                                                    <ReactMarkdown>
                                                        {recruitment.shortDescription || recruitment.description}
                                                    </ReactMarkdown>
                                                </div>
                                                <div className="mt-auto">
                                                    <div
                                                        className={cn(
                                                            "inline-flex items-center font-bold text-xl transition-colors",
                                                            recruitment.enabled ? "text-primary group-hover:text-primary/80" : "text-muted-foreground group-hover:text-foreground"
                                                        )}
                                                    >
                                                        En savoir plus <Icons.ArrowRight className="ml-2 h-6 w-6"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>

                        {recruitments.length === 0 && (
                            <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
                                <Icons.Users className="mx-auto h-12 w-12 text-muted-foreground opacity-20"/>
                                <h3 className="mt-4 text-lg font-semibold">Aucun recrutement en cours</h3>
                                <p className="text-muted-foreground">Revenez plus tard pour découvrir nos
                                    opportunités.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
