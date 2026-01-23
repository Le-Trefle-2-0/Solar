"use client";

import {useState} from "react";
import {ChevronDown, HelpCircle, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible";
import {cn} from "@/lib/utils";

const faqData = [
    {
        date: "18/05/2023",
        questions: [
            {
                id: "v2023-1",
                question: "Est-ce qu’un « Trèfle 3.0 » va sortir ?",
                answer: "Il n’est pas prévu de faire de « Trèfle 3.0 » car Le Trèfle 2.0 n’est pas la seconde version d’un premier projet. Lors de la création de l’association, le but était de choisir un nom enthousiaste et bienveillant, d’où « Le Trèfle ». Quant au « 2.0 », celui-ci fait référence à la présence en ligne de l’association."
            },
            {
                id: "v2023-2",
                question: "Est-ce que les débats et les cafés philos vont revenir ?",
                answer: "Les débats sont depuis peu de nouveau organisé de manière régulière. Les cafés philos nécessitent eux une grande organisation, car nos disponibilités sont orientées vers d’autres points nous semblant plus essentiels au fonctionnement cœur de l’association. Nous gardons cependant le souhait d’en organiser à nouveau dès que possible."
            },
            {
                id: "v2023-3",
                question: "Serait-il possible d’ajouter d’autres bots amusants ?",
                answer: "Le bot DraftBot ainsi que des salons histoire infinie et compter jusqu’à l’infini sont depuis plusieurs mois disponibles sur le serveur. Notre équipe technique travaille actuellement sur la mise en place d’un bot dédié pour le serveur servant avant tout les besoins fonctionnels de l’équipe, mais il n’est pas impossible d’envisager des activités sur celui-ci. Concernant l’ajout de bots externes, nous cherchons à diversifier les activités possibles sur le serveur. L’ajout de bots n’est dans l’immédiat pas notre priorité, mais nous restons ouverts à cette possibilité."
            },
            {
                id: "v2023-4",
                question: "Les horaires des permanences vont-elles changer ?",
                answer: "Il n’est pas prévu de les faire évoluer dans l’immédiat. Bien que l’objectif à long terme soit de proposer nos services d’écoutes tous les jours, 24h/24, nous ne disposons pas de la capacité d’accueil et du nombre de bénévoles suffisant pour proposer cela. Il reste pour nous primordial que l’activité des bénévoles au sein de l’association ne soit pas un poids, et que chacun se sente libre de venir lorsqu’il le souhaite. L’idée est d’étendre petit à petit les horaires d’ouverture au fil que notre équipe s’agrandit. La problématique se pose également concernant les fermetures annuelles, tel que les vacances d’été ou de manière plus spontanée dans l’année. Bien que nous ayons passé cette année le cap des 100 bénévoles, notre équipe reste petite en comparaison a d’autres grandes associations d’écoute. Il nous arrive lorsqu’un nombre insuffisant de bénévoles parvient à se mobiliser de ne pas pouvoir assurer l’ouverture de certaines permanences. Cela fait également partie de nos objectifs d’évolution."
            },
            {
                id: "v2023-5",
                question: "Le serveur Discord sera-t-il communautaire, ou simplement un serveur d’écoute ?",
                answer: "A l’origine le serveur est avant tout un serveur d’écoute, l’origine du projet ne prévoyait même pas la mise en place de salons de communications publics mais uniquement un salon type permanence avec la possibilité d’ouvrir une écoute. Cependant, conscient du fonctionnement de Discord nous sommes contraints de nous adapter au fonctionnement communautaire de la plateforme. Bien que notre volonté reste de centrer l’activité de l’association sur l’écoute, nous avons également pour objectif de proposer un maximum d’activités annexes. Cela rejoint également l’objectif de permettre aux membres du serveur de ne pas se faire « afficher » comme souhaitant ouvrir une écoute car n’allant pas nécessairement bien."
            },
            {
                id: "v2023-6",
                question: "Quelle est la différence entre le Responsable Bénévoles Écoutants et les Bénévoles Écoutants ?",
                answer: "Un bénévole écoutant est celui qui prend en charge l’écoute. Le RBE lui ne prend aucune écoute en charge, il a avant tout pour objectif d’assurer l’organisation de la permanence. Il ne prend donc pas personnellement en charge les écoutes ouvertes, mais les attribue aux bénévoles écoutants, et a également pour responsabilité d’assurer le bon déroulement des écoutes, notamment en conseillant les bénévoles et de repérer leurs éventuelles difficultés. C’est également le référent qui ouvre et ferme la permanence. Le référent est donc avant tout un bénévole écoutant confirmé, et doit également avoir une bonne compréhension et maitrise technique de tous les outils utilisés afin de proposer l’assistance nécessaire aux bénévoles."
            },
            {
                id: "v2023-7",
                question: "Y-aura-t-il une section garde de jour avec une permanence le matin ?",
                answer: "Les permanences la journée sont compliquées à mettre en place, pour les mêmes raisons qu’il est pour nous difficile d’ouvrir la permanence 24h/24. Notre nombre de bénévoles étant limité, et étant pour la plupart étudiants ou travailleurs la journée ne fait pas partie de leurs créneaux de potentielles disponibilités. Pour cela, nous pourrions envisager le recrutements de bénévoles par exemple à la retraite, ou des francophones d’autres fuseaux horaires que celui de Paris. Cela fait également partie des objectifs d’évolution à long termes, mais ce serait pour le moment prématuré de le mettre en place."
            },
            {
                id: "v2023-8",
                question: "Notre activité sera-t-elle étendue sur d’autres réseaux sociaux (TikTok, Instagram ou autres…) ?",
                answer: "Nous sommes déjà présents sur Instagram, TikTok, Twitter ainsi que LinkedIn, cependant ces réseaux sont essentiellement des canaux de communication. Nous ne proposerons pas d’écoutes sur d’autres réseaux sociaux que Discord dans l’immédiat. Concernant la communication, nous prêtons une attention toute particulière à notre manière de communiquer ainsi qu’à la quantité de communication que nous effectuons afin d’éviter tout déséquilibre entre le nombre de bénévoles et le nombre de demandes d’écoutes reçues. La majorité de notre communication se concentre donc généralement sur le recrutement de bénévoles. N’hésitez en tout cas pas à partager l’association autour de vous !"
            },
            {
                id: "v2023-9",
                question: "Pensez-vous refaire l’esthétique du serveur Discord ?",
                answer: "Concernant l’esthétique d’un serveur Discord, il n’y a pas réellement beaucoup de choses à faire. Il serait possible de rajouter des autocollants ou émojis a l’image de l’association. Mais concernant les salons, il reste pour nous primordial de créer un serveur simple et accessible."
            },
            {
                id: "v2023-10",
                question: "C’est cool d’être bénévole ou pas ?",
                answer: ""
            },
            {
                id: "v2023-11",
                question: "Les bénévoles peuvent-ils ouvrir une écoute ?",
                answer: "Oui, c’est tout à fait possible, mais cela reste parfois difficile car l’équipe reste limitée et on se connait beaucoup. Il y a donc moins de neutralité. Même sans voir le pseudo du a l’anonymat des écoutes, selon le sujet et l’histoire de l’écoute il reste possible de reconnaitre quelqu’un que l’on connait bien. Les bénévoles disposent tout de même, dans le cadre de leur activité associative d’un accès aux groupes de partage ainsi qu’aux permanences individuelles avec la psychologue de l’association."
            },
            {
                id: "v2023-12",
                question: "Qui sont les modérateurs et quelle est la différence avec les techniciens ?",
                answer: "Bien que le serveur ne soit pas un serveur communautaire, il reste tout de même un hybride entre un serveur communautaire et un serveur d’écoute. Il est donc important pour nous de disposer d’équipes dédiées à la communauté. Notre prochaine assemblée générale doit voter la mise en place d’équipes dédiées respectivement à, la modération, l’animation, la gestion de la communauté, ainsi qu’une équipe de helpers. Dans l’immédiat, les modérateurs disposent d’un rôle polyvalent a l’intermédiaire de ce que seront à l’avenir les équipes de modération, d’animation, ainsi qu’les helpers. Les techniciens sont quant à eux actuellement assez polyvalent dans leur rôle concernant à la fois la technique Discord, mais aussi le développement du bot d’écoute et de notre future plateforme interne. Cette équipe sera également séparée en deux, avec une équipe technique dédiée à Discord ainsi qu’une équipe infrastructure dédiée au site internet, au bot ainsi qu’à l’application du Trèfle 2.0."
            },
            {
                id: "v2023-13",
                question: "Qu’est-ce que la future plateforme du Trèfle 2.0 ?",
                answer: "Notre nouvelle plateforme est une application en cours de développement depuis un an et demi qui sera à l’avenir utilisée par tous nos bénévoles écoutants. Cette plateforme a pour objectif de faciliter l’organisation du planning ainsi que la prise en charge des écoutes. Pour les utilisateurs, cette plateforme ne changera pas le fonctionnement des écoutes car notre bot d’écoutes restera le même sur Discord, et sera lui lié aux bénévoles écoutants sur notre application. Cette plateforme nous permettra également d’imposer des standards de sécurité et de chiffrement de données plus importants que ceux mis en place par Discord, car la confidentialité et la sécurité restent parmi nos objectifs majeurs."
            },
            {
                id: "v2023-14",
                question: "Comment contacter un bénévole écoutant ?",
                answer: "Afin de prendre contact avec un bénévole écoutant, il faut se rendre sur notre serveur discord dans le salon « bénévole-écoutant », puis lors de nos horaires de permanences un bouton vert « ouvrir une écoute » sera accessible. En cliquant dessus, le bot d’écoutes envoie à l’utilisateur un message privé et l’échange pourra se dérouler, pour l’utilisateur en messages privés avec le bot. Nos permanences, initialement ouvertes les lundis, mercredis et vendredis de 20h à 23h sont maintenant ouvertes tous les soirs de 20h à 23h."
            },
            {
                id: "v2023-15",
                question: "Qui sont les helpers, et peut-on postuler, si oui comment ?",
                answer: "Les helpers font partie des projets d’évolution en termes d’organisation des équipes. Bien qu’un rôle Helper existe déjà sur le serveur, celui-ci n’était que très limité pour une mise en place spécifique. Cette équipe aura après sa création l’objectif d’accompagner et d’orienter les utilisateurs sur le serveur Discord. Il sera donc attendu des membres de cette équipe qu’ils connaissent le fonctionnement interne de l’association et qu’ils sachent où trouver les ressources afin d’orienter les membres. Les recrutements se font sur notre page de recrutements internet ou l’ensemble des fiches de postes ainsi que le processus de recrutement est affiché."
            },
            {
                id: "v2023-16",
                question: "Allons-nous un jour faire des partenariats ?",
                answer: "Les « partenariats » au sens où ils sont souvent entendus sur Discord, nous ne comptons pas en faire. Le seul partenariat officiel dont nous disposons actuellement est la boussole des jeunes, mais celui-ci n’a pas encore été mis en place, plus d’informations seront communiquées dès que cela sera davantage en place. Nous disposons également du soutient d’autres organismes, comme ProtonMail, un service de messagerie informatique nous permettant d’échanger par courriel de manière sécurisée. Microsoft nous fournit également plusieurs services, notamment concernant leur service d’infrastructure informatique Azure. L’ACEGAA est une association du Gard nous accompagnant également dans notre activité, nous aidant pour nos dossiers de subvention ainsi qu’à l’organisation interne de l’association. Et finalement, depuis maintenant plus d’un an nous avons le statut de Partenaire Discord, nous permettant l’accès à différents outils de communications et de mise en avant du coté de Discord."
            },
            {
                id: "v2023-17",
                question: "Pensez-vous faire une candidature pour la certification Discord ?",
                answer: "La reconnaissance de notre activité et de notre sérieux par Discord et pour nous très important et une grande fierté. La certification Discord serait une reconnaissance de notre statut officiel en tant qu’association, cependant dans notre cas le partenariat Discord constitue un outil plus important car celui-ci nous permet l’accès a plusieurs avantage."
            },
            {
                id: "v2023-18",
                question: "Avez-vous pensé à être partenaire avec d’autres organismes tels que Night Line ?",
                answer: "Les associations d’écoutes ne sont pas partenaires entre elles, mais sont unies par l’UNPS, l’Union Nationale de la Prévention du Suicide. D’autres projets internes à l’association et au serveur Discord nous occupent actuellement, mais nous avons à termes pour objectif d’intégrer ce genre de réseau. A la différence de Night Line, nous sommes une association, tandis qu’ils sont une fédération constituée de beaucoup d’antennes locales, et c’est aussi le cas de SOS Amitiés. Nous n’avons pas pour projet de faire une fédération pour le Trèfle, car étant en ligne il est pour nous beaucoup plus simple de nous organiser à distance."
            },
            {
                id: "v2023-19",
                question: "Qu’est-ce que les Cafés Philos ?",
                answer: "Les Cafés Philos sont des moments d’échange et de discussion, comparables aux débats, cependant l’objectif n’est pas d’argumenter pour convaincre les autres mais plus d’apporter son point de vue et de construire ensemble une réponse à un sujet. Il n’y a pas de bon ou de mauvais avis, l’idée est plus de s’écouter et d’échanger la ou les débats sont plus un lieu de confrontation des idées et d’argumentation dans un objectif de convaincre les autres participants."
            },
        ]
    },
    {
        date: "18/05/2022",
        questions: [
            {
                id: "v2022-1",
                question: "Pourquoi l’association Le Trèfle 2.0 existe-elle ?",
                answer: "Le Trèfle 2.0 est une association de Loi 1901 reconnue d’action sociale et d’intérêt générale, officiellement créée le 9 septembre 2020. Cette association a été créée à la suite d’un constat par les deux membres fondateurs se rendant compte de l’absence d'une plateforme d’écoute adaptée sur Discord, et de la gravité de la situation concernant la prise en charge des différentes souffrances psychologique. Contrairement à beaucoup d’organisations du même type, Le Trèfle se démarque par sa présence sur Discord, réseau social répondant aux demandes pour un usage quotidien, et adapté à l’écoute par son système d’organisation en salons privés."
            },
            {
                id: "v2022-2",
                question: "Qui sont les Bénévoles Écoutants ?",
                answer: "Les Bénévoles Écoutants (BE), prenant en charge les demandes d’écoutes sur le serveur Discord ont minimum 21 ans (âge qui sera sous peu augmenté à 25 ans). L’objectif de cette restriction est de protéger les bénévoles en limitant le risque pour une personne jeune de se retrouver confrontée en écoute à une personne plus âgée et à un stade plus avancé de la vie.\n\nLes recrutements des Bénévoles Écoutants sont en trois étapes : un entretien téléphonique individuel lors duquel le poste est présenté plus en détail, et les compétences sont rapidement évaluées. S’en suit la Formation Initiale BE de 5 heures, obligatoire et en groupe, celle-ci a pour objectif de présenter aux bénévoles les différentes techniques utilisées lors des écoutes tel que celle de l’écoute active. Une intégration individuelle est ensuite réalisée pour présenter les outils au futur bénévole et proposer une explication plus poussée de l’aspect technique de la prise en charge d’une écoute.\n\nUn Bénévole Écoutant n’est pas nécessairement du milieu médical, mais un encadrement proche est réalisé par l’Équipe Consensus, composée de professionnels en psychologie de différentes spécialités."
            },
            {
                id: "v2022-3",
                question: "Comment contacter un Bénévole Écoutant ?",
                answer: "Pour contacter un Bénévole Écoutant il faut tout d’abord être inscrit sur Discord, et rejoindre le serveur discord, ainsi qu’en accepter le règlement. Il est ensuite possible de se rendre dans le salon #👂・bénévole-écoutant dans le menu sur la gauche de l’interface de Discord, dans le quel un message, lors des horaires d’ouverture de la permanence, proposera un bouton 👋 Ouvrir une écoute sur le quel il suffit de cliquer pour être mis en relation avec un bénévole écoutant.\n\nLe système d’écoute est anonyme, l’utilisateur et le Bénévole Écoutant ne voient pas leur pseudo l’un l’autre dans l’objectif de protéger l’utilisateur et qu’il se sente libre concernant le sujet de discussion, et permet aux Bénévoles Écoutants d’être le plus neutre possible. C’est pour cette raison que du point de vue de l’utilisateur l’écoute est effectuée par messages privés avec le BOT @Le Trèfle 2.0.\n\nLes écoutes peuvent également, sauf cas particulier, et sur demande de l’utilisateur se dérouler à l’oral, mais aucun système ne permet actuellement d’anonymiser une écoute orale."
            },
            {
                id: "v2022-4",
                question: "Quel est le quotidien d’un Bénévole Écoutant une fois sa formation terminée ?",
                answer: "Les Bénévoles Écoutants participent, selon leurs disponibilités aux permanences actuellement les lundis, mercredis, et vendredis de 20h à 23h. Ces horaires vont progressivement être augmentées, un passage à des permanences tous les jours de 20h à 23h est prévu à compter du 4 avril 2022. Le bénévole s’inscrit sur un planning sur le quel les permanences sont affichées, pour des créneaux de 1h30 consécutives.\n\nAprès chaque écoute les bénévoles réalisent une transmission, compte rendu dans le quel ils résument leurs impressions et la problématique de l’écoute qu’ils ont pris en charge. Ces transmissions sont utilisées pour l’accompagnement des bénévoles."
            },
            {
                id: "v2022-5",
                question: "Comment devient-on Référent Bénévole Écoutant ?",
                answer: "Un Référent Bénévole Écoutant (RBE) est avant tout un Bénévole Écoutant confirmé. Il doit avoir minimum entre 3 et 6 mois d’expérience au sein de l’association, et le poste est proposé par M. le Président Anthony Jacob.\n\nUne fois la proposition effectuée et acceptée par le BE en question, un entretient est réalisé, et l’Équipe Consensus prend ensuite la décision de son intégration en tant que RBE.\n\nLe RBE est avant toute chose présent pour accompagner les BE, pour répartir les écoutes entre les bénévoles, s’assurer du bon déroulement de toutes les écoutes et doit aussi avoir un minimum de connaissances techniques, c’est également lui qui réalise différentes tâches de gestion des écoutes.\n\nUne formation supplémentaire est également réalisée pour permettre au RBE, en cas de soucis, de déclencher des services de secours sur place en cas de danger pour la personne. Seul le référent est habilité à appeler des services d’urgences."
            },
            {
                id: "v2022-6",
                question: "Comment se déroule le déclenchement des secours en cas de danger ?",
                answer: "Le bénévole en charge de l’écoute en question reste en relation avec la personne, le référent ne fait pas de relai sur l’écoute, il alerte simplement les secours adaptés avec les informations fournies volontairement par la personne en demande d’écoute."
            },
            {
                id: "v2022-7",
                question: "Quels sujet les sujets abordables lors d’une écoute ?",
                answer: "Tous les sujets sont acceptables, tels que :\n\n• Rompre l’isolement\n• Parler de sa journée\n• Parler de ses questionnements\n• Situation de harcèlement\n• Orientation sexuelle\n• Ses craintes\n\nIl n’existe pas de question bête, les BE sont là pour échanger avec les personnes en demande sans porter de jugement.\n\nSi des informations criminelles sont transmises aux Bénévoles Écoutants, ces informations seront tout de même transmises aux autorités compétentes, pour des raisons légales."
            },
            {
                id: "v2022-8",
                question: "Qui sont les Modérateur.ices ?",
                answer: "Les Modérateurs recrutés ont au moins 18 ans, mais il est cependant possible dans certains cas exceptionnels d’être modérateur des 16 ans. Un Modérateur est recruté en trois étapes : un premier entretient avec un Coordinateur des Équipes, ou un membre fondateur en charge de son recrutement, puis avec d’autres Modérateurs afin d’expliquer l’aspect technique de la modération sur le serveur. Après ces deux entretiens, une période d’essai d’un mois, renouvelable si besoin, est mise en place. À la suite de cette période, le modérateur est pleinement intégré.\n\nIl faut, pour être modérateur, avoir un minimum de connaissances techniques sur Discord afin de pouvoir réaliser le nécessaire en cas de soucis, et maitriser de manière plus générale les outils informatiques."
            },
            {
                id: "v2022-9",
                question: "Quelle est la différence entre les Techniciens et les Modérateurs ?",
                answer: "L’équipe de modération est présente dans un objectif d’encadrement des discussions réalisées dans les salons de communication publics et de vérification de la nature des échanges pour assurer que ceux-ci soient bien conformes au règlement. Ils sont également présents dans un objectif d’orientation des membres du serveur Discord en cas de questionnement.\n\nUn Technicien a plus pour rôle de veiller au bon fonctionnement des outils utilisés par l’association, et de la configuration du serveur Discord. Depuis la mise en place du bot, les techniciens sont également attentifs à ce dernier."
            },
            {
                id: "v2022-10",
                question: "Comment contacter un modérateur en cas de soucis avec un autre membre ?",
                answer: "Il est possible de contacter les modérateurs, identifiés grâce au rôle @Modérateur/trice directement par messages privés, ou via le salon #🎫・contacter-un-modérateur depuis le quel il est possible de créer un ticket. Cette deuxième option est à favoriser afin de permettre à n’importe quel modérateur disponible de prendre en charge la demande."
            },
            {
                id: "v2022-11",
                question: "Comment se passe la modération sur le serveur ?",
                answer: "La modération du serveur est stricte dans l’objectif de proposer à tous un espace d’échange accessible à tous, tout en faisant en sorte que chaque membre puisse bénéficier de tous les avantages que proposent une communauté au sein de la quelle les particularités de chacun sont prises en compte.\n\nEn cas de soucis, les modérateurs peuvent entrer en contact avec les membres aux agissements contraires au règlement par différentes manières. Les étapes de modération sont les suivantes :\n\n• Fiche Vigilance, interne aux modérateurs celle-ci permet de communiquer un besoin de vigilance accrue sur un membre.\n• Prise de contact, cet échange permet aux modérateurs de rappeler le règlement au membre en question, tout en laissant la possibilité de discuter de l’événement problématique afin d’expliquer les raisons de cette modération forte.\n• Avertissement, si un membre a été averti et qu’une infraction est à nouveau commise, celui-ci peut subir un avertissement, étape suivante de la prise de contact.\n• Sourdine, lorsqu’un membre persiste dans son non-respect du règlement, celui-ci peut être placé en sourdine, lui enlevant temporairement la possibilité de communiquer dans les salons publics.\n• Bannissement, en cas d’infraction lourde un bannissement temporaire ou définitif peut être appliqué, empêchant complètement la personne de rejoindre le serveur Discord à nouveau."
            },
            {
                id: "v2022-12",
                question: "Y a-t-il souvent des réunions d’équipes ?",
                answer: "L’équipe de Bénévoles Écoutants se réunit souvent dans le format de « formations continues » organisées tous les deux mois. L’équipe de modération se retrouve dans l’objectif de faire un point commun sur les impressions et avis au sein de l’équipe à minima tous les mois.\n\nLes équipes communiquent de manière interne en dehors de ces réunions bien plus régulièrement généralement à l’écrit afin de se coordonner sur les actions menées au sein du serveur."
            },
            {
                id: "v2022-13",
                question: "Pourquoi la modération est-elle très stricte concernant les problèmes personnels et les soucis de santé ?",
                answer: "Pour des raisons de sécurité, l’intégralité de l’équipe de modération est très attentive aux communications, particulièrement lors que celles-ci concernent des soucis de santé. Les problématiques personnelles ne peuvent pas être publiées dans les salons publics par mesure de sécurité. De telles données sont très sensibles, et nous sommes tout particulièrement attentifs à la protection des données et de la vie privée de chacun, afin d’assurer qu’aucune personne tierce puisse les utiliser à des fins malveillantes.\n\nC’est pour cette même raison que la prise en charge d’écoutes est strictement réservée aux bénévoles écoutants, formés et tenus par le secret professionnel."
            },
            {
                id: "v2022-14",
                question: "Comment accéder aux salons vocaux, et pourquoi n’y ai-je pas accès quand je le souhaite ?",
                answer: "Il est possible d’accéder aux salons vocaux en toute autonomie dès que le niveau 5 est atteint. Ces niveaux sont obtenus grâce à un BOT. Vous pouvez consulter votre niveau en écrivant *rank dans le salon #⌨・commandes-lvl. Ce système permet aux modérateurs d’assurer la sécurité des salons vocaux tout comme les salons textuels, et le niveau 5 est représentatif d’un minimum d’activité sur le serveur, et donc une base de confiance établie.\n\nLes salons vocaux sont toutefois à certains moments ouverts à tous, lorsqu’un modérateur est disponible pour assurer une modération constante."
            },
            {
                id: "v2022-15",
                question: "Les horaires de fermeture vont-elles changer ?",
                answer: "La fermeture nocturne des salons a pour objectif de faciliter la tache de la modération, afin d’assurer un temps de repos aux modérateurs. Cette mesure a également pour objectif d’éviter une présence nocturne et prolongée des membres devant les écrans. Pour ces raisons, un léger allongement des périodes d’ouverture est envisageable, mais une ouverture 24h/24 n’est pas prévue."
            },
        ]
    }
];

export function FAQClient() {
    const [searchQuery, setSearchQuery] = useState("");
    const [openItems, setOpenItems] = useState<string[]>([]);

    const filteredData = faqData.map(section => ({
        ...section,
        questions: section.questions.filter(q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(section => section.questions.length > 0);

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Search Bar */}
            <div className="relative group">
                <Input
                    type="text"
                    placeholder="Rechercher une question..."
                    className="pl-12 h-14 text-lg rounded-2xl border-none shadow-lg bg-background/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search
                        className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors"/>
                </div>
            </div>

            {filteredData.length > 0 ? (
                filteredData.map((section) => (
                    <div key={section.date} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-semibold italic text-primary font-barlow">F.A.Q.
                                du {section.date}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent"/>
                        </div>

                        <div className="grid gap-4">
                            {section.questions.map((q) => (
                                <Collapsible
                                    key={q.id}
                                    open={openItems.includes(q.id)}
                                    onOpenChange={(isOpen) => {
                                        if (isOpen) {
                                            setOpenItems([...openItems, q.id]);
                                        } else {
                                            setOpenItems(openItems.filter(id => id !== q.id));
                                        }
                                    }}
                                    className="group"
                                >
                                    <CollapsibleTrigger asChild>
                                        <button
                                            className="flex w-full items-center justify-between p-6 rounded-2xl bg-card hover:bg-accent/50 text-left transition-all shadow-sm border border-transparent hover:border-primary/10">
                                            <span className="text-lg font-semibold pr-8 font-barlow">{q.question}</span>
                                            <ChevronDown className={cn(
                                                "h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0",
                                                openItems.includes(q.id) && "rotate-180 text-primary"
                                            )}/>
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent
                                        className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                        <div
                                            className="px-6 py-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {q.answer || <span className="italic opacity-50">Aucune réponse pour le moment.</span>}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4"/>
                    <h3 className="text-xl font-semibold">Aucun résultat trouvé</h3>
                    <p className="text-muted-foreground">Essayez d'autres mots-clés pour votre recherche.</p>
                </div>
            )}
        </div>
    );
}
