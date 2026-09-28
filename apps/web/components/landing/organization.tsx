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
    image?: string | null;
    bio?: string | null;
}

interface TeamMember {
    id: string;
    role: string;
    isLead?: boolean;
    teamName?: string | null;
    person: Person;
}

interface Category {
    id: string;
    name: string;
    icon?: string | null;
    type?: string | null;
    color?: string | null;
    members: TeamMember[];
}


export function OrganizationTree({categories}: { categories: Category[] }) {
    const caCategory = categories.find(c => c.type === 'CONSEIL');
    const poleCategories = categories.filter(c => c.type === 'POLE').sort((a, b) => (a as any).order - (b as any).order);
    const otherCategories = categories.filter(c => c.type !== 'CONSEIL' && c.type !== 'POLE');

    // Simple deduplication logic by Name
    const getPolesForPerson = (name: string) => {
        if (!name) return [];
        return poleCategories.filter(p => p.members.some(m => m.person?.name === name));
    };

    const isPersonInCA = (name: string) => {
        if (!name) return false;
        return caCategory?.members.some(m => m.person?.name === name) || false;
    };

    return (
        <section className="relative py-20 md:py-32 w-full overflow-hidden bg-background font-barlow">
            <style jsx global>{`
                :root {
                    --blue: #9BD2D2;
                    --green: #8CC088;
                    --grey: #72827E;
                    --ink: #202020;
                }
                .dark {
                    --ink: #F6F6F6;
                }
            `}</style>
            
            <div className="px-4 md:px-8 w-full max-w-7xl mx-auto relative z-10">
                <ScrollReveal className="text-center mb-16">
                    <h2 className="text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                        Notre Structure
                    </h2>
                    <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
                        Découvrez l'équipe qui anime et gère Le Trèfle 2.0 au quotidien.
                    </p>
                </ScrollReveal>

                {/* --- CONSEIL D'ADMINISTRATION --- */}
                {caCategory && (
                    <div className="mb-24">
                        <div className="mb-12 text-center">
                            <h3 className="text-3xl font-bold mb-4 font-barlow">Le Conseil d'Administration</h3>
                        </div>
                        
                        <CACarousel 
                            members={caCategory.members.filter(m => !!m.person)} 
                            getPolesForPerson={getPolesForPerson}
                        />
                    </div>
                )}

                {/* --- PÔLES --- */}
                {poleCategories.length > 0 && (
                    <div className="relative">
                        {/* Connecting line for desktop */}
                        <div className="hidden lg:block w-px h-12 bg-muted-foreground/20 mx-auto mb-0" />
                        
                        <div className={cn(
                            "flex flex-wrap lg:flex-nowrap justify-center gap-6 lg:gap-12 relative pt-0 lg:pt-12 mx-auto",
                            poleCategories.length === 1 ? "max-w-md" : 
                            poleCategories.length === 2 ? "max-w-4xl" : 
                            poleCategories.length === 3 ? "max-w-6xl" : "max-w-[100rem]"
                        )}>
                            {/* Horizontal line for desktop - adjusted width based on number of poles */}
                            {poleCategories.length > 1 && (
                                <div 
                                    className="hidden lg:block absolute top-0 bg-muted-foreground/20 h-px" 
                                    style={{
                                        width: `${(poleCategories.length - 1) * (100 / poleCategories.length)}%`,
                                        left: `${(100 / poleCategories.length) / 2}%`
                                    }}
                                />
                            )}
                            
                            {poleCategories.map((pole, i) => (
                                <div key={pole.id} className="w-full sm:w-[calc(50%-12px)] lg:flex-1 min-w-0 lg:max-w-[420px]">
                                    <PoleColumn 
                                        pole={pole} 
                                        isPersonInCA={isPersonInCA || false}
                                        delay={i * 100}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- OTHER CATEGORIES (Old style) --- */}
                {otherCategories.length > 0 && (
                    <div className="mt-20 space-y-16">
                        {otherCategories.map((category) => {
                            const Icon = (LucideIcons as any)[category.icon || "Users"] || LucideIcons.Users;
                            const sortedMembers = [...category.members].sort((a, b) => 
                                a.person.name.localeCompare(b.person.name)
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
                                    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto px-4">
                                        {sortedMembers.map((member, i) => (
                                            <ScrollReveal key={i} delay={i * 100} animation="slide-up"
                                                        className={cn(
                                                            "w-full max-w-sm",
                                                            sortedMembers.length === 1 ? "sm:w-1/2" : 
                                                            sortedMembers.length === 2 ? "sm:w-[calc(50%-12px)]" : 
                                                            "sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]"
                                                        )}>
                                                <PersonCard person={person}/>
                                            </ScrollReveal>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

function PoleColumn({pole, isPersonInCA, delay}: { pole: Category, isPersonInCA: (n: string) => boolean, delay: number }) {
    const leads = pole.members.filter(m => m.isLead);
    const teams = Array.from(new Set(pole.members.filter(m => !m.isLead).map(m => m.teamName || "")));
    
    // Sort leads to put CA members first maybe? Or just keep original order
    const sortedLeads = [...leads];

    const [isOpen, setIsOpen] = React.useState(true);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 560;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(true);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const poleColor = pole.color?.startsWith('#') ? pole.color : `var(--${pole.color || 'blue'})`;

    return (
        <ScrollReveal animation="slide-up" delay={delay} className="h-full">
            <div 
                className={cn(
                    "relative h-full bg-card rounded-lg border-2 overflow-hidden flex flex-col transition-colors duration-300",
                    "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5"
                )}
                style={{ 
                    borderColor: poleColor.startsWith('var') ? poleColor : `${poleColor}66` // 66 = ~40% opacité pour un meilleur rendu
                }}
            >
                {/* Visual top border */}
                <div className="h-1.5 w-full" style={{ backgroundColor: poleColor }} />
                
                {/* Column Stem for Desktop */}
                <div className="hidden lg:block absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-muted-foreground/20" />

                <div 
                    className={cn(
                        "p-6 flex items-center justify-between cursor-pointer sm:cursor-default",
                        !isMobile && "pointer-events-none"
                    )}
                    onClick={() => isMobile && setIsOpen(!isOpen)}
                >
                    <div>
                        <h4 className="text-3xl font-bold leading-tight font-barlow">{pole.name}</h4>
                    </div>
                    {isMobile && (
                        <LucideIcons.ChevronDown className={cn("h-6 w-6 transition-transform", isOpen && "rotate-180")} />
                    )}
                </div>

                {isOpen && (
                    <div className="px-6 pb-6 flex-1 flex flex-col">
                        <div className="text-[14px] uppercase font-bold text-muted-foreground/60 tracking-widest mb-3 mt-4">
                            {leads.length > 1 ? "Responsables du pôle" : "Responsable du pôle"}
                        </div>
                        <ul className="space-y-4 mb-8">
                            {sortedLeads.filter(lead => !!lead.person).map((lead, idx) => (
                                <li key={idx}>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="flex items-center gap-4 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors group/lead">
                                                <Avatar className="h-12 w-12 border shadow-sm group-hover/lead:border-primary/50 transition-colors">
                                                    {lead.person.image ? (
                                                        <Image src={lead.person.image} alt={lead.person.name} width={48} height={48} className="object-cover" unoptimized />
                                                    ) : (
                                                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-[14px] font-bold">
                                                            {lead.person.name?.[0] || '?'}
                                                        </div>
                                                    )}
                                                </Avatar>
                                                <span className="font-semibold text-lg flex-1">{lead.person.name}</span>
                                                {isPersonInCA(lead.person.name) && (
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/5" title="Membre du CA">CA</span>
                                                )}
                                            </div>
                                        </DialogTrigger>
                                        <BioDialogContent person={lead.person} role={lead.role} />
                                    </Dialog>
                                </li>
                            ))}
                        </ul>

                        {teams.length > 0 ? (
                            <>
                                <div className="text-[14px] uppercase font-bold text-muted-foreground/60 tracking-widest mb-4">Équipes</div>
                                <div className="space-y-8">
                                    {teams.map((team, idx) => {
                                        const members = pole.members.filter(m => !m.isLead && (m.teamName || "") === team);
                                        return (
                                            <div key={idx} className="space-y-4">
                                                {team && <h5 className="text-xl font-bold font-barlow">{team}</h5>}
                                                <ul className="space-y-3">
                                                    {members.filter(m => !!m.person).map((m, midx) => (
                                                        <li key={midx}>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <div className="flex items-center gap-4 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors group/member">
                                                                        <Avatar className="h-10 w-10 border opacity-90 group-hover/member:opacity-100 transition-opacity">
                                                                            {m.person.image ? (
                                                                                <Image src={m.person.image} alt={m.person.name} width={40} height={40} className="object-cover" unoptimized />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-[12px] font-bold">
                                                                                    {m.person.name?.[0] || '?'}
                                                                                </div>
                                                                            )}
                                                                        </Avatar>
                                                                        <div className="min-w-0">
                                                                            <div className="text-lg font-medium leading-tight truncate">{m.person.name}</div>
                                                                            {m.role && <div className="text-[14px] text-muted-foreground truncate leading-tight mt-0.5">{m.role}</div>}
                                                                        </div>
                                                                    </div>
                                                                </DialogTrigger>
                                                                <BioDialogContent person={m.person} role={m.role} />
                                                            </Dialog>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="mt-auto pt-6 border-t border-dashed border-muted/30">
                                <div className="rounded border-2 border-dashed border-muted/20 p-4 text-center text-sm text-muted-foreground/60 italic">
                                    Responsables d'équipe à renseigner
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ScrollReveal>
    );
}

const Avatar = ({ children, className, ...props }: any) => (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props}>
        {children}
    </div>
);

function CACarousel({members, getPolesForPerson}: { members: TeamMember[], getPolesForPerson: (name: string) => Category[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        const updateVisibleCount = () => {
            if (window.innerWidth < 640) setVisibleCount(1);
            else if (window.innerWidth < 1024) setVisibleCount(2);
            else setVisibleCount(4);
        };
        updateVisibleCount();
        window.addEventListener("resize", updateVisibleCount);
        return () => window.removeEventListener("resize", updateVisibleCount);
    }, []);

    const isCarousel = members.length > visibleCount;
    const maxIndex = Math.max(0, members.length - visibleCount);

    useEffect(() => {
        if (!isCarousel || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [isCarousel, isPaused, maxIndex]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [visibleCount]);

    if (!isCarousel) {
        return (
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                {members.map((member, i) => {
                    const personPoles = getPolesForPerson(member.person.name);
                    return (
                        <div key={i} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                            <ScrollReveal delay={i * 50} animation="slide-up">
                                <PersonCard 
                                    person={member.person} 
                                    role={member.role}
                                    customBadge={personPoles.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                                            {personPoles.map(p => (
                                                <span 
                                                    key={p.id} 
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] font-semibold"
                                                    style={{ borderColor: p.color?.startsWith('#') ? p.color : `var(--${p.color || 'blue'})`, color: 'inherit' }}
                                                >
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color?.startsWith('#') ? p.color : `var(--${p.color || 'blue'})` }} />
                                                    Pôle {p.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                />
                            </ScrollReveal>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div 
            className="relative overflow-hidden group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
                {members.map((member, i) => {
                    const personPoles = getPolesForPerson(member.person.name);
                    return (
                        <div key={i} className="px-3 shrink-0" style={{ width: `${100 / visibleCount}%` }}>
                            <PersonCard 
                                person={member.person} 
                                role={member.role}
                                customBadge={personPoles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                                        {personPoles.map(p => (
                                            <span 
                                                key={p.id} 
                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[12px] font-semibold"
                                                style={{ borderColor: p.color?.startsWith('#') ? p.color : `var(--${p.color || 'blue'})`, color: 'inherit' }}
                                            >
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color?.startsWith('#') ? p.color : `var(--${p.color || 'blue'})` }} />
                                                Pôle {p.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>
                    );
                })}
            </div>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            currentIndex === i ? "bg-primary w-8" : "bg-primary/20 hover:bg-primary/40"
                        )}
                    />
                ))}
            </div>
        </div>
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

function PersonCard({person, role, customBadge}: { person: Person, role: string, customBadge?: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className={cn(
                    "group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-md border border-transparent cursor-pointer h-full",
                )}>
                    <CardContent className="py-6 flex flex-col items-center text-center">
                        <div className="relative">
                            <div
                                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-500 shadow-inner overflow-hidden border border-primary/10">
                                {person.image ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={person.image}
                                            alt={`${person.name} – ${role}`}
                                            fill
                                            sizes="112px"
                                            className="object-cover"
                                            priority={false}
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <Users className="h-12 w-12 text-primary"/>
                                )}
                            </div>
                        </div>
                        <h4 className="font-bold text-2xl tracking-tight font-barlow">{person.name}</h4>
                        <p className="text-base font-semibold text-primary/70 uppercase tracking-widest mt-2">{role}</p>
                        {customBadge}
                    </CardContent>
                </Card>
            </DialogTrigger>
            <BioDialogContent person={person} role={role} />
        </Dialog>
    );
}

function BioDialogContent({person, role}: {person: Person, role: string}) {
    return (
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
            <div className="p-8 sm:p-10">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-lg">
                            {person.image ? (
                                <Image src={person.image} alt={person.name} width={96} height={96}
                                       className="object-cover w-full h-full" unoptimized/>
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-12 w-12 text-primary"/>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 mt-2">
                            <DialogTitle className="font-barlow text-3xl font-bold tracking-tight">{person.name}</DialogTitle>
                            <p className="text-primary font-bold text-lg uppercase tracking-wider">{role}</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="relative mt-10">
                    {person.bio && (
                        <Quote className="absolute -top-6 -left-4 h-20 w-20 text-primary/10 -z-10"/>
                    )}
                    <DialogDescription className="text-lg leading-relaxed italic relative z-10 px-2 text-foreground/90 font-medium">
                        {person.bio ? person.bio : "Aucune biographie disponible pour le moment."}
                    </DialogDescription>
                </div>
            </div>
        </DialogContent>
    );
}
