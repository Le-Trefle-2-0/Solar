import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {broadcast} from '../../lib/broadcast.js';
import {neutralizeHtml} from '../../lib/sanitize.js';
import {presenceDefaultDeps} from './presence.js';
import type {PlanningEvent} from '../../lib/presence.js';
import {isOpenRequest, requestRefusal, ticketReference, type SpectateRow} from '../../lib/spectate.js';

/**
 * "Observer une écoute": volunteers in training ask from the permanence's channel; a manager
 * (tickets.attribute) approves by choosing an écoute in progress, or refuses. The trainee then
 * reads that écoute, read-only, until it ends or someone stops the observation.
 */

export type SpectateRequestRow = SpectateRow & {userName: string; createdAt: Date};
export type OngoingTicket = {id: number; channelId: string | null; statusName: string; assignedUserId: string | null; volunteerName: string | null};

export interface SpectateDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    currentPermanence: (now: Date) => Promise<PlanningEvent | null>;
    /** The user's requests still pending or approved, newest first. */
    requestsOfUser: (userId: string) => Promise<SpectateRequestRow[]>;
    /** Requests still pending or approved, of every trainee, oldest first. */
    liveRequests: () => Promise<SpectateRequestRow[]>;
    findRequest: (id: string) => Promise<SpectateRequestRow | null>;
    create: (eventId: string, userId: string) => Promise<void>;
    update: (id: string, data: {status: string; ticketId?: number; decidedById?: string; decidedAt?: Date; endedAt?: Date}) => Promise<void>;
    /** Écoutes in progress with a volunteer: those a trainee can observe. */
    ongoingTickets: () => Promise<OngoingTicket[]>;
    findTicket: (id: number) => Promise<OngoingTicket | null>;
    userName: (userId: string) => Promise<string | null>;
    saveInternalNote: (ticket: {id: number; channelId: string}, userId: string, content: string) => Promise<{id: number; createdAt: Date}>;
    notify: (room: string | null, event: string, data: unknown, audience?: 'staff') => Promise<void>;
}

const requestSelect = {
    id: true, eventId: true, userId: true, status: true, createdAt: true,
    user: {select: {name: true, displayUsername: true}},
    ticket: {select: {id: true, channelId: true, statusName: true}},
} as const;

const toRow = (r: any): SpectateRequestRow => ({
    id: r.id, eventId: r.eventId, userId: r.userId, status: r.status, createdAt: r.createdAt,
    userName: r.user?.displayUsername || r.user?.name || 'Bénévole',
    ticket: r.ticket,
});

const toOngoing = (t: any): OngoingTicket => ({
    id: t.id, channelId: t.channelId, statusName: t.statusName, assignedUserId: t.assignedUserId,
    volunteerName: t.user ? t.user.displayUsername || t.user.name : null,
});

const ticketSelect = {
    id: true, channelId: true, statusName: true, assignedUserId: true,
    user: {select: {name: true, displayUsername: true}},
} as const;

export const spectateDefaultDeps: SpectateDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    currentPermanence: presenceDefaultDeps.currentPermanence,
    requestsOfUser: async (userId) => (await prisma.spectateRequest.findMany({
        where: {userId, status: {in: ['pending', 'approved']}},
        orderBy: {createdAt: 'desc'},
        select: requestSelect,
    })).map(toRow),
    liveRequests: async () => (await prisma.spectateRequest.findMany({
        where: {status: {in: ['pending', 'approved']}},
        orderBy: {createdAt: 'asc'},
        select: requestSelect,
    })).map(toRow),
    findRequest: async (id) => {
        const r = await prisma.spectateRequest.findUnique({where: {id}, select: requestSelect});
        return r ? toRow(r) : null;
    },
    create: async (eventId, userId) => {
        await prisma.spectateRequest.create({data: {eventId, userId}});
    },
    update: async (id, data) => {
        await prisma.spectateRequest.update({where: {id}, data});
    },
    ongoingTickets: async () => (await prisma.ticket.findMany({
        where: {statusName: 'started', assignedUserId: {not: null}, channelId: {not: null}},
        orderBy: {id: 'asc'},
        select: ticketSelect,
    })).map(toOngoing),
    findTicket: async (id) => {
        const t = await prisma.ticket.findUnique({where: {id}, select: ticketSelect});
        return t ? toOngoing(t) : null;
    },
    userName: async (userId) => {
        const user = await prisma.user.findUnique({where: {id: userId}, select: {name: true, displayUsername: true}});
        return user ? user.displayUsername || user.name : null;
    },
    saveInternalNote: (ticket, userId, content) => prisma.message.create({
        data: {
            userId, channelId: ticket.channelId, ticketId: ticket.id, internal: true,
            content: Buffer.from(content, 'utf8'), createdAt: new Date(),
        },
        select: {id: true, createdAt: true},
    }),
    notify: (room, event, data, audience) => broadcast(room, event, data, audience ? {audience} : {}),
};

const approveSchema = z.object({ticketId: z.number().int().positive()});

export async function registerSpectateRoutes(app: FastifyInstance, deps: SpectateDeps = spectateDefaultDeps) {
    async function actor(req: any, reply: any) {
        const userId = await deps.authenticate(req);
        if (!userId) {
            reply.status(401).send('unauthorized');
            return null;
        }
        return {userId, permissions: await deps.getPermissions(userId)};
    }

    /** Approved requests whose écoute ended are over: closed as they are met. */
    async function settle(rows: SpectateRequestRow[]) {
        const open: SpectateRequestRow[] = [];
        for (const r of rows) {
            if (isOpenRequest(r)) open.push(r);
            else if (r.status === 'approved') await deps.update(r.id, {status: 'ended', endedAt: new Date()});
        }
        return open;
    }

    const describe = (r: SpectateRequestRow) => ({
        id: r.id,
        status: r.status,
        user: {id: r.userId, name: r.userName},
        createdAt: r.createdAt.toISOString(),
        ticket: r.ticket?.channelId ? {channelId: r.ticket.channelId, reference: ticketReference(r.ticket.id)} : null,
    });

    /** A team note in the écoute's transcript (never shown to the person listened to). */
    async function note(ticket: {id: number; channelId: string | null}, authorId: string, text: string) {
        if (!ticket.channelId) return;
        const content = neutralizeHtml(text);
        const saved = await deps.saveInternalNote({id: ticket.id, channelId: ticket.channelId}, authorId, content);
        await deps.notify(ticket.channelId, 'message', {
            id: saved.id,
            author: {id: authorId, name: (await deps.userName(authorId)) ?? 'Solar', image: null, role: null},
            content,
            timestamp: saved.createdAt.getTime(),
            channel: {id: ticket.channelId},
            reactions: [],
            replyID: null,
            internal: true,
        }, 'staff');
    }

    async function changed(channelId?: string | null) {
        await deps.notify(null, 'spectateUpdate', {});
        // Followed channels change: sockets and sidebars sync again
        if (channelId) await deps.notify(null, 'updateRequest', {channelId});
    }

    app.get('/v1/permanence/spectate', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        const permanence = await deps.currentPermanence(new Date());
        const canRequest = hasPermission(me.permissions, 'tickets.spectate');
        const mine = canRequest ? (await settle(await deps.requestsOfUser(me.userId)))[0] ?? null : null;
        const body = {
            permanence: permanence ? {id: permanence.id, channelId: permanence.channelID} : null,
            me: {canRequest, request: mine ? describe(mine) : null},
            manage: null as unknown,
        };
        if (!hasPermission(me.permissions, 'tickets.attribute')) return reply.send(body);

        const [requests, tickets] = await Promise.all([deps.liveRequests().then(settle), deps.ongoingTickets()]);
        body.manage = {
            requests: requests.map(describe),
            tickets: tickets.filter(t => t.channelId).map(t => ({
                id: t.id,
                reference: ticketReference(t.id),
                channelId: t.channelId,
                volunteer: t.volunteerName,
                observers: requests.filter(r => r.status === 'approved' && r.ticket?.id === t.id).length,
            })),
        };
        return reply.send(body);
    });

    // Asked from the permanence's channel, during a permanence
    app.post('/v1/permanence/spectate', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        const permanence = await deps.currentPermanence(new Date());
        const open = await settle(await deps.requestsOfUser(me.userId));
        const refusal = requestRefusal({
            permissions: me.permissions,
            permanenceChannelId: permanence?.channelID ?? null,
            channelId: (req.body as {channelId?: unknown} | undefined)?.channelId,
            hasOpenRequest: open.length > 0,
        });
        if (refusal === 'forbidden') return reply.status(403).send({error: refusal});
        if (refusal) return reply.status(409).send({error: refusal});
        await deps.create(permanence!.id, me.userId);
        await changed();
        return reply.send({success: true});
    });

    app.post('/v1/permanence/spectate/:id/approve', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        if (!hasPermission(me.permissions, 'tickets.attribute')) return reply.status(403).send({error: 'forbidden'});
        const parsed = approveSchema.safeParse(req.body ?? {});
        if (!parsed.success) return reply.status(400).send({error: 'ticket_required'});
        const request = await deps.findRequest((req.params as {id: string}).id);
        if (!request || request.status !== 'pending') return reply.status(409).send({error: 'not_pending'});
        // The trainee may have lost the permission since asking
        if (!hasPermission(await deps.getPermissions(request.userId), 'tickets.spectate')) {
            return reply.status(409).send({error: 'not_allowed'});
        }
        const ticket = await deps.findTicket(parsed.data.ticketId);
        if (!ticket || ticket.statusName !== 'started' || !ticket.assignedUserId || !ticket.channelId) {
            return reply.status(409).send({error: 'ticket_not_ongoing'});
        }
        if (ticket.assignedUserId === request.userId) return reply.status(409).send({error: 'own_ticket'});

        await deps.update(request.id, {status: 'approved', ticketId: ticket.id, decidedById: me.userId, decidedAt: new Date()});
        const manager = (await deps.userName(me.userId)) ?? 'un responsable';
        await changed(ticket.channelId);
        await note(ticket, me.userId, `${request.userName} (bénévole en formation) observe cette écoute en lecture seule, avec l'accord de ${manager}.`);
        return reply.send({success: true});
    });

    app.post('/v1/permanence/spectate/:id/refuse', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        if (!hasPermission(me.permissions, 'tickets.attribute')) return reply.status(403).send({error: 'forbidden'});
        const request = await deps.findRequest((req.params as {id: string}).id);
        if (!request || request.status !== 'pending') return reply.status(409).send({error: 'not_pending'});
        await deps.update(request.id, {status: 'refused', decidedById: me.userId, decidedAt: new Date()});
        await changed();
        return reply.send({success: true});
    });

    // Cancelling a request, or stopping an observation: the trainee, or a manager
    app.post('/v1/permanence/spectate/:id/end', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        const request = await deps.findRequest((req.params as {id: string}).id);
        const manager = hasPermission(me.permissions, 'tickets.attribute');
        // Same answer for "missing" and "not yours"
        if (!request || (request.userId !== me.userId && !manager)) return reply.status(404).send({error: 'not_found'});
        if (!isOpenRequest(request)) {
            if (request.status === 'approved') await deps.update(request.id, {status: 'ended', endedAt: new Date()});
            return reply.status(409).send({error: 'not_open'});
        }
        const observed = request.status === 'approved' ? request.ticket : null;
        await deps.update(request.id, {status: 'ended', endedAt: new Date()});
        await changed(observed?.channelId);
        if (observed) {
            const by = request.userId === me.userId ? '' : `, arrêtée par ${(await deps.userName(me.userId)) ?? 'un responsable'}`;
            await note(observed, me.userId, `${request.userName} n'observe plus cette écoute${by}.`);
        }
        return reply.send({success: true});
    });
}
