import {Button} from "@/components/ui/button";
import {ChevronDown} from "lucide-react";
import Image from "next/image";

export function Hero() {
    return (
        <section
            className="relative flex flex-col items-center justify-center py-20 md:py-32 overflow-hidden bg-gradient-to-b from-primary/10 to-background dark:from-primary/5 w-full">
            <div className="px-4 md:px-8 w-full flex flex-col items-center text-center">
                <div className="mb-8 rounded-full bg-primary/20 p-4 dark:bg-primary/10">
                    <Image src="/logo.svg" alt="Icone de bénévole" width={100} height={100} className="w-24 h-24"/>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl max-w-3xl italic">
                    «Une petite action pour vous, mais une grande aide pour les autres»
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-6">
                    Le Trèfle 2.0 est une association proposant un service d’écoute active gratuit et anonyme tous les
                    soirs de 20h à 23h.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button size="lg">
                        Nous rejoindre sur Discord
                    </Button>
                    <Button variant="outline" size="lg">
                        En savoir plus
                    </Button>
                </div>
                <div className="mt-12 flex flex-col items-center animate-bounce">
                    <span className="text-sm font-medium mb-2">Descendez pour en savoir plus</span>
                    <ChevronDown className="h-4 w-4"/>
                </div>
            </div>

            <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 opacity-10 dark:opacity-5">
                <Image src="/logo.svg" alt="" width={600} height={600} className="w-[600px] h-[600px] blur-3xl"/>
            </div>
        </section>
    );
}
