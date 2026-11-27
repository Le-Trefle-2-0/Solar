import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {authenticate} from '../../auth.js';
import {getActor, hasPermission} from '../../lib/permissions.js';
import {broadcast} from '../../lib/broadcast.js';
import {isInternal} from '../../lib/internalAuth.js';
import {
    discordBotSettingsSchema,
    emptyDiscordBotSettings,
    envDiscordBotSettings,
    isOpeningPublishRequested,
    readDiscordBotSettings,
    requestOpeningPublish,
    writeDiscordBotSettings,
} from '../../lib/discordBotSettings.js';
import {
    ensureBotAccount,
    findBotAccount,
    currentBotKey,
    latestBotKey,
    readSetup,
    rotateBotKey,
    saveGuild,
    saveToken,
} from '../../lib/discordBotCredentials.js';
import {
    discordClient,
    DiscordSetupError,
    identify,
    inviteUrl,
    listBotMessages,
    listChannels,
    listGuilds,
    looksLikeToken,
} from '../../lib/discordSetup.js';

/**
 * Set-up of the Discord bot from Solar (Administration > Paramètres > Bot Discord), in steps:
 * Solar account and API key (automatic), Discord token, server, channels and opening message.
 * Bot management is technical configuration: settings.manage.
 */

async function checkAdmin(req: FastifyRequest, reply: FastifyReply) {
    const userId = await authenticate(req);
    const actor = userId ? await getActor(userId) : null;
    if (!actor) {
        reply.status(401).send('unauthorized');
        return null;
    }
    if (!hasPermission(actor.permissions, 'settings.manage')) {
        reply.status(403).send('forbidden: settings.manage required');
        return null;
    }
    return actor;
}

function wsBase() {
    let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
    if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);
    return base;
}

/** Whether the bot is connected to the realtime service right now. */
async function isBotConnected(botUserId: string): Promise<boolean> {
    try {
        // The WebSocket service only answers internal callers (#216)
        const res = await fetch(`${wsBase()}/bot-status?userId=${encodeURIComponent(botUserId)}`, {
            headers: {Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`},
            signal: AbortSignal.timeout(3_000),
        });
        return !!(await res.json() as {isConnected?: boolean}).isConnected;
    } catch {
        return false;
    }
}

function sendDiscordError(reply: FastifyReply, e: unknown) {
    if (!(e instanceof DiscordSetupError)) throw e;
    const status = {invalid_token: 400, forbidden: 403, not_found: 404, unavailable: 502}[e.code];
    return reply.status(status).send({error: e.code, message: e.message});
}

/** The set-up's Discord side, or an answer explaining what step is missing. */
async function requireDiscord(reply: FastifyReply, {needGuild}: {needGuild: boolean}) {
    const {stored, unreadable} = await readSetup();
    if (!stored) {
        reply.status(409).send({error: unreadable ? 'token_unreadable' : 'no_token', message: 'Indiquez d\'abord le jeton du bot'});
        return null;
    }
    if (needGuild && !stored.guildId) {
        reply.status(409).send({error: 'no_guild', message: 'Choisissez d\'abord le serveur'});
        return null;
    }
    return {stored, get: discordClient(stored.token)};
}

const DISCORD_ID = /^\d{15,22}$/;

export async function registerBotRoutes(app: FastifyInstance) {
    // Where the set-up stands
    app.get('/v1/bot/setup', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const bot = await findBotAccount();
        const key = bot ? await latestBotKey(bot.id) : null;
        const {stored, unreadable} = await readSetup();
        return reply.send({
            account: {exists: !!bot, hasKey: !!key},
            connected: bot ? await isBotConnected(bot.id) : false,
            discord: stored
                ? {
                    source: 'solar',
                    applicationId: stored.applicationId,
                    botName: stored.botName,
                    botAvatar: stored.botAvatar,
                    guildId: stored.guildId,
                    guildName: stored.guildName,
                    inviteUrl: inviteUrl(stored.applicationId, stored.guildId),
                }
                : unreadable ? {source: 'unreadable'}
                    : process.env.DISCORD_TOKEN?.trim() ? {source: 'env'} : null,
            channels: await readDiscordBotSettings(),
            publishOpeningMessage: await isOpeningPublishRequested(),
        });
    });

    // Step 1: the bot's Solar account and API key, created when missing (the key is never shown)
    app.post('/v1/bot/setup/account', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        await ensureBotAccount();
        return reply.send({success: true});
    });

    app.post('/v1/bot/setup/rotate-key', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        await rotateBotKey();
        // Connections with the former key are closed; the bot fetches the new one by itself
        await broadcast(null, 'permissionsUpdate', {reason: 'bot_key'});
        return reply.send({success: true});
    });

    // Step 2: the Discord token, checked with Discord before being stored (encrypted)
    app.post('/v1/bot/setup/token', {bodyLimit: 4 * 1024}, async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const token = String((req.body as {token?: unknown} | undefined)?.token ?? '').trim().replace(/^Bot\s+/i, '');
        if (!looksLikeToken(token)) {
            return reply.status(400).send({error: 'invalid_token', message: 'Ce n\'est pas un jeton de bot Discord : copiez-le depuis l\'onglet Bot du portail développeurs'});
        }
        try {
            const get = discordClient(token);
            const identity = await identify(get);
            const guilds = await listGuilds(get);
            // Same bot again (new token): keep its server if it is still there
            const {stored} = await readSetup();
            const kept = stored?.guildId && stored.applicationId === identity.applicationId
                ? guilds.find(g => g.id === stored.guildId) : undefined;
            await saveToken(token, identity, kept ? {guildId: kept.id, guildName: kept.name} : null);
            return reply.send({
                botName: identity.botName,
                botAvatar: identity.botAvatar,
                guildId: kept?.id ?? null,
                guilds,
                inviteUrl: inviteUrl(identity.applicationId),
            });
        } catch (e) {
            return sendDiscordError(reply, e);
        }
    });

    // Step 3: the servers the bot is on, and the link to add it to one
    app.get('/v1/bot/setup/guilds', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const discord = await requireDiscord(reply, {needGuild: false});
        if (!discord) return;
        try {
            return reply.send({guilds: await listGuilds(discord.get), inviteUrl: inviteUrl(discord.stored.applicationId)});
        } catch (e) {
            return sendDiscordError(reply, e);
        }
    });

    app.post('/v1/bot/setup/guild', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const guildId = String((req.body as {guildId?: unknown} | undefined)?.guildId ?? '');
        const discord = await requireDiscord(reply, {needGuild: false});
        if (!discord) return;
        try {
            const guild = (await listGuilds(discord.get)).find(g => g.id === guildId);
            if (!guild) return reply.status(404).send({error: 'not_found', message: 'Le bot n\'est pas sur ce serveur'});
            if (guild.id !== discord.stored.guildId) {
                await saveGuild(guild.id, guild.name);
                // Channels of the former server mean nothing on this one
                if (discord.stored.guildId) {
                    await writeDiscordBotSettings(emptyDiscordBotSettings());
                    await requestOpeningPublish(false);
                }
            }
            return reply.send({guildId: guild.id, guildName: guild.name});
        } catch (e) {
            return sendDiscordError(reply, e);
        }
    });

    // Step 4: channels to choose from, and the bot's messages in the opening channel
    app.get('/v1/bot/setup/channels', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const discord = await requireDiscord(reply, {needGuild: true});
        if (!discord) return;
        try {
            return reply.send(await listChannels(discord.get, discord.stored.guildId!));
        } catch (e) {
            return sendDiscordError(reply, e);
        }
    });

    app.get('/v1/bot/setup/messages', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const channelId = String((req.query as {channelId?: unknown}).channelId ?? '');
        if (!DISCORD_ID.test(channelId)) return reply.status(400).send({error: 'invalid_channel'});
        const discord = await requireDiscord(reply, {needGuild: true});
        if (!discord) return;
        try {
            // Only channels of the chosen server
            const {text} = await listChannels(discord.get, discord.stored.guildId!);
            if (!text.some(c => c.id === channelId)) return reply.status(404).send({error: 'not_found', message: 'Salon introuvable sur ce serveur'});
            const names = new Map(text.map(c => [c.id, c.name]));
            return reply.send({messages: await listBotMessages(discord.get, channelId, discord.stored.botUserId, names)});
        } catch (e) {
            return sendDiscordError(reply, e);
        }
    });

    // Channels and message of the bot; an empty field uses the .env value (`fallback`)
    app.get('/v1/bot/discord-settings', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        return reply.send({settings: await readDiscordBotSettings(), fallback: envDiscordBotSettings()});
    });

    app.put('/v1/bot/discord-settings', async (req, reply) => {
        if (!await checkAdmin(req, reply)) return;
        const {publishOpeningMessage, ...body} = (req.body ?? {}) as Record<string, unknown>;
        const parsed = discordBotSettingsSchema.safeParse(body);
        if (!parsed.success) {
            return reply.status(400).send({error: 'invalid_ids', fields: parsed.error.issues.map(i => i.path[0])});
        }
        const settings = {...emptyDiscordBotSettings(), ...parsed.data};
        const publish = publishOpeningMessage === true;
        if (publish) settings.openingMessageId = null;

        // Set up from Solar: the channels must be those of the chosen server, of the right kind
        const {stored} = await readSetup();
        if (stored?.guildId) {
            try {
                const {text} = await listChannels(discordClient(stored.token), stored.guildId);
                const isText = (id: string | null) => !id || text.some(c => c.id === id);
                const wrong = [
                    !isText(settings.openingChannelId) && 'openingChannelId',
                    !isText(settings.announceChannelId) && 'announceChannelId',
                    !isText(settings.helpChannelId) && 'helpChannelId',                ].filter(Boolean);
                if (wrong.length) return reply.status(400).send({error: 'unknown_channels', fields: wrong});
            } catch (e) {
                return sendDiscordError(reply, e);
            }
        }

        await writeDiscordBotSettings(settings);
        await requestOpeningPublish(publish && !!settings.openingChannelId);
        // The bot applies them right away (it also reads them again when it reconnects)
        await broadcast(null, 'botSettings', {updatedAt: Date.now()}, {audience: 'bots'});
        return reply.send({settings, fallback: envDiscordBotSettings(), publishOpeningMessage: publish});
    });

    // For the bot process (Authorization: Bearer INTERNAL_API_SECRET): what it needs to start,
    // so its .env only needs the addresses of the API and of the realtime service
    app.get('/v1/internal/bot/credentials', async (req, reply) => {
        if (!isInternal(req)) return reply.status(401).send({error: 'unauthorized'});
        const bot = await findBotAccount();
        const key = bot ? await currentBotKey(bot.id) : null;
        const {stored} = await readSetup();
        const missing = [!key && 'solar_account', !stored && 'discord_token', !stored?.guildId && 'discord_guild'].filter(Boolean);
        if (missing.length) return reply.status(404).send({error: 'not_configured', missing});
        return reply.send({discordToken: stored!.token, guildId: stored!.guildId, solarApiKey: key});
    });
}
