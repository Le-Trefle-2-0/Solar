import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {verifyWidgetSession} from '../../lib/widgetSession.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {canAccessTicket} from '../../lib/channelAccess.js';
import {verifyPow} from '../../lib/pow.js';
import {limitPerMinute} from '../../lib/rateLimit.js';
import {archiveNote, canArchiveWithoutTransmission, closeTicket, broadcastStatusUpdate} from '../../lib/ticketClosing.js';
import {getPermanenceStatus} from '../../lib/permanenceStatus.js';

async function canReadTicketsAll(userId: string): Promise<boolean> {
    const perms = await getUserPermissions(userId);
    return hasPermission(perms, 'tickets.read_all');
}


export interface TicketsRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findTicketByChannelId: (channelId: string) => Promise<{assignedUserId: string | null} | null>;
    findTicketById: (id: number) => Promise<{assignedUserId: string | null; channelId: string | null} | null>;
    updateTicket: (id: number, data: {categories?: string[]; feedback?: object}) => Promise<unknown>;
}

const defaultDeps: TicketsRouteDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({where: {channelId}}),
    findTicketById: (id) => prisma.ticket.findUnique({where: {id}}),
    updateTicket: (id, data) => prisma.ticket.update({where: {id}, data: {...data, updatedAt: new Date()}}),
};

/** Roles able to handle tickets: a ticket may only be assigned to a user holding one of these. */
const TICKET_HANDLER_PERMISSIONS = ['tickets.close', 'tickets.read_all', 'tickets.send_message', 'tickets.send_message_all'];

export async function registerTicketsRoutes(app: FastifyInstance, deps: TicketsRouteDeps = defaultDeps) {
    // GET /v1/tickets – list tickets depending on auth
    app.get('/v1/tickets', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const canReadAll = await canReadTicketsAll(userId);

        if (!canReadAll) {
            const tickets = await prisma.ticket.findMany({
                where: {
                    assignedUserId: userId,
                    statusName: {in: ['started', 'closed']},
                },
            });
            return reply.send({success: true, tickets});
        }

        const tickets = await prisma.ticket.findMany({
            where: {statusName: {in: ['waiting', 'started', 'closed']}},
        });
        return reply.send({success: true, tickets});
    });

    // GET /v1/tickets/history – list closed/commented tickets
    app.get('/v1/tickets/history', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const canReadAll = await canReadTicketsAll(userId);

        if (!canReadAll) return reply.status(403).send('forbidden');

        const tickets = await prisma.ticket.findMany({
            where: {statusName: {in: ['closed', 'commented']}},
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayUsername: true
                    }
                }
            },
            orderBy: {updatedAt: 'desc'}
        });

        const history = tickets.map(t => {
            const duration = Math.floor((t.updatedAt.getTime() - t.createdAt.getTime()) / 1000);
            return {
                ...t,
                duration
            };
        });

        return reply.send({success: true, tickets: history});
    });

    // POST /v1/tickets/assign
    app.post('/v1/tickets/assign', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.attribute')) {
            return reply.status(403).send('forbidden');
        }

        const bodySchema = z.object({ticketID: z.number(), assignmentID: z.string()});
        try {
            const {ticketID, assignmentID} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {id: ticketID}});
            if (!ticket) return reply.status(400).send('Ticket not found');
            const user = await prisma.user.findUnique({where: {id: assignmentID}});
            if (!user) return reply.status(400).send('User not found');
            // The target must be allowed to handle tickets.
            const targetPerms = await deps.getPermissions(user.id);
            if (!TICKET_HANDLER_PERMISSIONS.some(p => hasPermission(targetPerms, p))) {
                return reply.status(400).send('User cannot handle tickets');
            }
            const status = await prisma.ticketStatus.findUnique({where: {name: 'started'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});
            const update = await prisma.ticket.update({
                where: {id: ticketID},
                include: {status: true},
                data: {
                    assignedUserId: user.id,
                    updatedAt: new Date(),
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });
            await broadcastStatusUpdate(ticket.channelId as string, status.id, status.name);
            return reply.send({success: true, update});
        } catch (err) {
            if (err instanceof z.ZodError) return reply.status(400).send({success: false, errors: err.flatten()});
            return reply.status(500).send({success: false, message: 'Internal server error'});
        }
    });

    // POST /v1/tickets/close
    app.post('/v1/tickets/close', async (req, reply) => {
        const bodySchema = z.object({
            channelID: z.string().optional(),
            discordUserID: z.string().optional(),
            /** Managers, on an écoute nobody was assigned to: archived at once, no transmission. */
            withoutTransmission: z.boolean().optional(),
            reason: z.string().trim().max(500).optional(),
        }).refine(data => data.channelID || data.discordUserID, {
            message: "Either channelID or discordUserID must be provided"
        });

        try {
            const userId = await authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');

            const user = await prisma.user.findUnique({where: {id: userId}});
            if (!user) return reply.status(401).send('unauthorized');

            // Closing needs tickets.close (#267), on a ticket assigned to you unless you may read them all
            const perms = await deps.getPermissions(userId);
            if (!hasPermission(perms, 'tickets.close')) return reply.status(403).send('forbidden');

            const {channelID, discordUserID, withoutTransmission, reason} = bodySchema.parse((req.body ?? {}) as any);

            const ticket = await prisma.ticket.findFirst({
                where: {
                    OR: [
                        {channelId: channelID || undefined},
                        {discordUserID: discordUserID || undefined}
                    ],
                    statusName: {notIn: ['closed', 'commented']}
                }
            });

            if (!ticket) {
                console.warn(`[api] No active ticket found for identifier(s) provided`);
                return reply.status(404).send({success: false, error: 'Ticket not found or already closed'});
            }
            if (!canAccessTicket(perms, ticket.assignedUserId, userId)) {
                return reply.status(403).send('forbidden');
            }

            if (withoutTransmission && !canArchiveWithoutTransmission(perms, ticket.assignedUserId)) {
                return reply.status(403).send({success: false, error: 'assigned_or_not_manager'});
            }

            let update = await closeTicket(ticket, 'volunteer');
            console.log(`[api] Ticket ${ticket.id} closed by ${user.id}`);

            if (withoutTransmission) {
                // Nobody took it in charge: there is nothing to report, it goes straight to the history
                const archived = await prisma.ticketStatus.findUnique({where: {name: 'commented'}});
                if (!archived) return reply.status(500).send({success: false, error: 'status_missing'});
                update = await prisma.ticket.update({
                    where: {id: ticket.id},
                    include: {status: true},
                    data: {
                        statusName: archived.name,
                        statusLabel: archived.label,
                        categories: [],
                        observations: archiveNote(user.displayUsername || user.name, reason),
                    },
                });
                if (ticket.channelId) await broadcastStatusUpdate(ticket.channelId, archived.id, archived.name);
            }

            return reply.send({success: true, update});
        } catch (e) {
            console.error('[api] Error closing ticket:', e);
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // POST /v1/tickets/transmission
    app.post('/v1/tickets/transmission', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.transmission')) {
            return reply.status(403).send('forbidden');
        }

        const bodySchema = z.object({
            channelID: z.string().min(1).max(64),
            problematic: z.string().max(10_000),
            observations: z.string().max(10_000),
            info: z.string().max(10_000).optional(),
            categories: z.array(z.string().max(100)).max(30).optional(),
        });
        try {
            const {channelID, problematic, observations, info, categories} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {channelId: channelID}});
            if (!ticket) return reply.status(400).send({success: false, error: 'No ticket found'});
            // Only the assigned volunteer (or someone who may read every ticket), and only once
            // the ticket waits for its transmission: notes of other tickets stay untouched (#242)
            if (!canAccessTicket(await deps.getPermissions(userId), ticket.assignedUserId, userId)) {
                return reply.status(403).send('forbidden');
            }
            if (ticket.statusName !== 'closed') {
                return reply.status(409).send({success: false, error: 'Ticket is not waiting for a transmission'});
            }
            const status = await prisma.ticketStatus.findUnique({where: {name: 'commented'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});
            const update = await prisma.ticket.update({
                where: {id: ticket.id},
                include: {status: true},
                data: {
                    problematic,
                    observations,
                    info,
                    categories: categories || [],
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });
            await broadcastStatusUpdate(channelID, status.id, status.name);
            // Only what the client needs: no notes, feedback or requester id echoed back
            return reply.send({success: true, update: {id: update.id, statusName: update.statusName, statusLabel: update.statusLabel}});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // Écoutes from Discord are opened through /v1/bot/tickets (botBridge.ts), by the bot account only (#229)

    // POST /v1/tickets/web-create
    app.post('/v1/tickets/web-create', limitPerMinute(5), async (req, reply) => {
        // Proof of work first: unverified requests never reach the database
        if (!verifyPow((req.body as {pow?: unknown} | undefined)?.pow)) {
            return reply.status(403).send({success: false, error: 'pow_required'});
        }
        // Same rule as the widget: public écoutes only while a permanence is running
        const availability = await getPermanenceStatus();
        if (!availability.open) {
            return reply.status(403).send({success: false, error: 'permanence_closed', nextOpening: availability.nextOpening});
        }
        try {
            const syntheticId = `web:${crypto.randomUUID()}`;
            const status = await prisma.ticketStatus.findUnique({where: {name: 'waiting'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});

            const ticket = await prisma.ticket.create({
                data: {
                    discordUserID: syntheticId,
                    source: 'web',
                    metadata: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });

            let channelName = String(ticket.id).padStart(5, '0');
            channelName = 'Ticket-' + channelName;

            const channel = await prisma.channel.create({data: {name: channelName}});

            const updatedTicket = await prisma.ticket.update({
                where: {id: ticket.id},
                data: {
                    updatedAt: new Date(),
                    channelName: channel.name,
                    channelId: channel.id,
                },
            });

            await broadcast(null, 'updateRequest', {channelId: updatedTicket.channelId});

            return reply.send({success: true, ticket: updatedTicket});
        } catch (e) {
            return reply.status(500).send({success: false, message: 'Internal server error'});
        }
    });

    // POST /v1/tickets/findBy/channelID
    // Requires tickets.read_all, except for the user the ticket is assigned to.
    // Lookup is by channelId only: sequential numeric IDs must never be accepted here.
    app.post('/v1/tickets/findBy/channelID', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const bodySchema = z.object({channelID: z.string()});
        try {
            const {channelID} = bodySchema.parse((req.body ?? {}) as any);
            const perms = await deps.getPermissions(userId);
            const ticket = await deps.findTicketByChannelId(channelID);

            // Same answer for "missing" and "not yours", so existence is not disclosed.
            if (!canAccessTicket(perms, ticket?.assignedUserId, userId)) {
                return reply.status(403).send('forbidden');
            }

            if (!ticket) {
                return reply.status(404).send({success: false, message: 'No ticket found'});
            }
            return reply.send({success: true, ticket});
        } catch (e) {
            console.error('[API] Error in findBy/channelID:', e);
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // POST /v1/tickets/update-categories
    app.post('/v1/tickets/update-categories', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const bodySchema = z.object({
            ticketID: z.number(),
            categories: z.array(z.string()),
        });

        try {
            const {ticketID, categories} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await deps.findTicketById(ticketID);
            if (!canAccessTicket(await deps.getPermissions(userId), ticket?.assignedUserId, userId)) return reply.status(403).send('forbidden');
            if (!ticket) return reply.status(404).send({success: false, error: 'No ticket found'});

            const update = await deps.updateTicket(ticketID, {categories});
            return reply.send({success: true, update});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // POST /v1/tickets/submit-feedback
    // Visitor feedback: the form's fixed choices only, and a tiny body (#243)
    app.post('/v1/tickets/submit-feedback', {...limitPerMinute(10), bodyLimit: 4096}, async (req, reply) => {
        const yesNo = z.enum(['Oui', 'Non']);
        const bodySchema = z.object({
            ticketID: z.number().int().positive(),
            feedback: z.object({
                age: z.enum(['<12', '12-14', '15-18', '19-25', '>25']).optional(),
                feeling: z.enum(['Oui vraiment', 'un peu', 'moyennement', 'pas vraiment', 'pas du tout']).optional(),
                gender: z.enum(['Homme', 'Femme', 'Autre']).optional(),
                previouslyOpened: yesNo.optional(),
                previouslyAtTrefle: yesNo.optional(),
                location: z.enum(['France', 'Autre pays Francophone', 'Autre']).optional(),
                region: z.string().max(64).optional(),
            }).strict(),
        });

        try {
            const {ticketID, feedback} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await deps.findTicketById(ticketID);

            // Either the visitor who owns the ticket (signed widget cookies), or staff with access to it.
            const isVisitor = !!ticket?.channelId
                && verifyWidgetSession(req.cookies ?? {})?.channelId === ticket.channelId;
            if (!isVisitor) {
                const userId = await deps.authenticate(req);
                if (!userId) return reply.status(401).send('unauthorized');
                if (!canAccessTicket(await deps.getPermissions(userId), ticket?.assignedUserId, userId)) return reply.status(403).send('forbidden');
            }
            if (!ticket) return reply.status(404).send({success: false, error: 'No ticket found'});

            await deps.updateTicket(ticketID, {feedback});
            // The ticket is not echoed back: it holds staff notes the visitor must not see.
            return reply.send({success: true});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}

