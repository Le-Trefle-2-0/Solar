import {config as loadEnv} from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import {
    ActivityType,
    ChannelType,
    Client,
    DiscordAPIError,
    Events,
    GatewayIntentBits,
    type Message,
    MessageFlags,
    Partials,
    PresenceUpdateStatus,
    RESTJSONErrorCodes,
} from 'discord.js';
import {io} from 'socket.io-client';
import {loadConfig} from './config.js';
import {createSolarApi} from './solar.js';
import {TicketRelay, type DiscordPort, type RoomsPort} from './relay.js';
import {PermanenceWatcher, type PermanenceView} from './permanence.js';
import {CLOSE_TICKET, dm, OPEN_TICKET, openingAnnouncement, openingMessage, replies} from './texts.js';

/**
 * Discord bot of Le Trèfle 2.0 (#291): people open and follow their écoute in private messages,
 * volunteers answer in Solar. Logs never contain Discord ids nor message contents.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({path: path.resolve(here, '../../../.env')});

// Without a Discord token (most development set-ups) the bot stays idle instead of stopping
// `npm run dev:all`, which ends every service as soon as one exits
if (!process.env.DISCORD_TOKEN?.trim()) {
    console.log('[bot] DISCORD_TOKEN is not set: Discord bot disabled');
    setInterval(() => undefined, 1 << 30);
    await new Promise(() => undefined);
}

const cfg = loadConfig();
const api = createSolarApi(cfg.apiBaseUrl, cfg.apiKey);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageTyping],
    // Private message channels are not cached before their first event
    partials: [Partials.Channel, Partials.Message],
});

// ---- Realtime service (Solar) ----
const socket = io(cfg.wsUrl, {auth: {token: cfg.apiKey}, transports: ['websocket'], reconnectionDelayMax: 30_000});

const rooms: RoomsPort = {
    listen: (channelId) => {
        if (socket.connected) socket.emit('listen', {id: channelId}, (ok: boolean) => {
            if (!ok) console.warn('[bot] the realtime service refused to follow an écoute');
        });
    },
    leave: (channelId) => {
        if (socket.connected) socket.emit('leave', {id: channelId});
    },
};

const UNREACHABLE = new Set<number>([RESTJSONErrorCodes.CannotSendMessagesToThisUser, RESTJSONErrorCodes.UnknownUser]);

const discord: DiscordPort = {
    async sendDm(userId, payload) {
        try {
            await client.users.send(userId, payload);
            return 'sent';
        } catch (e) {
            if (e instanceof DiscordAPIError && typeof e.code === 'number' && UNREACHABLE.has(e.code)) return 'unreachable';
            throw e;
        }
    },
    async typing(userId) {
        const channel = await client.users.createDM(userId);
        await channel.sendTyping();
    },
};

const relay = new TicketRelay(api, discord, rooms, cfg.links);

socket.on('connect', () => {
    socket.emit('bot:checkin');
    console.log('[bot] connected to the realtime service');
    relay.resync().catch(e => console.warn(`[bot] resync failed: ${(e as Error).message}`));
});
socket.on('connect_error', (e) => console.warn(`[bot] realtime service unreachable: ${e.message}`));
socket.on('disconnect', (reason) => console.warn(`[bot] disconnected from the realtime service (${reason})`));

socket.on('message', (m: {channel?: {id?: string}; author?: {id?: string}}) => {
    if (m?.channel?.id) void relay.onSolarMessage(m.channel.id, m.author?.id);
});
socket.on('ticketClosed', (e: {channelId?: string; closedBy?: string}) => {
    if (e?.channelId) void relay.onTicketClosed(e.channelId, e.closedBy);
});
socket.on('typingIndicator', (e: {id?: string; user?: {id?: string}}) => {
    if (e?.id) void relay.onVolunteerTyping(e.id, e.user?.id);
});
socket.on('voiceInvite', (e: {channelId?: string; url?: string; expiresAt?: number}) => {
    if (e?.channelId && e.url && e.expiresAt) {
        relay.onVoiceInvite(e.channelId, e.url, e.expiresAt).catch(err => console.warn(`[bot] voice invite not sent: ${(err as Error).message}`));
    }
});

// ---- Opening message and permanence ----
let opening: Message | null = null;

/** The opening channel's message: the configured one, else the bot's last one, else a new one. */
async function openingMessageRef(): Promise<Message> {
    if (opening) return opening;
    const channel = await client.channels.fetch(cfg.openingChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error('DISCORD_OPENING_CHANNEL_ID is not a text channel');
    const me = client.user!.id;
    if (cfg.openingMessageId) {
        const message = await channel.messages.fetch(cfg.openingMessageId).catch(() => null);
        if (message?.author.id === me) return (opening = message);
        // Only its author may edit a message: a message of another application is left as is
        console.warn('[bot] DISCORD_OPENING_MESSAGE_ID is not a message of this bot: using another one');
    }
    const recent = await channel.messages.fetch({limit: 20});
    const own = recent.find(m => m.author.id === me && m.embeds.length > 0);
    if (own) return (opening = own);
    opening = await channel.send({content: '…'});
    console.log(`[bot] opening message posted: set DISCORD_OPENING_MESSAGE_ID=${opening.id}`);
    return opening;
}

async function applyPermanence(view: PermanenceView, {opened}: {opened: boolean}) {
    const message = await openingMessageRef();
    await message.edit(openingMessage(view.open, view.next, cfg.links));

    client.user?.setPresence({
        status: view.open ? PresenceUpdateStatus.Online : PresenceUpdateStatus.DoNotDisturb,
        activities: [{name: view.open ? 'la permanence ouverte !' : 'la permanence fermée !', type: ActivityType.Watching}],
    });

    const guild = await client.guilds.fetch(cfg.guildId);
    if (cfg.voiceChannelId) {
        const voice = await guild.channels.fetch(cfg.voiceChannelId).catch(() => null);
        if (voice && 'permissionOverwrites' in voice) {
            await voice.permissionOverwrites.edit(guild.roles.everyone, {ViewChannel: view.open, Connect: view.open});
        }
    }
    if (opened && cfg.announceChannelId) {
        const announce = await guild.channels.fetch(cfg.announceChannelId).catch(() => null);
        if (announce?.isSendable()) await announce.send(openingAnnouncement(cfg.openingChannelId));
    }
}

const watcher = new PermanenceWatcher(api, applyPermanence);

// ---- Discord events ----
client.once(Events.ClientReady, (ready) => {
    console.log(`[bot] signed in to Discord as ${ready.user.tag}`);
    watcher.start();
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== OPEN_TICKET && interaction.customId !== CLOSE_TICKET) return;
    try {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        if (interaction.customId === OPEN_TICKET) {
            const outcome = await relay.open(interaction.user.id);
            const reply = outcome.kind === 'opened' ? replies.requestAccepted()
                : outcome.kind === 'already_open' ? replies.alreadyOpen()
                    : outcome.kind === 'permanence_closed' ? replies.permanenceClosed(outcome.nextOpening)
                        : replies.dmClosed();
            await interaction.editReply({embeds: [reply]});
            return;
        }
        // "Fermer l'écoute" under the welcome message
        if (!await relay.closeByUser(interaction.user.id)) {
            await interaction.editReply({embeds: [replies.noTicket()]});
            return;
        }
        await interaction.editReply({embeds: [replies.closed()]});
        await discord.sendDm(interaction.user.id, dm.closedByUser()).catch(() => undefined);
        // The button of a closed écoute no longer does anything
        await interaction.message.edit({components: []}).catch(() => undefined);
    } catch (e) {
        console.error(`[bot] button ${interaction.customId} failed: ${(e as Error).message}`);
        await interaction.editReply({embeds: [replies.unavailable()]}).catch(() => undefined);
    }
});

/** People writing outside an écoute get the welcome message, at most every 10 minutes. */
const welcomed = new Map<string, number>();

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.channel.type !== ChannelType.DM) return;
    try {
        const outcome = await relay.onUserMessage(message.author.id, {
            id: message.id,
            content: message.content,
            attachments: message.attachments.size + message.stickers.size,
        });
        if (outcome === 'unsupported') await message.reply(dm.unsupported());
        if (outcome === 'no_ticket') {
            const last = welcomed.get(message.author.id) ?? 0;
            if (Date.now() - last < 10 * 60_000) return;
            welcomed.set(message.author.id, Date.now());
            const view = watcher.view;
            await message.channel.send(dm.noTicket(!!view?.open, view?.next ?? null, cfg.links));
        }
    } catch (e) {
        console.error(`[bot] private message not relayed: ${(e as Error).message}`);
        await message.reply(dm.notDelivered()).catch(() => undefined);
    }
});

/** The user is typing: shown in Solar, at most every 5 seconds. */
const typingSent = new Map<string, number>();

client.on(Events.TypingStart, (typing) => {
    if (typing.user.bot || typing.channel.type !== ChannelType.DM) return;
    const channelId = relay.userTyping(typing.user.id);
    if (!channelId || !socket.connected) return;
    if (Date.now() - (typingSent.get(channelId) ?? 0) < 5_000) return;
    typingSent.set(channelId, Date.now());
    socket.emit('typing', {id: channelId});
});

// Safety net: anything missed (lost event, Discord hiccup) is caught up within a minute
const resyncTimer = setInterval(() => {
    if (socket.connected) relay.resync().catch(e => console.warn(`[bot] resync failed: ${(e as Error).message}`));
}, 60_000);

function shutdown() {
    console.log('[bot] stopping');
    clearInterval(resyncTimer);
    watcher.stop();
    socket.close();
    void client.destroy().finally(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (e) => console.error(`[bot] unhandled error: ${(e as Error)?.message ?? e}`));

await client.login(cfg.discordToken);
