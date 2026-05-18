import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {ShieldCheck} from "lucide-react";

import {constructMetadata} from "@/lib/metadata";

export const metadata = constructMetadata({
    title: "Politique de Confidentialité",
    description: "Comment nous protégeons vos données et respectons votre vie privée au sein du Trèfle 2.0.",
});

export default async function ConfidentialitePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader session={session}/>
            <main className="flex-1 bg-muted/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div
                        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"/>
                    <div
                        className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"/>
                </div>

                <section className="py-20 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                            <ShieldCheck className="h-10 w-10"/>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight italic mb-6">
                            Politique de Confidentialité
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Comment nous protégeons vos données et respectons votre vie privée.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
                        <div className="bg-background border rounded-3xl p-8 md:p-12 shadow-sm">
                            <h2 className="text-2xl font-bold mb-4">Article 1 : Préambule</h2>
                            <p className="mb-6">
                                Cette politique explique comment l’association « Le Trèfle 2.0 » collecte et traite les
                                données personnelles des utilisateurs de ses services d’écoute, disponibles via Discord
                                et le chat public sur son site internet. Nous nous engageons à garantir la
                                confidentialité, l’anonymat et la sécurité des échanges, conformément au RGPD.
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 2 : Données collectées et finalités</h2>
                            <h3 className="text-xl font-semibold mb-3">2.1 Canaux de collecte</h3>
                            <p className="mb-4">Les données sont collectées via :</p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Discord : identifiant utilisateur et contenu des messages ;</li>
                                <li>Chat public sur le site internet : identifiants anonymes, messages, et informations
                                    techniques nécessaires au bon fonctionnement du service ;
                                </li>
                                <li>Formulaire de recrutement : coordonnées (nom, prénom, email, téléphone), parcours,
                                    motivations et autres informations demandées dans le cadre du processus de sélection
                                    ;
                                </li>
                                <li>Liste d'attente de recrutement : adresse email.</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">2.2 Types de données collectées</h3>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Identifiants techniques anonymes pour assurer la continuité des sessions de chat ;
                                </li>
                                <li>Contenu des messages échangés pendant les sessions d’écoute ;</li>
                                <li>Métadonnées techniques (comme les informations sur le navigateur) pour résoudre
                                    d’éventuels problèmes ;
                                </li>
                                <li>Nom d’affichage (par défaut : « Utilisateur ») pour personnaliser l’expérience ;
                                </li>
                                <li>Preuve de consentement à la politique de confidentialité.</li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">2.3 Finalités du traitement</h3>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Fournir un service d’écoute et de soutien moral ;</li>
                                <li>Assurer le fonctionnement technique du chat en temps réel ;</li>
                                <li>Gérer les candidatures aux postes de bénévoles ;</li>
                                <li>Notifier les personnes intéressées de la réouverture d'un recrutement via la liste
                                    d'attente ;
                                </li>
                                <li>Réaliser des analyses statistiques anonymisées (nombre de sessions, durée moyenne,
                                    etc.).
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">2.4 Base légale</h3>
                            <p className="mb-4">Le traitement des données repose sur :</p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Le consentement de l’utilisateur, recueilli avant le début du chat ;</li>
                                <li>L’intérêt légitime de l’association pour garantir la sécurité et la qualité des
                                    échanges.
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">2.5 Durée de conservation</h3>
                            <ul className="list-disc pl-6 mb-8 space-y-2">
                                <li>Les transcriptions des messages sont conservées 1 an ;</li>
                                <li>Les candidatures aux recrutements sont conservées pendant toute la durée du
                                    processus de sélection et jusqu'à 2 ans après le dernier contact ;
                                </li>
                                <li>Les adresses emails de la liste d'attente de recrutement sont supprimées
                                    immédiatement après l'envoi de la notification de réouverture ;
                                </li>
                                <li>Les identifiants anonymes sont conservées 2 ans sous forme hachée ;</li>
                                <li>Les données techniques temporaires (comme les cookies de session) sont supprimées
                                    après 24 heures ;
                                </li>
                                <li>Les données stockées localement sur l’appareil de l’utilisateur (comme le nom
                                    d’affichage ou le consentement) le restent jusqu’à ce que l’utilisateur les
                                    supprime.
                                </li>
                            </ul>

                            <h2 className="text-2xl font-bold mb-4">Article 3 : Cookies et technologies similaires</h2>
                            <p className="mb-4">Le chat public utilise des cookies strictement nécessaires pour :</p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Maintenir la connexion sécurisée entre l’utilisateur et le service ;</li>
                                <li>Garantir la continuité de la session pendant 24 heures.</li>
                            </ul>
                            <p className="mb-8">
                                Ces cookies sont sécurisés et ne permettent pas d’identifier personnellement
                                l’utilisateur.
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 4 : Sécurité et hébergement</h2>
                            <ul className="list-disc pl-6 mb-8 space-y-2">
                                <li>Les échanges sont chiffrés (HTTPS/WSS) ;</li>
                                <li>Les identifiants sont hachés après la clôture de la session pour empêcher toute
                                    ré-identification ;
                                </li>
                                <li>Les données sont hébergées en Irlande, par Microsoft Ireland Operations Limited,
                                    dans le respect des normes européennes de protection des données ;
                                </li>
                                <li>L’accès aux données est restreint aux membres autorisés de l’association.</li>
                            </ul>

                            <h2 className="text-2xl font-bold mb-4">Article 5 : Droits des utilisateurs</h2>
                            <p className="mb-6">
                                Chaque utilisateur peut exercer ses droits (accès, rectification, effacement,
                                opposition, etc.) en contactant <a href="mailto:webmaster@letrefle.org"
                                                                   className="text-primary hover:underline">webmaster@letrefle.org</a>.
                                Pour faciliter le traitement de la demande, il est possible de préciser :
                            </p>
                            <ul className="list-disc pl-6 mb-8 space-y-2">
                                <li>Son identifiant Discord (si applicable) ;</li>
                                <li>Ou l’identifiant de session utilisé sur le site.</li>
                            </ul>

                            <h2 className="text-2xl font-bold mb-4">Article 6 : Utilisateurs mineurs</h2>
                            <p className="mb-8">
                                Les mineurs peuvent utiliser le service sans consentement parental, afin de préserver
                                leur anonymat et leur liberté de parole. Le traitement de leurs données repose sur la
                                protection de leurs intérêts vitaux.
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 7 : Modification de la politique</h2>
                            <p className="">
                                Toute modification significative sera portée à la connaissance des utilisateurs via une
                                annonce sur le site et dans l’application.<br/>
                                La présente politique, éditée le 1er mars 2025, a été mise à jour le 18 mai 2026.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
