/**
 * Settings of the bot, from the root .env (see README, "Bot Discord"). The ids are those of the
 * former bot's settings.json, so the same channels and the same opening message are used.
 */

export interface BotConfig {
    discordToken: string;
    guildId: string;
    /** Channel and message where "Ouvrir une écoute" is shown (former settings.ticketOpening). */
    openingChannelId: string;
    /** Edited, never reposted. Empty: the bot reuses its last message in the channel or posts one. */
    openingMessageId: string | null;
    /** Where the opening is announced (former toCloseMessageChannel). Optional. */
    announceChannelId: string | null;
    /** Voice channel shown to everyone only during permanences (former voiceTicketChannelID). Optional. */
    voiceChannelId: string | null;
    links: {helpChannelId: string; siteUrl: string; inviteUrl: string};
    apiBaseUrl: string;
    wsUrl: string;
    apiKey: string;
}

const id = (v: string | undefined) => (v && /^\d{15,22}$/.test(v.trim()) ? v.trim() : null);

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
    const missing = ['DISCORD_TOKEN', 'DISCORD_GUILD_ID', 'DISCORD_OPENING_CHANNEL_ID', 'SOLAR_BOT_API_KEY']
        .filter(name => !env[name]?.trim());
    if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    const guildId = id(env.DISCORD_GUILD_ID);
    const openingChannelId = id(env.DISCORD_OPENING_CHANNEL_ID);
    if (!guildId || !openingChannelId) throw new Error('DISCORD_GUILD_ID and DISCORD_OPENING_CHANNEL_ID must be Discord ids');

    let wsUrl = env.WS_INTERNAL_URL || env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    if (wsUrl.startsWith('ws://')) wsUrl = 'http://' + wsUrl.slice(5);
    if (wsUrl.startsWith('wss://')) wsUrl = 'https://' + wsUrl.slice(6);

    return {
        discordToken: env.DISCORD_TOKEN!.trim(),
        guildId,
        openingChannelId,
        openingMessageId: id(env.DISCORD_OPENING_MESSAGE_ID),
        announceChannelId: id(env.DISCORD_ANNOUNCE_CHANNEL_ID),
        voiceChannelId: id(env.DISCORD_VOICE_CHANNEL_ID),
        links: {
            // "autre support d'écoute" channel of the former bot's texts
            helpChannelId: id(env.DISCORD_HELP_CHANNEL_ID) ?? '718250345951658064',
            siteUrl: env.BOT_SITE_URL || 'https://letrefle.org',
            inviteUrl: env.BOT_INVITE_URL || 'https://discord.gg/letrefle',
        },
        apiBaseUrl: (env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, ''),
        wsUrl,
        apiKey: env.SOLAR_BOT_API_KEY!.trim(),
    };
}
