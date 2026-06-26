"use client";

import {Card, CardContent} from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import {Quote, Users} from "lucide-react";
import {cn} from "@/lib/utils";
import {ScrollReveal} from "./scroll-reveal";
import Image from "next/image";
import React, {useEffect, useRef, useState} from "react";
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
    image?: string | null;
    bio?: string | null;
}

interface Category {
    id: string;
    name: string;
    icon?: string | null;
    members: Person[];
}


export function OrganizationTree({categories}: { categories: Category[] }) {
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

                    {categories.length > 0 ? (
                        categories.map((category) => {
                            const Icon = (LucideIcons as any)[category.icon || "Users"] || LucideIcons.Users;
                            // Sort members alphabetically by name
                            const sortedMembers = [...category.members].sort((a, b) => 
                                a.name.localeCompare(b.name)
                            );
                            return (
                                <div key={category.id} className="relative z-10 space-y-8">
                                    <ScrollReveal animation="fade-in"
                                                  className="flex items-center gap-4 justify-center bg-background/80 backdrop-blur-sm w-fit mx-auto px-4 py-1 rounded-full border border-primary/20">
                                        <Icon className="h-5 w-5 text-primary"/>
                                        <h3 className="text-xl font-semibold uppercase tracking-widest text-primary font-barlow">
                                            {category.name}
                                        </h3>
                                    </ScrollReveal>
                                    <ShowcaseCarousel items={sortedMembers}/>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Aucune information n'a été saisie ici pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function ShowcaseCarousel({items}: { items: Person[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [visibleCount, setVisibleCount] = useState(3);

    useEffect(() => {
        const updateVisibleCount = () => {
            if (window.innerWidth < 640) {
                setVisibleCount(1);
            } else if (window.innerWidth < 1024) {
                setVisibleCount(2);
            } else {
                setVisibleCount(3);
            }
        };

        updateVisibleCount();
        window.addEventListener("resize", updateVisibleCount);
        return () => window.removeEventListener("resize", updateVisibleCount);
    }, []);

    const isCarousel = items.length > visibleCount;
    const maxIndex = isCarousel ? items.length - visibleCount : 0;

    useEffect(() => {
        if (!isCarousel || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 4000);

        return () => clearInterval(interval);
    }, [isCarousel, isPaused, items.length, maxIndex]);

    useEffect(() => {
        // Reset index if visibleCount changes to avoid empty space if items.length is small
        setCurrentIndex(0);
    }, [visibleCount]);

    if (!isCarousel) {
        return (
            <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto px-4">
                {items.map((person, i) => (
                    <ScrollReveal key={i} delay={i * 100} animation="slide-up"
                                  className={cn(
                                      "w-full max-w-sm",
                                      items.length === 1 ? "sm:w-1/2" : 
                                      items.length === 2 ? "sm:w-[calc(50%-12px)]" : 
                                      "sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]"
                                  )}>
                        <PersonCard person={person}/>
                    </ScrollReveal>
                ))}
            </div>
        );
    }

    const translateX = `-${currentIndex * (100 / visibleCount)}%`;

    return (
        <div
            className="w-full relative overflow-hidden px-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                className="flex transition-transform duration-1000 ease-in-out"
                style={{
                    transform: `translateX(${translateX})`,
                }}
            >
                {items.map((person, i) => (
                    <div
                        key={i}
                        className="px-3 shrink-0"
                        style={{width: `${100 / visibleCount}%`}}
                    >
                        <PersonCard person={person}/>
                    </div>
                ))}
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => {
                    return (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                currentIndex === i ? "bg-primary w-6" : "bg-primary/20 hover:bg-primary/40"
                            )}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function PersonCard({person}: { person: Person }) {
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
                                    <Users className="h-10 w-10 text-primary"/>
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
                                    <Users className="h-8 w-8 text-primary"/>
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
