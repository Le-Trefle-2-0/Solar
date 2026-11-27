import {
    ActivityType,
    ChannelType,
    Client,
    DiscordAPIError,
    Events,
    GatewayIntentBits,
    type Message,
    MessageFlags,
    type MessageReaction,
    type PartialMessageReaction,
    type PartialUser,
    type User,
    Partials,
    PresenceUpdateStatus,
    RESTJSONErrorCodes,
} from 'discord.js';
import {io} from 'socket.io-client';
import {applyChannels, envChannels, type BotConfig} from './config.js';
import {createSolarApi} from './solar.js';
import {TicketRelay, type DiscordPort, type RoomsPort} from './relay.js';
import {PermanenceWatcher, type PermanenceView} from './permanence.js';
import {CLOSE_TICKET, dm, OPEN_TICKET, openingAnnouncement, openingMessage, replies} from './texts.js';

/**
 * Discord bot of Le Trèfle 2.0 (#291): people open and follow their écoute in private messages,
 * volunteers answer in Solar. Logs never contain Discord ids nor message contents.
 */

/**
 * One run of the bot with one set of credentials. Returns how to stop it: the bot is stopped
 * and started again when its credentials change in Solar.
 */
export async function startBot(cfg: BotConfig): Promise<() => Promise<void>> {
    const api = createSolarApi(cfg.apiBaseUrl, cfg.apiKey);

    const client = new Client({
        // None of them is privileged
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.DirectMessageReactions,
        ],
        // Private message channels, their messages and reactions are not cached before their first event
        partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
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
                const message = await client.users.send(userId, payload);
                return {sent: message.id};
            } catch (e) {
                if (e instanceof DiscordAPIError && typeof e.code === 'number' && UNREACHABLE.has(e.code)) return 'unreachable';
                throw e;
            }
        },
        async typing(userId) {
            const channel = await client.users.createDM(userId);
            await channel.sendTyping();
        },
        async syncReactions(userId, messageId, emojis) {
            const channel = await client.users.createDM(userId);
            const message = await channel.messages.fetch(messageId);
            const wanted = new Set(emojis);
            const mine = new Set(message.reactions.cache.filter(r => r.me).map(r => r.emoji.name ?? ''));
            for (const emoji of wanted) {
                if (mine.has(emoji)) continue;
                // An emoji Discord does not know is skipped, the others still show
                await message.react(emoji).catch(e => console.warn(`[bot] reaction not shown on Discord: ${(e as Error).message}`));
            }
            for (const reaction of message.reactions.cache.values()) {
                if (reaction.me && !wanted.has(reaction.emoji.name ?? '')) await reaction.users.remove(client.user!.id);
            }
        },
    };

    const relay = new TicketRelay(api, discord, rooms, cfg.links);

    socket.on('connect', () => {
        socket.emit('bot:checkin');
        console.log('[bot] connected to the realtime service');
        // Settings changed while disconnected
        void loadChannels();
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
    // Volunteers' reactions: the bot's reactions on Discord follow them
    socket.on('reactionAdd', (e: {messageID?: number}) => void relay.onSolarReaction(e?.messageID));
    socket.on('reactionRemove', (e: {messageID?: number}) => void relay.onSolarReaction(e?.messageID));
    socket.on('voiceInvite',(e: {channelId?: string; url?: string; expiresAt?: number}) => {
        if (e?.channelId && e.url && e.expiresAt) {
            relay.onVoiceInvite(e.channelId, e.url, e.expiresAt).catch(err => console.warn(`[bot] voice invite not sent: ${(err as Error).message}`));
        }
    });

    // ---- Channels set in Solar ----
    const envIds = envChannels();
    let watching = false;
    /** "Publier un nouveau message" was chosen in Solar. */
    let publishRequested = false;

    /** Reads the channels set in Solar's settings page; applies them right away when they changed. */
    async function loadChannels() {
        try {
            const settings = await api.discordSettings();
            const changed = applyChannels(cfg, settings.channels, envIds);
            if (settings.publishOpeningMessage && !publishRequested) {
                publishRequested = true;
                changed.add('openingMessageId');
            }
            if (!changed.size) return;
            console.log(`[bot] Discord settings updated (${[...changed].join(', ')})`);
            if (changed.has('openingChannelId') || changed.has('openingMessageId')) opening = null;
            // Shows the opening message and presence again with the new settings
            if (watching) await watcher.tick(true);
        } catch (e) {
            console.warn(`[bot] Discord settings not read from Solar, keeping the current ones: ${(e as Error).message}`);
        }
    }

    socket.on('botSettings', () => void loadChannels());

    // ---- Opening message and permanence ----
    let opening: Message | null = null;

    /** The opening channel's message: the configured one, else the bot's last one, else a new one. */
    async function openingMessageRef(channelId: string): Promise<Message> {
        if (opening) return opening;
        const channel = await client.channels.fetch(channelId);
        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
            throw new Error('the opening channel is not a text channel');
        }
        const me = client.user!.id;
        if (publishRequested) {
            // A new message, which becomes the one Solar knows
            opening = await channel.send({content: '…'});
            await api.reportOpeningMessage(opening.id);
            cfg.openingMessageId = opening.id;
            publishRequested = false;
            console.log('[bot] new opening message posted');
            return opening;
        }
        if (cfg.openingMessageId) {
            const message = await channel.messages.fetch(cfg.openingMessageId).catch(() => null);
            if (message?.author.id === me) return (opening = message);
            // Only its author may edit a message: a message of another application is left as is
            console.warn('[bot] the opening message is not a message of this bot in that channel: using another one');
        }
        const recent = await channel.messages.fetch({limit: 20});
        const own = recent.find(m => m.author.id === me && m.embeds.length > 0);
        if (own) return (opening = own);
        opening = await channel.send({content: '…'});
        await api.reportOpeningMessage(opening.id).catch(() => undefined);
        console.log('[bot] opening message posted');
        return opening;
    }

    async function applyPermanence(view: PermanenceView, {opened}: {opened: boolean}) {
        if (cfg.openingChannelId) {
            const message = await openingMessageRef(cfg.openingChannelId);
            await message.edit(openingMessage(view.open, view.next, cfg.links));
        } else {
            console.warn('[bot] no opening channel: set it in Solar, Paramètres > Bot Discord');
        }

        client.user?.setPresence({
            status: view.open ? PresenceUpdateStatus.Online : PresenceUpdateStatus.DoNotDisturb,
            activities: [{name: view.open ? 'la permanence ouverte !' : 'la permanence fermée !', type: ActivityType.Watching}],
        });

        // Voice calls happen in Solar (link sent in private messages): no Discord voice channel to open
        if (opened && cfg.announceChannelId && cfg.openingChannelId) {
            const guild = await client.guilds.fetch(cfg.guildId);
            const announce = await guild.channels.fetch(cfg.announceChannelId).catch(() => null);
            if (announce?.isSendable()) await announce.send(openingAnnouncement(cfg.openingChannelId));
        }
    }

    const watcher = new PermanenceWatcher(api, applyPermanence);

    // ---- Discord events ----
    client.once(Events.ClientReady, (ready) => {
        console.log(`[bot] signed in to Discord as ${ready.user.tag}`);
        void loadChannels().finally(() => {
            watching = true;
            watcher.start();
        });
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
                // Discord "Répondre": shown as a reply in Solar
                replyTo: message.reference?.messageId ?? null,
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

    /** The user's reactions in their private messages, shown in Solar. Server emojis do not exist there. */
    async function onDiscordReaction(
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
        added: boolean,
    ) {
        if (user.bot) return;
        try {
            const full = reaction.partial ? await reaction.fetch() : reaction;
            if (full.message.channel.type !== ChannelType.DM || full.emoji.id || !full.emoji.name) return;
            await relay.onUserReaction(user.id, full.message.id, full.emoji.name, added);
        } catch (e) {
            console.warn(`[bot] reaction not relayed: ${(e as Error).message}`);
        }
    }

    client.on(Events.MessageReactionAdd, (reaction, user) => void onDiscordReaction(reaction, user, true));
    client.on(Events.MessageReactionRemove, (reaction, user) => void onDiscordReaction(reaction, user, false));

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

    async function stop() {
        clearInterval(resyncTimer);
        watcher.stop();
        socket.close();
        await client.destroy();
    }

    try {
        await client.login(cfg.discordToken);
    } catch (e) {
        await stop();
        throw e;
    }
    return stop;
}
