import {ScrollReveal} from "./scroll-reveal";
import Image from "next/image";

export function AboutSection() {
    return (
        <section id="about" className="py-20 bg-background overflow-hidden">
            <div className="px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <ScrollReveal animation="slide-right"
                                  className="relative h-[300px] lg:h-[400px] order-2 lg:order-1">
                        <div className="relative w-full h-full">
                            <Image
                                src="/undraw_team-spirit_18vw.svg"
                                alt="L'association Le Trèfle 2.0"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </ScrollReveal>
                    <ScrollReveal animation="slide-left" className="order-1 lg:order-2">
                        <h2 className="text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl mb-6 font-barlow">
                            De quoi s'agit l'association ?
                        </h2>
                        <div className="space-y-4 text-muted-foreground md:text-lg">
                            <p>
                                Le Trèfle 2.0 est une association dédiée au soutien moral et à l'écoute active.
                                Nous existons pour offrir un espace sécurisé où chacun peut s'exprimer librement,
                                sans jugement.
                            </p>
                            <p>
                                Notre fonctionnement repose sur une équipe de bénévoles formés à l'écoute active,
                                disponibles chaque soir pour vous accompagner dans les moments difficiles ou
                                simplement pour échanger.
                            </p>
                            <p>
                                Pourquoi existons-nous ? Car nous sommes convaincus que personne ne devrait
                                avoir à affronter ses défis seul. L'accès à une écoute de qualité est un droit
                                fondamental que nous nous efforçons de rendre accessible à tous, notamment via
                                les outils numériques d'aujourd'hui.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
