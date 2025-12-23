import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PublicHeader} from "@/components/landing/header";
import {PublicFooter} from "@/components/landing/footer";
import {ShieldCheck} from "lucide-react";

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
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight italic mb-6">
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
                                La présente politique de confidentialité vise à informer les utilisateurs de
                                l’application Discord « Le Trèfle 2.0 » :
                            </p>
                            <ul className="list-disc pl-6 mb-8 space-y-2">
                                <li>Sur la manière dont nous collectons certaines données personnelles. Sont considérées
                                    comme des données personnelles toute information permettant d’identifier un
                                    utilisateur numérique ou relatives à sa situation personnelle, à savoir, notamment
                                    mais non exclusivement : l’identifiant utilisateur Discord, les messages d’une
                                    écoute ;
                                </li>
                                <li>Sur les droits dont ils disposent concernant ces données ;</li>
                                <li>Sur la personne responsable du traitement des données à caractère personnel
                                    collectées et traitées ;
                                </li>
                                <li>Sur les destinataires de ces données personnelles.</li>
                            </ul>

                            <h2 className="text-2xl font-bold mb-4">Article 2 : Principes relatifs à la collecte et au
                                traitement des données personnelles</h2>
                            <p className="mb-4">
                                Conformément à l’Article 5 du Règlement européen 2016/679, les données à caractère
                                personnel sont :
                            </p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Traitées de manière licite, loyale et transparente au regard de la personne
                                    concernée ;
                                </li>
                                <li>Collectées pour des finalités déterminées (cf. Article 3.1 des présentes),
                                    explicites et légitimes, et ne pas être traitées ultérieurement d’une manière
                                    incompatible avec ces finalités ;
                                </li>
                                <li>Adéquates, pertinentes et limitées à ce qui est nécessaire au regard des finalités
                                    pour lesquelles elles sont traitées ;
                                </li>
                                <li>Exactes et, si nécessaire, tenues à jour. Toutes les mesures raisonnables doivent
                                    être prises pour que les données à caractère personnel qui sont inexactes, eu égard
                                    aux finalités pour lesquelles elles sont traitées, soient effacées ou rectifiées
                                    sans tarder ;
                                </li>
                                <li>Conservées sous une forme permettant l’identification des personnes concernées
                                    pendant une durée n’excédant pas celle nécessaire au regard des finalités pour
                                    lesquelles elles sont traitées ;
                                </li>
                                <li>Traitées de façon à garantir une sécurité appropriée des données collectées, y
                                    compris la protection contre le traitement non autorisé ou illicite et contre la
                                    perte, la destruction ou les dégâts d’origine accidentelle, à l’aide de mesures
                                    techniques ou organisationnelles appropriées.
                                </li>
                            </ul>
                            <p className="mb-4">
                                Le traitement n’est licite que si, et dans la mesure où, au moins une des conditions
                                suivantes est remplie :
                            </p>
                            <ul className="list-disc pl-6 mb-8 space-y-2">
                                <li>La personne concernée a consenti au traitement de ses données à caractère personnel
                                    pour une ou plusieurs finalités spécifiques ;
                                </li>
                                <li>Le traitement est nécessaire au respect d’une obligation légale à laquelle le
                                    responsable du traitement est soumis ;
                                </li>
                                <li>Le traitement est nécessaire à la sauvegarde des intérêts vitaux de la personne
                                    concernés ou d’une autre personne physique ;
                                </li>
                                <li>Le traitement est nécessaire à l’exécution d’une mission d’intérêt public ou
                                    relevant de l’exercice de l’autorité publique dont est investi le responsable du
                                    traitement ;
                                </li>
                                <li>Le traitement est nécessaire aux fins des intérêts légitimes poursuivis par le
                                    responsable du traitement ou par un tiers, à moins que ne prévalent les intérêts ou
                                    les libertés et droits fondamentaux de la personne concernée qui exigent une
                                    protection des données à caractère personnel, notamment lorsque la personne
                                    concernée est un enfant.
                                </li>
                            </ul>

                            <h2 className="text-2xl font-bold mb-4">Article 3 : Données à caractère personnel collectées
                                et traitées dans le cadre de l’utilisation de l’application</h2>
                            <h3 className="text-xl font-semibold mb-3">Article 3.1 : Données collectées</h3>
                            <p className="mb-4">
                                Les données personnelles collectés dans le cadre de notre activité sont les suivantes :
                            </p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Identifiant utilisateur Discord de la personne ;</li>
                                <li>Contenu des messages d’une écoute ;</li>
                            </ul>
                            <p className="mb-6">
                                A la clôture de l’écoute, l’identifiant utilisateur Discord est chiffré de façon
                                irréversible, rendant impossible l’identification de l’utilisateur ayant ouvert une
                                écoute.
                                La collecte et le traitement de ces données répond aux finalités suivantes :
                            </p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Nécessité technique au bon fonctionnement de l’application ;</li>
                                <li>Analyse statistique publiées dans notre rapport d’activité annuel tel que, mais non
                                    limité à : nombre d’écoutes, nombre d’utilisateurs uniques)
                                </li>
                            </ul>

                            <h3 className="text-xl font-semibold mb-3">Article 3.2 : Mode de collecte des données</h3>
                            <p className="mb-4">
                                Lorsque vous utilisez notre application, les données listées ci-dessus sont
                                automatiquement collectés par transmission sécurisée avec Discord.
                                Elles sont conservées par le responsable du traitement dans des conditions raisonnables
                                de sécurité, pour une durée de :
                            </p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>1 an pour la transcription contenant l’historique des messages ;</li>
                                <li>2 ans pour la version chiffrée de l’identifiant.</li>
                            </ul>
                            <p className="mb-8">
                                L’association est susceptible de conserver certaines données à caractère personnel
                                au-delà des délais annoncés ci-dessus afin de remplir ses obligations légales ou
                                réglementaires.
                            </p>

                            <h3 className="text-xl font-semibold mb-3">Article 3.3 : Hébergement des données</h3>
                            <p className="mb-8">
                                L’application Discord « Le Trèfle 2.0 » est hébergée par :<br/>
                                Microsoft Ireland Operations Limited<br/>
                                70 Sir Rogerson's Quay<br/>
                                Dublin D02 R296<br/>
                                Irlande
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 4 : Responsable du traitement des données et
                                Délégué à la Protection des Données</h2>
                            <h3 className="text-xl font-semibold mb-3">Article 4.1 : Le responsable du traitement des
                                données</h3>
                            <p className="mb-6">
                                Les données à caractère personnelles sont collectées par l’association Le Trèfle 2.0,
                                enregistrée au Registre National des Associations sous le numéro : W30 300 5428.<br/>
                                Le responsable du traitement des données à caractère personnel peut être contacté par
                                courriel à l’adresse : webmaster@letrefle.org
                            </p>

                            <h3 className="text-xl font-semibold mb-3">Article 4.2 : Délégué à la protection des données
                                (Data Protection Officer, DPO)</h3>
                            <p className="mb-8">
                                Le délégué à la protection des données de l’association est :<br/>
                                Paul Peron Redon, joignable à l’adresse webmaster@letrefle.org<br/><br/>
                                Si vous estimez qu’après nous avoir contactés, vos droits « Informatique et Libertés »
                                ne sont pas respectés, vous pouvez adresser une information à la Commission Nationale de
                                l’Informatique et des Libertés (CNIL).
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 5 : Les droits de l’utilisateur en matière
                                de collecte et de traitement des données</h2>
                            <p className="mb-4">
                                Tout utilisateur concerné par le traitement de ses données personnelles peut se
                                prévaloir des droits suivants, en application en règlement européen 2016/679 et de la
                                Loi Informatique et Liberté (Loi 78-17 du 6 janvier 1978) :
                            </p>
                            <ul className="list-disc pl-6 mb-6 space-y-2">
                                <li>Droit d’accès, de rectification et droit à l’effacement des données (posées
                                    respectivement aux articles 15, 16 et 17 du règlement européen 2016/679) ;
                                </li>
                                <li>Droit à la portabilité des données (article 20 du règlement européen 2016/679) ;
                                </li>
                                <li>Droit à la limitation et à l’opposition du traitement des données (respectivement
                                    selon les articles 18 et 21 du règlement européen 2016/679) ;
                                </li>
                                <li>Droit de ne pas faire l’objet d’une décision fondée exclusivement sur un procédé
                                    automatisé ;
                                </li>
                                <li>Droit de déterminer le sort des données après la mort ;</li>
                                <li>Droit de saisir l’autorité de contrôle de compétence (article 77 du règlement
                                    européen 2016/679).
                                </li>
                            </ul>
                            <p className="mb-8">
                                Pour exercer vos droits, veuillez adresser un courriel à webmaster@letrefle.org ou par
                                courrier à : Le Trèfle 2.0, 324 chemin de Goulsou, 30120 Le Vigan.<br/>
                                Afin que le responsable du traitement des données puisse faire droit à sa demande,
                                l’utilisateur peut être tenu de lui communiquer certaines informations telles que : son
                                identifiant utilisateur Discord ou numéro d’écoute concernée.<br/>
                                Consultez le site cnil.fr pour plus d’informations sur vos droits.
                            </p>

                            <h2 className="text-2xl font-bold mb-4">Article 6 : Conditions de modification de la
                                politique de confidentialité</h2>
                            <p className="">
                                L’éditeur de l’application « Le Trèfle 2.0 » se réserve le droit de pouvoir modifier la
                                présente Politique à tout moment afin d’assurer aux utilisateurs du site sa conformité
                                avec le droit en vigueur.<br/>
                                L’utilisateur est invité à prendre connaissance de cette Politique à chaque fois qu’il
                                utilise nos services, sans qu’il soit nécessaire de l’en prévenir formellement.<br/>
                                La présente politique, éditée le 1er mars 2025, a été mise à jour le 1er mars 2025.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter/>
        </div>
    );
}
