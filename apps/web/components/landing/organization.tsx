"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Quote, Shield, Users} from "lucide-react";
import {cn} from "@/lib/utils";
import {ScrollReveal} from "./scroll-reveal";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

interface Person {
    name: string;
    role: string;
    icon: any;
    image?: string; // optional photo URL
    bio?: string;
}

const board: Person[] = [
    {
        name: "Anthony",
        role: "Président",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/512409112231936021/19636aa5f20d108c2161fa7c58d94591.jpeg?size=1024"
    },
    {
        name: "Paul",
        role: "Administrateur",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/369564132770578432/d9059864986d2b943ab7d1e61c35b74e.jpeg?size=1024",
        bio: "Étudiant en physique et passionné par le numérique, j'ai rejoint l'association en 2021 avec l'envie concrète d'être utile. Fort d'une expérience en cybersécurité, j'ai accompagné la transformation digitale de l'association en l'aidant à se doter des outils adaptés à ses besoins. Au-delà de la technique, c'est l'engagement pour la santé mentale qui me tient à cœur et qui guide mon investissement au sein du conseil d'administration."
    },
    {
        name: "Océane",
        role: "Trésorière",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/372806343108591617/518b38f6cb377b207d54b0de30a6220d.jpeg?size=1024"
    },
];

const managers: Person[] = [
    {
        name: "Louise",
        role: "Coordinatrice des Équipes",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/967058591494316033/fab79946a1d207f42fb220f9ed3d6e76.jpeg?size=1024"
    },
];

const teamLeaders: Person[] = [
    {
        name: "Arthur",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/407961565166305301/54df661e844710e25de237077de6bbdd.png?size=4096"
    },
    {
        name: "Berry",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/720741419400036452/d74c37142c98c44c404650e17b061c6a.png?size=4096"
    },
    {
        name: "Clem",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/1125820510236856372/94f320bf98e6231c32941864baefdd4f.png?size=4096"
    },
    {
        name: "Darius",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/1305103533246255198/95045c6b26739a3f64ea1610c0a37d91.png?size=4096"
    },
    {
        name: "Guillaume",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/264842960187686912/35d5e06438b98f5bd44db81785407a2c.png?size=4096"
    },
    {
        name: "Jérôme",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/130352922935427072/1890454f4e70f2dd8c02211f4ce40830.png?size=4096"
    },
    {
        name: "Léana",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/550408743154745344/12e9b0db3e16d0f2958f5dbf5e0f327b.png?size=4096"
    },
    {
        name: "Lisa",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/827257471847759872/068d63207e4ef42356805e8ec27416f5.png?size=4096"
    },
    {
        name: "Rémy",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/181083128746475520/5b8522209bf18eaee89b7e407ba980ca.png?size=4096"
    },
    {
        name: "Shoam",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/344919009130446859/26e576ed86976c3e37788899aa1855a4.png?size=4096"
    },
    {
        name: "Sarah",
        role: "Référent Bénévoles Écoutants",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/692026167469015091/9712232709bf0005e882ad5dcfdf8328.png?size=4096"
    },
];

export function OrganizationTree() {
    return (
        <section className="relative py-20 md:py-32 w-full overflow-hidden bg-background">
            {/* Soft decorative blurs */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-5 dark:opacity-10 blur-[120px]">
                <div className="w-[600px] h-[600px] bg-primary rounded-full"/>
            </div>

            <div className="px-4 md:px-8 w-full max-w-7xl mx-auto relative z-10">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl mb-4 font-barlow">
                        Notre Structure
                    </h2>
                    <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                        Découvrez l'équipe qui anime et gère Le Trèfle 2.0 au quotidien.
                    </p>
                </ScrollReveal>

                <div className="relative space-y-16">
                    {/* Visual connection line from top to bottom (hidden on mobile) */}
                    <div
                        className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden lg:block -translate-x-1/2 z-0"/>

                    {/* Board Section */}
                    <div className="relative z-10 space-y-8">
                        <ScrollReveal animation="fade-in"
                                      className="flex items-center gap-4 justify-center bg-background/80 backdrop-blur-sm w-fit mx-auto px-4 py-1 rounded-full border border-primary/20">
                            <Shield className="h-5 w-5 text-primary"/>
                            <h3 className="text-xl font-semibold uppercase tracking-widest text-primary font-barlow">Le
                                Conseil
                                d'Administration</h3>
                        </ScrollReveal>
                        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                            {board.map((person, i) => (
                                <ScrollReveal key={i} delay={i * 100} animation="slide-up"
                                              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] max-w-sm">
                                    <PersonCard person={person}/>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>

                    {/* Managers Section */}
                    <div className="relative z-10 space-y-8">
                        <ScrollReveal animation="fade-in"
                                      className="flex items-center gap-4 justify-center bg-background/80 backdrop-blur-sm w-fit mx-auto px-4 py-1 rounded-full border border-primary/20">
                            <Users className="h-5 w-5 text-primary"/>
                            <h3 className="text-xl font-semibold uppercase tracking-widest text-primary font-barlow">
                                Responsables de pôle
                            </h3>
                        </ScrollReveal>
                        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                            {managers.map((person, i) => (
                                <ScrollReveal key={i} delay={i * 100} animation="slide-up"
                                              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] max-w-sm">
                                    <PersonCard person={person}/>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>

                    {/* Team Leaders Section */}
                    {teamLeaders.length > 0 && (
                        <div className="relative z-10 space-y-8">
                            <ScrollReveal animation="fade-in"
                                          className="flex items-center gap-4 justify-center bg-background/80 backdrop-blur-sm w-fit mx-auto px-4 py-1 rounded-full border border-primary/20">
                                <Users className="h-5 w-5 text-primary"/>
                                <h3 className="text-xl font-semibold uppercase tracking-widest text-primary font-barlow">
                                    Responsable d'équipe
                                </h3>
                            </ScrollReveal>
                            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                                {teamLeaders.map((person, i) => (
                                    <ScrollReveal key={i} delay={i * 100} animation="slide-up"
                                                  className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] max-w-sm">
                                        <PersonCard person={person}/>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function PersonCard({person}: { person: Person }) {
    const Icon = person.icon;
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className={cn(
                    "group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-md border border-transparent cursor-pointer",
                )}>
                    <CardContent className="pt-8 flex flex-col items-center text-center">
                        <div className="relative">
                            <div
                                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-inner overflow-hidden">
                                {person.image ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={person.image}
                                            alt={`${person.name} – ${person.role}`}
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                            priority={false}
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <Icon className="h-10 w-10 text-primary"/>
                                )}
                            </div>
                        </div>
                        <h4 className="font-semibold text-xl tracking-tight font-barlow">{person.name}</h4>
                        <p className="text-sm font-medium text-primary/70 uppercase tracking-wider mt-1">{person.role}</p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                            {person.image ? (
                                <Image src={person.image} alt={person.name} width={64} height={64}
                                       className="object-cover" unoptimized/>
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <Icon className="h-8 w-8 text-primary"/>
                                </div>
                            )}
                        </div>
                        <div>
                            <DialogTitle className="font-barlow text-2xl">{person.name}</DialogTitle>
                            <p className="text-primary font-medium">{person.role}</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="relative mt-6">
                    {person.bio && (
                        <Quote className="absolute -top-4 -left-2 h-16 w-16 text-primary/20 -z-10"/>
                    )}
                    <DialogDescription className="text-base leading-relaxed italic relative z-10 px-2">
                        {person.bio ? person.bio : "Aucune biographie disponible."}
                    </DialogDescription>
                </div>
            </DialogContent>
        </Dialog>
    );
}
