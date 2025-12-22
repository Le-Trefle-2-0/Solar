"use client";

import {Card, CardContent} from "@/components/ui/card";
import {Shield, Star, Users} from "lucide-react";
import {cn} from "@/lib/utils";
import {ScrollReveal} from "./scroll-reveal";

interface Person {
    name: string;
    role: string;
    icon: any;
}

const board: Person[] = [
    {name: "Nom Prénom", role: "Président", icon: Shield},
    {name: "Nom Prénom", role: "Vice-Président", icon: Star},
    {name: "Nom Prénom", role: "Trésorier", icon: Shield},
    {name: "Nom Prénom", role: "Secrétaire", icon: Shield},
];

const managers: Person[] = [
    {name: "Nom Prénom", role: "Responsable BE", icon: Users},
    {name: "Nom Prénom", role: "Responsable Technique", icon: Users},
    {name: "Nom Prénom", role: "Responsable Communication", icon: Users},
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
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
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
                            <h3 className="text-xl font-bold uppercase tracking-widest text-primary">Le Bureau</h3>
                        </ScrollReveal>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {board.map((person, i) => (
                                <ScrollReveal key={i} delay={i * 100} animation="slide-up">
                                    <PersonCard person={person} isLeader={i === 0}/>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>

                    {/* Managers Section */}
                    <div className="relative z-10 space-y-8">
                        <ScrollReveal animation="fade-in"
                                      className="flex items-center gap-4 justify-center bg-background/80 backdrop-blur-sm w-fit mx-auto px-4 py-1 rounded-full border border-primary/20">
                            <Users className="h-5 w-5 text-primary"/>
                            <h3 className="text-xl font-bold uppercase tracking-widest text-primary">Les
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

function PersonCard({person, isLeader}: { person: Person; isLeader?: boolean }) {
    const Icon = person.icon;
    return (
        <Card className={cn(
            "group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-md border border-transparent",
            isLeader && "lg:scale-105 border-primary/20 bg-primary/5"
        )}>
            <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative">
                    <div
                        className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                        <Icon className="h-10 w-10 text-primary"/>
                    </div>
                    {isLeader && (
                        <div
                            className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg">
                            <Star className="h-4 w-4 fill-current"/>
                        </div>
                    )}
                </div>
                <h4 className="font-bold text-xl tracking-tight">{person.name}</h4>
                <p className="text-sm font-medium text-primary/70 uppercase tracking-wider mt-1">{person.role}</p>
            </CardContent>
        </Card>
    );
}
