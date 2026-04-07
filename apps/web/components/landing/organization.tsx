"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Shield, Users} from "lucide-react";
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
}

const board: Person[] = [
    {
        name: "Anthony J.",
        role: "Président",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/512409112231936021/19636aa5f20d108c2161fa7c58d94591.jpeg?size=1024"
    },
    {
        name: "Paul PERON REDON",
        role: "Administrateur",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/369564132770578432/d9059864986d2b943ab7d1e61c35b74e.jpeg?size=1024"
    },
    {
        name: "Océane DUPONT",
        role: "Trésorière",
        icon: Shield,
        image: "https://cdn.discordapp.com/avatars/372806343108591617/518b38f6cb377b207d54b0de30a6220d.jpeg?size=1024"
    },
];

const managers: Person[] = [
    {
        name: "Julie ROMANET",
        role: "Responsable Pôle Écoute",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/869076177686523954/b6549e8d4c6a96e7423f731dc5563d7b.jpeg?size=1024"
    },
    {
        name: "Louise BURTÉ",
        role: "Coordinatrice des Équipes",
        icon: Users,
        image: "https://cdn.discordapp.com/avatars/967058591494316033/fab79946a1d207f42fb220f9ed3d6e76.jpeg?size=1024"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {board.map((person, i) => (
                                <ScrollReveal key={i} delay={i * 100} animation="slide-up">
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
                            <h3 className="text-xl font-semibold uppercase tracking-widest text-primary font-barlow">Les
                                Responsables</h3>
                        </ScrollReveal>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {managers.map((person, i) => (
                                <ScrollReveal key={i} delay={i * 100} animation="slide-up">
                                    <PersonCard person={person}/>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
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
            <DialogContent>
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
                <DialogDescription className="text-base leading-relaxed mt-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat.
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
