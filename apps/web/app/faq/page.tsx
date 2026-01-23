import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {FAQClient} from "@/components/landing/faq-client";
import {HelpCircle} from "lucide-react";

export default async function FAQPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 bg-muted/30 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div
                        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"/>
                    <div
                        className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"/>
                </div>

                <section className="py-20 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                            <HelpCircle className="h-10 w-10"/>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight italic mb-6">
                            Foire Aux Questions
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tout ce que vous devez savoir sur Le Trèfle 2.0, notre fonctionnement et nos services.
                        </p>
                    </div>

                    <FAQClient/>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
