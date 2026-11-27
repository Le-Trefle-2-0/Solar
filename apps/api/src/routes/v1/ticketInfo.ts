import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {canAccessTicket} from '../../lib/channelAccess.js';
import {broadcast} from '../../lib/broadcast.js';
import {neutralizeHtml} from '../../lib/sanitize.js';
import {anonymityNumber, requesterHash, revealableDiscordId} from '../../lib/requester.js';
import {availableUsersDefaultDeps, ineligibleVolunteers, type AvailableUsersDeps} from './availableUsers.js';

/**
 * The écoute's "Informations" panel: vigilances noted about the person in earlier écoutes,
 * volunteers who may not take them in charge (30-day rule), their anonymity number for
 * reports, and, for managers in an emergency, their Discord id. Revealing it is written in the
 * transcript as a team note, which the person never sees.
 */

type InfoTicket = {
    id: number;
    channelId: string | null;
    source: string;
    statusName: string;
    discordUserID: string;
    assignedUserId: string | null;
};

export interface TicketInfoDeps extends Pick<AvailableUsersDeps, 'findUsers' | 'findAssignments'> {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findTicket: (channelId: string) => Promise<InfoTicket | null>;
    vigilancesOf: (requesterHash: string) => Promise<{id: string; category: string; note: string | null; createdAt: Date}[]>;
    userName: (userId: string) => Promise<string | null>;
    saveInternalNote: (ticket: InfoTicket, userId: string, content: string) => Promise<{id: number; createdAt: Date}>;
    notify: (room: string, event: string, data: unknown) => Promise<void>;
}

const defaultDeps: TicketInfoDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findUsers: availableUsersDefaultDeps.findUsers,
    findAssignments: availableUsersDefaultDeps.findAssignments,
    findTicket: (channelId) => prisma.ticket.findUnique({
        where: {channelId},
        select: {id: true, channelId: true, source: true, statusName: true, discordUserID: true, assignedUserId: true},
    }),
    vigilancesOf: (hash) => prisma.vigilance.findMany({
        where: {requesterHash: hash},
        orderBy: {createdAt: 'desc'},
        select: {id: true, category: true, note: true, createdAt: true},
    }),
    userName: async (userId) => {
        const user = await prisma.user.findUnique({where: {id: userId}, select: {name: true, displayUsername: true}});
        return user ? user.displayUsername || user.name : null;
    },
    saveInternalNote: (ticket, userId, content) => prisma.message.create({
        data: {
            userId, channelId: ticket.channelId!, ticketId: ticket.id, internal: true,
            content: Buffer.from(content, 'utf8'), createdAt: new Date(),
        },
        select: {id: true, createdAt: true},
    }),
    // Team members of the écoute only: never the visitor's widget nor the bot
    notify: (room, event, data) => broadcast(room, event, data, {audience: 'staff'}),
};

const revealSchema = z.object({reason: z.string().trim().min(10).max(500)});

export async function registerTicketInfoRoutes(app: FastifyInstance, deps: TicketInfoDeps = defaultDeps) {
    async function load(req: any, reply: any) {
        const userId = await deps.authenticate(req);
        if (!userId) {
            reply.status(401).send('unauthorized');
            return null;
        }
        const {channelId} = req.params as {channelId: string};
        const ticket = typeof channelId === 'string' && channelId.length <= 64 ? await deps.findTicket(channelId) : null;
        const permissions = await deps.getPermissions(userId);
        // Same answer for "missing" and "not yours"
        if (!ticket || !ticket.channelId || !canAccessTicket(permissions, ticket.assignedUserId, userId)) {
            reply.status(403).send('forbidden');
            return null;
        }
        return {userId, ticket, permissions};
    }

    app.get('/v1/tickets/:channelId/info', async (req, reply) => {
        const ctx = await load(req, reply);
        if (!ctx) return;
        const {ticket, permissions} = ctx;
        const hash = requesterHash(ticket.discordUserID);
        const vigilances = await deps.vigilancesOf(hash);
        return reply.send({
            source: ticket.source,
            anonymityNumber: anonymityNumber(hash),
            vigilances: vigilances.map(v => ({id: v.id, category: v.category, note: v.note, createdAt: v.createdAt.toISOString()})),
            // Who may take this person in charge: for those who assign écoutes
            ineligible: hasPermission(permissions, 'tickets.attribute') ? await ineligibleVolunteers(deps, ticket.discordUserID) : null,
            reveal: {
                available: revealableDiscordId(ticket) !== null,
                allowed: hasPermission(permissions, 'tickets.reveal_identity'),
            },
        });
    });

    // Emergency only: the Discord id of the person, with the reason written in the transcript
    app.post('/v1/tickets/:channelId/reveal', async (req, reply) => {
        const ctx = await load(req, reply);
        if (!ctx) return;
        const {userId, ticket, permissions} = ctx;
        if (!hasPermission(permissions, 'tickets.reveal_identity')) return reply.status(403).send('forbidden: tickets.reveal_identity required');
        const parsed = revealSchema.safeParse(req.body ?? {});
        if (!parsed.success) return reply.status(400).send({error: 'reason_required'});
        const discordUserId = revealableDiscordId(ticket);
        if (!discordUserId) return reply.status(409).send({error: 'not_revealable'});

        const name = (await deps.userName(userId)) ?? 'un responsable';
        const content = neutralizeHtml(`Identifiant Discord révélé par ${name}. Motif : ${parsed.data.reason}`);
        const saved = await deps.saveInternalNote(ticket, userId, content);
        const note = {
            id: saved.id,
            author: {id: userId, name, image: null, role: null},
            content,
            timestamp: saved.createdAt.getTime(),
            channel: {id: ticket.channelId},
            reactions: [],
            replyID: null,
            internal: true,
        };
        await deps.notify(ticket.channelId!, 'message', note);
        return reply.send({discordUserId, note});
    });
}
