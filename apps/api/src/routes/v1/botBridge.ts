import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {isBotAccount} from '../../lib/accountStanding.js';
import {broadcast} from '../../lib/broadcast.js';
import {neutralizeHtml} from '../../lib/sanitize.js';
import {getPermanenceStatus, type PermanenceStatus} from '../../lib/permanenceStatus.js';
import {closeTicket} from '../../lib/ticketClosing.js';
import {
    isOpeningPublishRequested,
    openingMessagePublished,
    readDiscordBotSettings,
    type DiscordBotSettings,
} from '../../lib/discordBotSettings.js';

/**
 * What the Discord bot (apps/bot) exchanges with Solar (#293). Only the bot account (API key of
 * a `bot_` user holding tickets.open) may call these routes.
 *
 * The bot keeps no database: open écoutes and the Discord user behind each of them are read
 * here, so it picks up where it left off after a restart. The Discord id stays in clear only
 * while the écoute is open (it is pseudonymised on closing). Volunteers' messages are delivered
 * at least once: the bot asks for those not delivered yet and marks each one once sent.
 */

const OPEN = ['waiting', 'started'];
const DISCORD_ID = /^\d{15,22}$/;

export type BotTicket = {ticketId: number; channelId: string; discordUserId: string; createdAt: Date};

export interface BotBridgeDeps {
    authenticate: (req: FastifyRequest) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    permanence: () => Promise<PermanenceStatus>;
    /** Channels and message set in Solar's settings page (null: the bot's .env value). */
    discordSettings: () => Promise<DiscordBotSettings>;
    /** "Publier un nouveau message" was chosen in the set-up. */
    publishRequested: () => Promise<boolean>;
    /** The bot posted that message: it becomes the opening message. */
    openingMessagePublished: (messageId: string) => Promise<void>;
    /** Open écoutes that came from Discord. */
    activeTickets: () => Promise<BotTicket[]>;
    findOpenTicketByChannel: (channelId: string) => Promise<BotTicket | null>;
    findOpenTicketByUser: (discordUserId: string) => Promise<BotTicket | null>;
    createTicket: (discordUserId: string) => Promise<BotTicket>;
    /** Other écoutes waiting for a volunteer. */
    countWaiting: (exceptTicketId: number) => Promise<number>;
    /** Stores the user's message once per Discord message; returns null if already stored. */
    saveUserMessage: (ticket: BotTicket, discordMessageId: string, content: string) => Promise<{id: number; createdAt: Date} | null>;
    pendingMessages: (ticket: BotTicket) => Promise<{id: number; content: string; createdAt: Date}[]>;
    findMessage: (id: number) => Promise<{id: number; channelId: string; userId: string | null} | null>;
    markRelayed: (id: number, failed: boolean) => Promise<void>;
    close: (ticket: BotTicket) => Promise<void>;
    /** Deletes an écoute nobody wrote in (the user's private messages were closed). False if it has messages. */
    withdraw: (ticket: BotTicket) => Promise<boolean>;
    notify: (room: string | null, event: string, data: unknown) => Promise<void>;
}

const toBotTicket = (t: {id: number; channelId: string | null; discordUserID: string; createdAt: Date}): BotTicket =>
    ({ticketId: t.id, channelId: t.channelId!, discordUserId: t.discordUserID, createdAt: t.createdAt});

const openDiscordTicket = {source: 'discord', statusName: {in: OPEN}, channelId: {not: null}} as const;

const defaultDeps: BotBridgeDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    permanence: () => getPermanenceStatus(),
    discordSettings: readDiscordBotSettings,
    publishRequested: isOpeningPublishRequested,
    openingMessagePublished,
    activeTickets: async () => (await prisma.ticket.findMany({where: openDiscordTicket, orderBy: {id: 'asc'}})).map(toBotTicket),
    findOpenTicketByChannel: async (channelId) => {
        const t = await prisma.ticket.findFirst({where: {...openDiscordTicket, channelId}});
        return t ? toBotTicket(t) : null;
    },
    findOpenTicketByUser: async (discordUserId) => {
        const t = await prisma.ticket.findFirst({where: {...openDiscordTicket, discordUserID: discordUserId}});
        return t ? toBotTicket(t) : null;
    },
    createTicket: async (discordUserId) => {
        const status = await prisma.ticketStatus.findUnique({where: {name: 'waiting'}});
        if (!status) throw new Error('status_missing');
        return prisma.$transaction(async (tx) => {
            const now = new Date();
            const ticket = await tx.ticket.create({
                data: {
                    discordUserID: discordUserId, source: 'discord', metadata: {}, createdAt: now, updatedAt: now,
                    statusName: status.name, statusLabel: status.label,
                },
            });
            const channel = await tx.channel.create({data: {name: `Ticket-${String(ticket.id).padStart(5, '0')}`}});
            const updated = await tx.ticket.update({
                where: {id: ticket.id},
                data: {channelId: channel.id, channelName: channel.name, updatedAt: now},
            });
            return toBotTicket(updated);
        });
    },
    countWaiting: (exceptTicketId) => prisma.ticket.count({where: {statusName: 'waiting', id: {not: exceptTicketId}}}),
    saveUserMessage: async (ticket, discordMessageId, content) => {
        // Same Discord message sent twice (bot restart, retry): stored once (#297)
        const existing = await prisma.message.findFirst({where: {channelId: ticket.channelId, discordID: discordMessageId}, select: {id: true}});
        if (existing) return null;
        return prisma.message.create({
            data: {
                userId: null, channelId: ticket.channelId, ticketId: ticket.ticketId,
                content: Buffer.from(content, 'utf8'), discordID: discordMessageId, createdAt: new Date(),
            },
            select: {id: true, createdAt: true},
        });
    },
    pendingMessages: async (ticket) => {
        const rows = await prisma.message.findMany({
            where: {
                channelId: ticket.channelId, userId: {not: null}, relayedAt: null, relayFailed: false,
                createdAt: {gte: ticket.createdAt},
            },
            orderBy: {id: 'asc'},
            take: 50,
            select: {id: true, content: true, createdAt: true},
        });
        return rows.map(r => ({id: r.id, createdAt: r.createdAt, content: Buffer.from(r.content).toString('utf8')}));
    },
    findMessage: (id) => prisma.message.findUnique({where: {id}, select: {id: true, channelId: true, userId: true}}),
    markRelayed: async (id, failed) => {
        await prisma.message.update({where: {id}, data: failed ? {relayFailed: true} : {relayedAt: new Date()}});
    },
    close: async (ticket) => {
        const row = await prisma.ticket.findUnique({where: {id: ticket.ticketId}});
        if (row) await closeTicket(row, 'user');
    },
    withdraw: async (ticket) => {
        if (await prisma.message.count({where: {channelId: ticket.channelId}})) return false;
        await prisma.$transaction([
            prisma.ticket.delete({where: {id: ticket.ticketId}}),
            prisma.channel.delete({where: {id: ticket.channelId}}),
        ]);
        return true;
    },
    notify: (room, event, data) => broadcast(room, event, data),
};

export async function registerBotBridgeRoutes(app: FastifyInstance, deps: BotBridgeDeps = defaultDeps) {
    /** Only the bot account, with its API key. */
    async function requireBot(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
        const userId = await deps.authenticate(req);
        if (!userId) {
            reply.status(401).send({error: 'unauthorized'});
            return false;
        }
        if (!isBotAccount(userId) || !hasPermission(await deps.getPermissions(userId), 'tickets.open')) {
            reply.status(403).send({error: 'forbidden'});
            return false;
        }
        return true;
    }

    const publicTicket = (t: BotTicket) => ({ticketId: t.ticketId, channelId: t.channelId, reference: String(t.ticketId).padStart(5, '0')});

    async function openTicketOf(req: FastifyRequest, reply: FastifyReply) {
        const {channelId} = req.params as {channelId: string};
        const ticket = typeof channelId === 'string' && channelId.length <= 64 ? await deps.findOpenTicketByChannel(channelId) : null;
        if (!ticket) reply.status(404).send({error: 'ticket_closed'});
        return ticket;
    }

    app.get('/v1/bot/permanence', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        return reply.send(await deps.permanence());
    });

    app.get('/v1/bot/settings', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        return reply.send({discord: await deps.discordSettings(), publishOpeningMessage: await deps.publishRequested()});
    });

    app.post('/v1/bot/settings/opening-message', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const messageId = (req.body as {messageId?: unknown} | undefined)?.messageId;
        if (typeof messageId !== 'string' || !DISCORD_ID.test(messageId)) return reply.status(400).send({error: 'invalid_body'});
        await deps.openingMessagePublished(messageId);
        return reply.send({success: true});
    });

    app.get('/v1/bot/tickets/active', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const tickets = await deps.activeTickets();
        return reply.send({tickets: tickets.map(t => ({...publicTicket(t), discordUserId: t.discordUserId}))});
    });

    // Opening an écoute from Discord (#296, #300): one per person, only during a permanence
    app.post('/v1/bot/tickets', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const parsed = z.object({discordUserId: z.string().regex(DISCORD_ID)}).safeParse(req.body ?? {});
        if (!parsed.success) return reply.status(400).send({error: 'invalid_body'});
        const {discordUserId} = parsed.data;

        const existing = await deps.findOpenTicketByUser(discordUserId);
        if (existing) return reply.status(409).send({error: 'already_open', ticket: publicTicket(existing)});

        const permanence = await deps.permanence();
        if (!permanence.open) return reply.status(403).send({error: 'permanence_closed', nextOpening: permanence.nextOpening});

        const ticket = await deps.createTicket(discordUserId);
        await deps.notify(null, 'updateRequest', {channelId: ticket.channelId});
        return reply.status(201).send({ticket: publicTicket(ticket), waitingAhead: await deps.countWaiting(ticket.ticketId)});
    });

    // The user's message, from their DMs to the écoute (#297)
    app.post('/v1/bot/tickets/:channelId/messages', {bodyLimit: 16 * 1024}, async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const parsed = z.object({
            discordMessageId: z.string().regex(DISCORD_ID),
            content: z.string().trim().min(1).max(2000),
        }).safeParse(req.body ?? {});
        if (!parsed.success) return reply.status(400).send({error: 'invalid_body'});
        const ticket = await openTicketOf(req, reply);
        if (!ticket) return;

        const content = neutralizeHtml(parsed.data.content);
        const saved = await deps.saveUserMessage(ticket, parsed.data.discordMessageId, content);
        if (!saved) return reply.send({duplicate: true});
        // Same shape as the widget's visitor messages
        await deps.notify(ticket.channelId, 'message', {
            id: saved.id,
            author: {id: 'guest', image: null, name: 'Utilisateur', role: null},
            content,
            timestamp: saved.createdAt.getTime(),
            channel: {id: ticket.channelId},
            reactions: [],
        });
        return reply.status(201).send({id: saved.id});
    });

    // Volunteers' messages not delivered yet, oldest first (#298)
    app.get('/v1/bot/tickets/:channelId/pending', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const ticket = await openTicketOf(req, reply);
        if (!ticket) return;
        const messages = await deps.pendingMessages(ticket);
        return reply.send({messages: messages.map(m => ({id: m.id, content: m.content, timestamp: m.createdAt.getTime()}))});
    });

    for (const [suffix, failed] of [['relayed', false], ['undelivered', true]] as const) {
        app.post(`/v1/bot/messages/:id/${suffix}`, async (req, reply) => {
            if (!await requireBot(req, reply)) return;
            const id = Number((req.params as {id: string}).id);
            const message = Number.isInteger(id) && id > 0 ? await deps.findMessage(id) : null;
            // Only volunteers' messages of an écoute still open on Discord
            if (!message || !message.userId || !(await deps.findOpenTicketByChannel(message.channelId))) {
                return reply.status(404).send({error: 'not_found'});
            }
            await deps.markRelayed(id, failed);
            // Shown in Solar next to the message (#298)
            if (failed) await deps.notify(message.channelId, 'messageUndelivered', {id, channelId: message.channelId});
            return reply.send({success: true});
        });
    }

    // The user closed the écoute from Discord (#299). `withdraw`: the écoute could not start
    // (private messages closed) and is removed if nobody wrote in it.
    app.post('/v1/bot/tickets/:channelId/close', async (req, reply) => {
        if (!await requireBot(req, reply)) return;
        const ticket = await openTicketOf(req, reply);
        if (!ticket) return;
        if ((req.body as {withdraw?: unknown} | undefined)?.withdraw === true && await deps.withdraw(ticket)) {
            await deps.notify(null, 'updateRequest', {channelId: ticket.channelId});
            return reply.send({success: true, withdrawn: true});
        }
        await deps.close(ticket);
        return reply.send({success: true});
    });
}
