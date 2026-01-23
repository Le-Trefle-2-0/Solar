"use client";

import {Button} from "@/components/ui/button";
import {ChevronDown, ExternalLink} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
    const scrollToAbout = () => {
        document.getElementById('about')?.scrollIntoView({behavior: 'smooth'});
    };

    return (
        <section
            className="relative flex flex-col items-center py-12 lg:py-0 overflow-hidden bg-gradient-to-b from-primary/10 to-background dark:from-primary/5 w-full min-h-[calc(100svh-4rem)]">
            <div
                className="px-4 md:px-8 w-full max-w-7xl mx-auto relative z-10 flex flex-col min-h-[calc(100svh-4rem)] justify-between py-12 lg:py-20">
                <div className="flex-1 flex items-center">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
                        <div
                            className="flex flex-col items-center lg:items-end text-center lg:text-right order-2 lg:order-1 animate-in fade-in slide-in-from-left-10 duration-1000">
                            <h1 className="text-3xl font-semibold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl italic leading-tight font-barlow">
                                Qui a dit que tu devais affronter ça sans soutien&nbsp;?
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground text-sm sm:text-base md:text-xl mt-6 lg:mt-8 leading-relaxed">
                                Le Trèfle 2.0 est une association proposant un service d’écoute active gratuit et
                                anonyme tous les
                                soirs de 20h à 23h.
                            </p>

                            <div
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end w-full sm:w-auto mt-8">
                                <Button size="lg" asChild className="text-base sm:text-lg px-8 h-12 sm:h-14">
                                    <Link href="https://discord.gg/letrefle" target="_blank" rel="noopener noreferrer">
                                        Nous rejoindre sur Discord
                                        <ExternalLink className="ml-2 h-4 w-4 sm:h-5 sm:w-5"/>
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="text-base sm:text-lg px-8 h-12 sm:h-14"
                                        onClick={scrollToAbout}>
                                    En savoir plus
                                </Button>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-[300px] sm:max-w-[400px] lg:max-w-none">
                                <Image
                                    src="/undraw_workout_wqgp.svg"
                                    alt="Illustration"
                                    width={700}
                                    height={600}
                                    className="w-full h-auto object-contain drop-shadow-2xl animate-in fade-in slide-in-from-right-10 duration-1000"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="flex flex-col items-center lg:items-end gap-12 w-full mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both">


                <div className="flex flex-col items-center animate-bounce cursor-pointer w-full"
                         onClick={scrollToAbout}>
                        <span
                            className="text-xs sm:text-sm font-medium mb-2 opacity-50">Descendez pour en savoir plus</span>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 opacity-50"/>
                    </div>
                </div>
            </div>

            <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 opacity-10 dark:opacity-5">
                <Image src="/logo.svg" alt="" width={600} height={600} className="w-[600px] h-[600px] blur-3xl"/>
            </div>
        </section>
    );
}
