"use client";

import Image from "next/image";
import Link from "next/link";

export function Partners() {
    const partners = [
        {name: "Académie de Montpellier", logo: "/partners/Ac_Montpellier.png"},
        {name: "Discord", logo: "/partners/Discord.png"},
        {name: "Éducation Nationale", logo: "/partners/Educ_Nat.png"},
        {name: "Microsoft 365", logo: "/partners/Microsoft_365.png"},
        {name: "Microsoft Azure", logo: "/partners/Microsoft_Azure.png"},
    ];

    // Create two identical large sets to ensure it covers even ultra-wide screens (4K/8K)
    const partnerSet = Array(8).fill(partners).flat();

    return (
        <section className="relative py-12 bg-gradient-to-b from-background to-muted/30 w-full overflow-hidden">
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-5 dark:opacity-10 blur-[100px]">
                <div className="w-[800px] h-[300px] bg-primary rounded-full"/>
            </div>
            <div className="w-full relative z-10">
                <h3 className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-10 opacity-70">
                    Avec le soutien de
                </h3>
                <div className="relative flex overflow-x-hidden mask-marquee">
                    <div className="flex animate-marquee hover-pause py-4 w-fit">
                        {/* First block of content */}
                        <div className="flex shrink-0 items-center gap-12 md:gap-24 px-6 md:px-12">
                            {partnerSet.map((partner, index) => (
                                <Link
                                    key={`set1-${index}`}
                                    href="#"
                                    className="opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500 block transform hover:scale-110 shrink-0"
                                >
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        width={200}
                                        height={60}
                                        className="h-8 md:h-10 w-auto object-contain"
                                    />
                                </Link>
                            ))}
                        </div>
                        {/* Second identical block for seamless looping */}
                        <div className="flex shrink-0 items-center gap-12 md:gap-24 px-6 md:px-12">
                            {partnerSet.map((partner, index) => (
                                <Link
                                    key={`set2-${index}`}
                                    href="#"
                                    className="opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500 block transform hover:scale-110 shrink-0"
                                >
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        width={200}
                                        height={60}
                                        className="h-8 md:h-10 w-auto object-contain"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
