/**
 * Settings of the bot. The token, server and Solar access come from the root .env (see README,
 * "Bot Discord"). The channels and the opening message are set in Solar (Administration >
 * Paramètres > Bot Discord); an empty field there uses the .env value (DISCORD_*_ID), the ids of
 * the former bot's settings.json.
 */

export interface DiscordChannels {
    /** Channel and message where "Ouvrir une écoute" is shown (former settings.ticketOpening). */
    openingChannelId: string | null;
    /** Edited, never reposted. Empty: the bot reuses its last message in the channel or posts one. */
    openingMessageId: string | null;
    /** Where the opening is announced (former toCloseMessageChannel). Optional. */
    announceChannelId: string | null;
    /** Voice channel shown to everyone only during permanences (former voiceTicketChannelID). Optional. */
    voiceChannelId: string | null;
    /** "Autre support d'écoute" channel mentioned in the texts. */
    helpChannelId: string | null;
}

export interface BotConfig extends Omit<DiscordChannels, 'helpChannelId'> {
    discordToken: string;
    guildId: string;
    links: {helpChannelId: string; siteUrl: string; inviteUrl: string};
    apiBaseUrl: string;
    wsUrl: string;
    apiKey: string;
}

/** "Autre support d'écoute" channel of the former bot's texts. */
export const DEFAULT_HELP_CHANNEL_ID = '718250345951658064';

const DISCORD_ID = /^\d{15,22}$/;
const id = (v: unknown) => (typeof v === 'string' && DISCORD_ID.test(v.trim()) ? v.trim() : null);

export function envChannels(env: NodeJS.ProcessEnv = process.env): DiscordChannels {
    return {
        openingChannelId: id(env.DISCORD_OPENING_CHANNEL_ID),
        openingMessageId: id(env.DISCORD_OPENING_MESSAGE_ID),
        announceChannelId: id(env.DISCORD_ANNOUNCE_CHANNEL_ID),
        voiceChannelId: id(env.DISCORD_VOICE_CHANNEL_ID),
        helpChannelId: id(env.DISCORD_HELP_CHANNEL_ID),
    };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
    const missing = ['DISCORD_TOKEN', 'DISCORD_GUILD_ID', 'SOLAR_BOT_API_KEY'].filter(name => !env[name]?.trim());
    if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    const guildId = id(env.DISCORD_GUILD_ID);
    if (!guildId) throw new Error('DISCORD_GUILD_ID must be a Discord id');

    let wsUrl = env.WS_INTERNAL_URL || env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    if (wsUrl.startsWith('ws://')) wsUrl = 'http://' + wsUrl.slice(5);
    if (wsUrl.startsWith('wss://')) wsUrl = 'https://' + wsUrl.slice(6);

    const {helpChannelId, ...channels} = envChannels(env);
    return {
        discordToken: env.DISCORD_TOKEN!.trim(),
        guildId,
        ...channels,
        links: {
            helpChannelId: helpChannelId ?? DEFAULT_HELP_CHANNEL_ID,
            siteUrl: env.BOT_SITE_URL || 'https://letrefle.org',
            inviteUrl: env.BOT_INVITE_URL || 'https://discord.gg/letrefle',
        },
        apiBaseUrl: (env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, ''),
        wsUrl,
        apiKey: env.SOLAR_BOT_API_KEY!.trim(),
    };
}

/**
 * Applies the channels set in Solar to `cfg` (in place: the relay keeps a reference to
 * `cfg.links`). Empty fields use the .env value. Returns what changed.
 */
export function applyChannels(cfg: BotConfig, fromSolar: Partial<Record<keyof DiscordChannels, unknown>> | null, fromEnv: DiscordChannels) {
    const pick = (field: keyof DiscordChannels) => id(fromSolar?.[field]) ?? fromEnv[field];
    const next = {
        openingChannelId: pick('openingChannelId'),
        openingMessageId: pick('openingMessageId'),
        announceChannelId: pick('announceChannelId'),
        voiceChannelId: pick('voiceChannelId'),
    };
    const helpChannelId = pick('helpChannelId') ?? DEFAULT_HELP_CHANNEL_ID;

    const changed = new Set<keyof DiscordChannels>();
    for (const [field, value] of Object.entries(next) as [keyof typeof next, string | null][]) {
        if (cfg[field] !== value) {
            changed.add(field);
            cfg[field] = value;
        }
    }
    if (cfg.links.helpChannelId !== helpChannelId) {
        changed.add('helpChannelId');
        cfg.links.helpChannelId = helpChannelId;
    }
    return changed;
}
