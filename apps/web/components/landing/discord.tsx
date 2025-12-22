import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {MessageCircle} from "lucide-react";

export function DiscordSection() {
    return (
        <section className="py-20 md:py-32 w-full">
            <div className="px-4 md:px-8 w-full">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    <div className="flex flex-col gap-6">
                        <div
                            className="inline-flex items-center rounded-lg bg-secondary/20 px-3 py-1 text-sm font-medium text-secondary">
                            <MessageCircle className="mr-2 h-4 w-4"/>
                            Une association sur Discord
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                            Pourquoi nous avons choisi Discord
                        </h2>
                        <p className="text-muted-foreground md:text-lg">
                            Discord est un réseau social sur lequel chacun peut créer son propre forum et l’animer. Nous
                            avons choisi Discord pour nous adapter à la nouvelle génération, cible principale de
                            l’association.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div
                                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Anonymat garanti</h4>
                                    <p className="text-sm text-muted-foreground">Des bots spécialisés rendent les
                                        échanges avec nos bénévoles totalement anonymes.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div
                                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Environnement sécurisé</h4>
                                    <p className="text-sm text-muted-foreground">Une modération stricte est imposée pour
                                        fournir un cadre propice et sécurisé.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                                Rejoindre le Discord
                            </Button>
                        </div>
                    </div>
                    <Card className="overflow-hidden border-none shadow-2xl">
                        <CardContent className="p-0">
                            <iframe
                                src="https://discord.com/widget?id=718246706319458365&theme=dark"
                                width="100%"
                                height="500"
                                allowtransparency="true"
                                frameBorder="0"
                                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
