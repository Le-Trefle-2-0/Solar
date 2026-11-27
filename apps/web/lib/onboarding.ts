/** Content of the tour shown at first sign-in (#82). */

export type TourStep = {title: string; text: string};

/** Menus only some accounts see, with the permission the sidebar requires for each. */
const RESPONSIBILITIES: [permission: string, label: string][] = [
    ["management.manage_accounts", "Bénévoles"],
    ["management.ticket_history", "Historique"],
    ["management.view_stats", "Statistiques"],
    ["recruitments.manage", "Recrutement"],
    ["roles.manage", "Rôles"],
    ["settings.manage", "Paramètres"],
    ["newsletters.manage", "Newsletter"],
];

export function tourSteps(permissions: string[], needsTwoFactor: boolean): TourStep[] {
    const can = (p: string) => permissions.includes("admin.sudo") || permissions.includes(p);
    const menus = RESPONSIBILITIES.filter(([permission]) => can(permission)).map(([, label]) => label);

    const steps: TourStep[] = [
        {
            title: "Bienvenue sur Solar",
            text: "Solar est l'application des bénévoles du Trèfle. Voici en quelques écrans où trouver l'essentiel. Le menu est à gauche ; sur téléphone, ouvrez-le avec le bouton en haut à gauche.",
        },
        {
            title: "Accueil",
            text: "Vous y retrouvez les prochaines permanences, les créneaux à renforcer et les annonces.",
        },
        {
            title: "Planning",
            text: "Inscrivez-vous aux permanences en cliquant sur l'une d'elles. Jusqu'au lundi 12h de la semaine, l'inscription est directe ; ensuite, c'est une demande qu'un référent valide.",
        },
        {
            title: "Discussions",
            text: "« Discussion BE libre » sert aux échanges entre bénévoles à tout moment, « Chat Permanence » à ceux de la permanence.",
        },
        {
            title: "Votre compte",
            text: "Dans les paramètres de votre compte, complétez votre profil et activez la double authentification pour mieux le protéger.",
        },
    ];
    if (menus.length) {
        steps.push({
            title: "Vos responsabilités",
            text: `Votre rôle vous donne aussi accès à : ${menus.join(", ")}.`,
        });
    }
    if (needsTwoFactor) {
        steps.push({
            title: "Activez la double authentification",
            text: "Votre rôle comporte des accès à responsabilités : ils restent suspendus tant que la double authentification n'est pas activée sur votre compte.",
        });
    }
    return steps;
}
