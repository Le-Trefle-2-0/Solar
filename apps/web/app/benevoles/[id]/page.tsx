import {getRecruitmentById} from "@/app/actions/recruitments";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import * as Icons from "lucide-react";
import ReactMarkdown from "react-markdown";
import {Badge} from "@/components/ui/badge";
import {ApplicationDialog} from "@/components/recruitments/application-dialog";
import {WaitlistForm} from "@/components/recruitments/waitlist-form";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import Link from "next/link";
import {Button} from "@/components/ui/button";

import {constructMetadata} from "@/lib/metadata";

export async function generateMetadata({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    const recruitment = await getRecruitmentById(id);

    return constructMetadata({
        title: recruitment?.title || "Recrutement",
        description: recruitment?.description?.slice(0, 160) || "Détails du recrutement chez Le Trèfle 2.0",
    });
}

export default async function RecruitmentDetailPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    const recruitment = await getRecruitmentById(id);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!recruitment) {
        redirect("/benevoles");
    }

    const IconName = (recruitment.icon || "Users") as keyof typeof Icons;
    const Icon = (Icons[IconName] || Icons.Users) as any;

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 bg-muted/30">
                <div className="px-4 md:px-8 py-12 w-full max-w-5xl mx-auto">
                    <Link
                        href="/benevoles"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
                    >
                        <Icons.ArrowLeft className="mr-2 h-4 w-4"/> Retour aux opportunités
                    </Link>

                    <div className="max-w-4xl mx-auto space-y-8">
                        <Card className="border-none shadow-sm overflow-hidden flex flex-col gap-0 p-0">
                            <CardHeader className="bg-primary/5 border-b p-8 pt-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="p-4 bg-background rounded-2xl shadow-sm text-primary w-fit">
                                        <Icon className="h-10 w-10"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Badge variant={recruitment.enabled ? "default" : "outline"} className="mb-2">
                                            {recruitment.enabled ? "Recrutement ouvert" : "Recrutement clos"}
                                        </Badge>
                                        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                                            {recruitment.title}
                                        </h1>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 md:p-12 pt-10 md:pt-12">
                                <div className="prose dark:prose-invert max-w-none mb-12">
                                    <ReactMarkdown>{recruitment.description}</ReactMarkdown>
                                </div>

                                <div className="pt-8 border-t flex flex-col items-center text-center space-y-6">
                                    {recruitment.enabled ? (
                                        <>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold">Cette mission vous intéresse ?</h3>
                                                <p className="text-muted-foreground">
                                                    Cliquez sur le bouton ci-dessous pour remplir votre candidature.
                                                </p>
                                            </div>
                                            <ApplicationDialog
                                                recruitmentId={recruitment.id}
                                                recruitmentTitle={recruitment.title}
                                                fields={recruitment.fields as any}
                                            />
                                        </>
                                    ) : (
                                        <div className="bg-muted/50 p-8 rounded-2xl w-full space-y-8">
                                            <div className="space-y-4">
                                                <Icons.Lock
                                                    className="mx-auto h-12 w-12 text-muted-foreground opacity-50"/>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-semibold">Recrutement clôturé</h3>
                                                    <p className="text-muted-foreground max-w-md mx-auto">
                                                        Ce recrutement est actuellement clôturé. Vous pouvez toujours
                                                        consulter les détails de la mission,
                                                        mais les candidatures ne sont plus acceptées.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-muted">
                                                <WaitlistForm recruitmentId={recruitment.id}/>
                                            </div>

                                            <Button asChild variant="outline" className="mt-4">
                                                <Link href="/benevoles">Découvrir d'autres missions</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <PublicFooter/>
        </div>
    );
}
