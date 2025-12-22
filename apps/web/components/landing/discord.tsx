import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Check, ExternalLink, MessageCircle} from "lucide-react";
import Link from "next/link";

export function DiscordSection() {
    return (
        <section className="relative py-20 md:py-32 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-[#5865F2]/5 to-background -z-10"/>

            {/* Soft decorative blurs for glassmorphism effect */}
            <div className="absolute top-1/4 -left-24 -z-10 opacity-10 dark:opacity-20 blur-[100px]">
                <div className="w-[400px] h-[400px] bg-[#5865F2] rounded-full"/>
            </div>
            <div className="absolute bottom-1/4 -right-24 -z-10 opacity-5 dark:opacity-10 blur-[100px]">
                <div className="w-[400px] h-[400px] bg-secondary rounded-full"/>
            </div>

            <div className="px-4 md:px-8 w-full relative z-10">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    <div className="flex flex-col gap-6 order-1 lg:order-2">
                        <div
                            className="inline-flex items-center rounded-lg bg-[#5865F2]/10 px-3 py-1 text-sm font-medium text-[#5865F2]">
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
                                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/20 text-[#5865F2]">
                                    <Check className="h-4 w-4"/>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Anonymat garanti</h4>
                                    <p className="text-sm text-muted-foreground">Des bots spécialisés rendent les
                                        échanges avec nos bénévoles totalement anonymes.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div
                                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5865F2]/20 text-[#5865F2]">
                                    <Check className="h-4 w-4"/>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Environnement sécurisé</h4>
                                    <p className="text-sm text-muted-foreground">Une modération stricte est imposée pour
                                        fournir un cadre propice et sécurisé.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white" asChild>
                                <Link href="https://discord.gg/letrefle" target="_blank" rel="noopener noreferrer">
                                    Rejoindre le Discord
                                    <ExternalLink className="ml-2 h-5 w-5"/>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <Card className="p-0 overflow-hidden border-none shadow-2xl bg-[#313338] order-2 lg:order-1">
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
