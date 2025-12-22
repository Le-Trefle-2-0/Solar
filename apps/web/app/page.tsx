import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {Hero} from "@/components/landing/hero";
import {Partners} from "@/components/landing/partners";
import {DiscordSection} from "@/components/landing/discord";
import {PublicFooter} from "@/components/landing/footer";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1">
                <Hero/>
                <Partners/>
                <DiscordSection/>
            </main>
            <PublicFooter/>
        </div>
    );
}