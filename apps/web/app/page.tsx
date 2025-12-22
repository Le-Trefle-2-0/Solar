import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {Hero} from "@/components/landing/hero";
import {Partners} from "@/components/landing/partners";
import {DiscordSection} from "@/components/landing/discord";
import {OrganizationTree} from "@/components/landing/organization";
import {PublicFooter} from "@/components/landing/footer";
import {ScrollReveal} from "@/components/landing/scroll-reveal";
import ChatWidget from "@/components/chat-widget";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1">
                <Hero/>
                <ScrollReveal>
                    <Partners/>
                </ScrollReveal>
                <ScrollReveal>
                    <DiscordSection/>
                </ScrollReveal>
                <ScrollReveal>
                    <OrganizationTree/>
                </ScrollReveal>
            </main>
            <ScrollReveal animation="fade-in">
                <PublicFooter/>
            </ScrollReveal>
            {/* Floating public chat widget */}
            <ChatWidget/>
        </div>
    );
}