import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {ChevronLeft, ExternalLink, Gift, Handshake} from "lucide-react";
import {Button} from "@/components/ui/button";
import {notFound} from "next/navigation";
import {ScrollReveal} from "@/components/landing/scroll-reveal";

const partnersData: Record<string, any> = {
    "academie-montpellier": {
        name: "Académie de Montpellier",
        logo: "/partners/Ac_Montpellier.png",
        description: "L'Académie de Montpellier soutient nos par une contribution financière de nos activités par le Fond pour le Développement de la Vie Associative (FDVA2).",
        website: "https://www.ac-montpellier.fr/",
        principle: "Cette subvention nous permet de financer le fonctionnement global de notre association",
        benefits: [
            "500€ de subvention en 2023",
            "1500€ de subvention en 2025"
        ],
        counterparts: [
            "Mise en avant de leur soutien"
        ]
    },
    "discord": {
        name: "Discord",
        logo: "/partners/Discord.png",
        description: "Discord est la plateforme technique sur laquelle repose notre organisation et notre service d'écoute",
        website: "https://discord.com/",
        principle: "Discord nous fournit les outils nécessaires pour créer un environnement d'échange et de chat en temps réel, essentiel à notre fonctionnement interne.",
        benefits: [
            "Infrastructure de communication robuste et gratuite.",
            "Possibilité de développer des outils sur mesure (bots) pour l'anonymisation.",
            "Plateforme familière pour les jeunes (15-25 ans).",
            "Mise en avant de nos service et notre sérieux par le programme Partenaires"
        ],
        counterparts: []
    },
    "education-nationale": {
        name: "Éducation Nationale",
        logo: "/partners/Educ_Nat.png",
        description: "L'Éducation Nationale soutient nos par une contribution financière de nos activités par le Fond pour le Développement de la Vie Associative (FDVA2).",
        website: "https://education.gouv.fr/",
        principle: "Cette subvention nous permet de financer le fonctionnement global de notre association",
        benefits: [
            "500€ de subvention en 2023",
            "1500€ de subvention en 2025"
        ],
        counterparts: [
            "Mise en avant de leur soutien"
        ]
    },
    "microsoft-365": {
        name: "Microsoft 365",
        logo: "/partners/Microsoft_365.png",
        description: "Microsoft nous accompagne dans notre transformation numérique et la gestion administrative de l'association.",
        website: "https://www.microsoft.com/fr-fr/microsoft-365",
        principle: "Utilisation de la suite collaborative pour coordonner nos équipes de bénévoles et gérer nos projets au quotidien.",
        benefits: [
            "Accès aux outils professionnels (Teams, SharePoint, Office) via le programme pour associations.",
            "Sécurisation des documents internes et des données administratives.",
        ],
        counterparts: []
    },
    "microsoft-azure": {
        name: "Microsoft Azure",
        logo: "/partners/Microsoft_Azure.png",
        description: "Microsoft Azure héberge nos services web et nos bases de données de manière sécurisée.",
        website: "https://azure.microsoft.com/",
        principle: "Externalisation de notre infrastructure serveur sur un cloud sécurisé et performant.",
        benefits: [
            "Crédits cloud offerts via le programme de mécénat de Microsoft.",
            "Haute disponibilité de notre site vitrine et de nos API.",
            "Conformité RGPD facilitée par les certifications de l'hébergeur."
        ],
        counterparts: []
    }
};

export default async function PartnerPage({params}: { params: Promise<{ slug: string }> }) {
    const {slug} = await params;
    const partner = partnersData[slug];

    if (!partner) {
        notFound();
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1">
                {/* Hero Section */}
                <section
                    className="relative py-12 md:py-20 bg-gradient-to-b from-primary/10 to-background overflow-hidden w-full">
                    <div className="px-4 md:px-8 max-w-7xl mx-auto relative z-10">
                        <Link
                            href="/#partners"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4"/>
                            Retour aux partenaires
                        </Link>

                        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                            <div
                                className="w-48 h-48 relative bg-white rounded-2xl p-6 shadow-xl flex items-center justify-center shrink-0">
                                <Image
                                    src={partner.logo}
                                    alt={partner.name}
                                    width={200}
                                    height={200}
                                    className="object-contain max-h-full"
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-6 font-barlow">
                                    {partner.name}
                                </h1>
                                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
                                    {partner.description}
                                </p>
                                {partner.website && (
                                    <Button asChild className="mt-8" variant="outline">
                                        <Link href={partner.website} target="_blank" rel="noopener noreferrer">
                                            Visiter le site officiel
                                            <ExternalLink className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Principle Section */}
                <section className="py-16 md:py-24 bg-background w-full">
                    <div className="px-4 md:px-8 max-w-7xl mx-auto">
                        <ScrollReveal>
                            <div className="max-w-3xl mx-auto text-center mb-16">
                                <div
                                    className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                                    <Handshake className="mr-2 h-4 w-4"/>
                                    Principe du partenariat
                                </div>
                                <h2 className="text-3xl md:text-4xl font-semibold mb-6 font-barlow">
                                    Comment nous travaillons ensemble
                                </h2>
                                <div className="text-lg text-muted-foreground">
                                    <p>{partner.principle}</p>
                                </div>
                            </div>
                        </ScrollReveal>

                        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
                            <ScrollReveal animation="slide-right">
                                <div
                                    className="bg-muted/30 rounded-3xl p-8 md:p-12 h-full relative overflow-hidden border border-border/50">
                                    <div
                                        className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"/>
                                    <h3 className="text-2xl font-semibold mb-8 flex items-center font-barlow">
                                        <Gift className="mr-3 h-6 w-6 text-primary"/>
                                        Avantages & Soutiens
                                    </h3>
                                    <ul className="space-y-6">
                                        {partner.benefits.map((benefit: string, i: number) => (
                                            <li key={i} className="flex gap-4 items-start">
                                                <div className="h-2 w-2 rounded-full bg-primary mt-2.5 shrink-0"/>
                                                <span
                                                    className="text-muted-foreground text-lg leading-snug">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal animation="slide-left">
                                <div
                                    className="bg-background rounded-3xl p-8 md:p-12 h-full relative overflow-hidden border border-border shadow-sm">
                                    <h3 className="text-2xl font-semibold mb-8 flex items-center font-barlow">
                                        <Handshake className="mr-3 h-6 w-6 text-primary"/>
                                        Nos engagements & contreparties
                                    </h3>
                                    {partner.counterparts.length === 0 || (partner.counterparts.length === 1 && partner.counterparts[0].toLowerCase() === "aucune") ? (
                                        <div
                                            className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-muted/10">
                                            <div className="bg-muted-foreground/10 p-4 rounded-full mb-4">
                                                <Handshake className="h-8 w-8 text-muted-foreground/40"/>
                                            </div>
                                            <p className="text-muted-foreground text-lg font-medium">Aucune contrepartie
                                                demandée</p>
                                            <p className="text-muted-foreground/60 text-sm mt-1">Ce partenaire nous
                                                soutient sans rien attendre en retour.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-6">
                                            {partner.counterparts.map((counterpart: string, i: number) => (
                                                <li key={i} className="flex gap-4 items-start">
                                                    <div
                                                        className="h-2 w-2 rounded-full bg-primary/40 mt-2.5 shrink-0"/>
                                                    <span
                                                        className="text-muted-foreground text-lg leading-snug italic">"{counterpart}"</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </ScrollReveal>
                        </div>

                        <ScrollReveal animation="fade-in">
                            <p className="mt-16 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                                Dans un souci de transparence, nous rendons public le contenu de nos accords de
                                partenariat.
                                Pour toute question, n'hésitez pas à nous contacter.
                            </p>
                        </ScrollReveal>
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
