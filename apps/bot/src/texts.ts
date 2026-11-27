import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type MessageCreateOptions} from 'discord.js';

/**
 * Everything the bot shows on Discord. Texts, colours, images and button ids are those of the
 * former bot (Letrefle-bot), so nothing changes for the people who come to talk; only typos and
 * the date display were fixed.
 */

export const COLOR = 0x9bd2d2;
export const COLOR_ERROR = 0xcc0000;
export const COLOR_WARNING = 0xd36515;

/** Button ids kept from the former bot: existing messages keep working. */
export const OPEN_TICKET = 'OpenTicket';
export const CLOSE_TICKET = 'CloseTicket';

const AVATAR = 'https://cdn.discordapp.com/attachments/757897064754708560/883734125985529866/default-profile-picture-clipart-3.jpg';
const WELCOME_THUMBNAIL = 'https://i.imgur.com/haHDKhq.png';
const OPENING_ANNOUNCEMENT_IMAGE = 'https://i.imgur.com/1ApEpoi.png';

export type Links = {helpChannelId: string; siteUrl: string; inviteUrl: string};
export type NextOpening = {start: string; end: string} | null;

const unix = (iso: string) => Math.round(new Date(iso).getTime() / 1000);
const embed = (description: string, color = COLOR) => new EmbedBuilder().setColor(color).setDescription(description);

export const openTicketButton = (disabled = false) => new ButtonBuilder()
    .setCustomId(OPEN_TICKET)
    .setLabel('Ouvrir une écoute')
    .setEmoji('👋')
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);

export const closeTicketRow = () => new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
        .setCustomId(CLOSE_TICKET)
        .setLabel('Fermer l\'écoute')
        .setEmoji('⚠️')
        .setStyle(ButtonStyle.Danger),
);

/** When the next permanence starts, as Discord shows it in each person's time zone. */
export function nextOpeningText(next: NextOpening): string {
    if (!next) return 'La prochaine permanence n\'est pas encore programmée.';
    return `La prochaine permanence aura lieu <t:${unix(next.start)}:F> (<t:${unix(next.start)}:R>).`;
}

/** The message of the opening channel, edited (never reposted) when the permanence opens or closes. */
export function openingMessage(open: boolean, next: NextOpening, links: Links) {
    if (open) {
        return {
            content: null,
            embeds: [embed('🔓 | La permanence est actuellement ouverte ! Ouvre un salon d\'écoute avec le bouton ci-dessous.')],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(openTicketButton())],
        };
    }
    return {
        content: null,
        embeds: [embed(`🔒 | La permanence est actuellement fermée ! ${nextOpeningText(next)}\n\nEn cas de souci urgent, n'hésite pas à te rendre dans <#${links.helpChannelId}>`)],
        components: [],
    };
}

/** Posted in the announcement channel when a permanence opens. */
export const openingAnnouncement = (openingChannelId: string): MessageCreateOptions => ({
    embeds: [new EmbedBuilder().setColor(COLOR).setDescription(`<#${openingChannelId}>`).setImage(OPENING_ANNOUNCEMENT_IMAGE)],
});

/** First private message of an écoute. */
export const welcome = (reference: string, links: Links): MessageCreateOptions => ({
    embeds: [
        new EmbedBuilder()
            .setColor(COLOR)
            .setThumbnail(WELCOME_THUMBNAIL)
            .setDescription('👋 | Bonsoir et bienvenue sur Le Trèfle 2.0\nTa demande d\'écoute a bien été prise en compte. Un bénévole écoutant te répondra sous 20 minutes, passé ce délai, nous t\'invitons à contacter un autre support d\'écoute disponible dans <#' + links.helpChannelId + '>.')
            .setFooter({text: `Pour toute réclamation, veuillez fournir l'identifiant unique : ${reference}, correspondant à votre écoute.`}),
    ],
    components: [closeTicketRow()],
});

/** Sent when other écoutes are already waiting for a volunteer. */
export const busy = (): MessageCreateOptions => ({
    embeds: [embed('Bonsoir,\n\nEn raison d\'une forte affluence, l\'ensemble des bénévoles écoutants sont en écoute. En ce sens il y a de l\'attente. Dès qu\'un bénévole est disponible il prendra en charge ta demande.\n\nMerci pour ta compréhension 🙏', COLOR_WARNING)],
});

/** A volunteer's message, without anything that identifies them. */
export const volunteerMessage = (content: string, reference: string, timestamp: number): MessageCreateOptions => ({
    embeds: [
        new EmbedBuilder()
            .setColor(COLOR)
            .setAuthor({name: 'Bénévole écoutant', iconURL: AVATAR})
            .setDescription(content)
            .setFooter({text: `Écoute ID : ${reference}`})
            .setTimestamp(timestamp),
    ],
});

/** Replies to the person who clicked a button (only they see them). */
export const replies = {
    requestAccepted: () => embed('✅ | Votre demande d\'écoute a bien été prise en compte, veuillez continuer par messages privés.'),
    alreadyOpen: () => embed('❌ | Il semblerait que vous ayez déjà un salon d\'écoute ouvert ! Veuillez le fermer avant d\'en ouvrir un nouveau.', COLOR_ERROR),
    permanenceClosed: (next: NextOpening) => embed(`🔒 | La permanence est actuellement fermée. ${nextOpeningText(next)}`, COLOR_ERROR),
    closed: () => embed('✅ | L\'écoute a bien été fermée !'),
    noTicket: () => embed('❌ | Vous n\'avez pas d\'écoute en cours.', COLOR_ERROR),
    unavailable: () => embed('⚠️ | Le service est momentanément indisponible. Merci de réessayer dans quelques instants.', COLOR_ERROR),
    dmClosed: () => embed(
        '⚠️ | Il semblerait que vos messages privés soient fermés.\n'
        + '⚠️ | Pour les ouvrir uniquement sur le serveur veuillez suivre la procédure :\n\n'
        + '> 🖥️ | Sur ordinateur : faites un clic droit sur le serveur dans la liste, puis rendez-vous dans les Paramètres de confidentialité, et autorisez les messages privés des membres du serveur\n\n'
        + '> 📱 | Sur mobile : affichez la liste des salons, puis tout en haut appuyez sur le nom du serveur, et dans le menu activez l\'option Autoriser les messages privés',
        COLOR_ERROR,
    ).setFooter({text: 'Si le problème persiste, merci de contacter un membre de l\'association.'}),
};

/** Private messages outside an écoute. */
export const dm = {
    closedByUser: () => ({embeds: [embed('🍀 | Votre salon d\'écoute a été fermé. En cas de besoin, n\'hésitez pas à en réouvrir un !')]}),
    closedByVolunteer: () => ({embeds: [embed('🍀 | Votre salon d\'écoute a été fermé par le bénévole écoutant. En cas de besoin, n\'hésitez pas à en réouvrir un !')]}),
    unsupported: () => ({embeds: [embed('Ce type de message n\'est pas supporté, merci d\'envoyer un message texte.', COLOR_ERROR)]}),
    notDelivered: () => ({embeds: [embed('⚠️ | Votre message n\'a pas pu être transmis. Merci de le renvoyer dans quelques instants.', COLOR_ERROR)]}),
    /** Someone writes to the bot without an écoute in progress. */
    noTicket: (open: boolean, next: NextOpening, links: Links): MessageCreateOptions => ({
        embeds: [
            new EmbedBuilder()
                .setColor(COLOR)
                .setDescription(open
                    ? 'Bienvenue sur Le Trèfle 2.0 !\n\nVous pouvez dès maintenant ouvrir une écoute à l\'aide du bouton ci-dessous.'
                    : `Bienvenue sur Le Trèfle 2.0 !\n\n🔒 | La permanence est actuellement fermée. ${nextOpeningText(next)}\n\nEn cas de souci urgent, n'hésite pas à te rendre dans <#${links.helpChannelId}>`),
        ],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
            openTicketButton(!open),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(links.siteUrl).setLabel('Consulter notre site'),
            new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(links.inviteUrl).setLabel('Rejoindre notre serveur discord'),
        )],
    }),
    /** The volunteer moved the écoute to a voice call (link to the Solar voice page). */
    voiceInvite: (url: string, expiresAt: number): MessageCreateOptions => ({
        embeds: [embed(`📞 | Le bénévole écoutant te propose de poursuivre l'écoute en vocal. Le lien est valable jusqu'à <t:${Math.round(expiresAt / 1000)}:t>.`)],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel('Rejoindre l\'appel').setEmoji('🎧'),
        )],
    }),
};
