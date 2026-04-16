import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {Hero} from "@/components/landing/hero";
import {AboutSection} from "@/components/landing/about";
import {Partners} from "@/components/landing/partners";
import {DiscordSection} from "@/components/landing/discord";
import {OrganizationTree} from "@/components/landing/organization";
import {PublicFooter} from "@/components/landing/footer";
import {ScrollReveal} from "@/components/landing/scroll-reveal";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Le Trèfle 2.0 - Services d'écoute et de soutien moral",
    description: "Soutien moral et écoute anonyme par l'association Le Trèfle 2.0. Échangez gratuitement et en toute sécurité avec nos écoutants.",
});

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Onboarding: ne pas rediriger d'ici, laisser la page d'accueil publique
    // La redirection se fera dans la page d'authentification si nécessaire

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1">
                <Hero/>
                <ScrollReveal>
                    <AboutSection/>
                </ScrollReveal>
                <ScrollReveal>
                    <DiscordSection/>
                </ScrollReveal>
                <ScrollReveal>
                    <Partners/>
                </ScrollReveal>
                <ScrollReveal>
                    <OrganizationTree/>
                </ScrollReveal>
            </main>
            <ScrollReveal animation="fade-in">
                <PublicFooter/>
            </ScrollReveal>
        </div>
    );
}