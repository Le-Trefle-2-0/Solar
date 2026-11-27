import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {broadcast} from '../../lib/broadcast.js';
import {canHandleTickets, JOIN_EARLY_MINUTES, pickCurrentPermanence, type PlanningEvent} from '../../lib/presence.js';

/**
 * "Rejoindre la permanence": volunteers say they are on duty when they arrive, registered on
 * the planning or as reinforcements. Managers (tickets.attribute) see who is there, free or in
 * an écoute, and who registered but has not arrived.
 */

export type OpenTicket = {id: number; channelId: string | null; assignedUserId: string; statusName: string};

export interface PresenceDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    currentPermanence: (now: Date) => Promise<PlanningEvent | null>;
    /** Present now (joined, not left), first arrived first. */
    presences: (eventId: string) => Promise<{userId: string; joinedAt: Date}[]>;
    join: (eventId: string, userId: string) => Promise<void>;
    leave: (eventId: string, userId: string) => Promise<void>;
    /** Confirmed registrations on the planning event. */
    registeredUserIds: (eventId: string) => Promise<string[]>;
    users: (ids: string[]) => Promise<{id: string; name: string; image: string | null}[]>;
    /** Écoutes in progress or waiting for their transmission, of these volunteers. */
    openTicketsOf: (userIds: string[]) => Promise<OpenTicket[]>;
    notify: (event: string, data: unknown) => Promise<void>;
}

export const presenceDefaultDeps: PresenceDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    currentPermanence: async (now) => pickCurrentPermanence(await prisma.event.findMany({
        where: {end: {gt: now}, start: {lte: new Date(now.getTime() + JOIN_EARLY_MINUTES * 60_000)}},
        select: {id: true, title: true, start: true, end: true, channelID: true},
    }), now),
    presences: (eventId) => prisma.permanencePresence.findMany({
        where: {eventId, leftAt: null},
        orderBy: {joinedAt: 'asc'},
        select: {userId: true, joinedAt: true},
    }),
    join: async (eventId, userId) => {
        const already = await prisma.permanencePresence.findFirst({where: {eventId, userId, leftAt: null}});
        if (!already) await prisma.permanencePresence.create({data: {eventId, userId}});
    },
    leave: async (eventId, userId) => {
        await prisma.permanencePresence.updateMany({where: {eventId, userId, leftAt: null}, data: {leftAt: new Date()}});
    },
    registeredUserIds: async (eventId) => (await prisma.eventRegistration.findMany({
        where: {eventId, status: 'confirmed'},
        select: {userId: true},
    })).map(r => r.userId),
    users: (ids) => prisma.user.findMany({
        where: {id: {in: ids}},
        select: {id: true, name: true, displayUsername: true, image: true},
    }).then(list => list.map(u => ({id: u.id, name: u.displayUsername || u.name, image: u.image}))),
    openTicketsOf: async (userIds) => (await prisma.ticket.findMany({
        where: {assignedUserId: {in: userIds}, statusName: {in: ['started', 'closed']}},
        select: {id: true, channelId: true, assignedUserId: true, statusName: true},
    })) as OpenTicket[],
    notify: (event, data) => broadcast(null, event, data),
};

const reference = (id: number) => String(id).padStart(5, '0');

export async function registerPresenceRoutes(app: FastifyInstance, deps: PresenceDeps = presenceDefaultDeps) {
    async function actor(req: any, reply: any) {
        const userId = await deps.authenticate(req);
        if (!userId) {
            reply.status(401).send('unauthorized');
            return null;
        }
        return {userId, permissions: await deps.getPermissions(userId)};
    }

    app.get('/v1/permanence/presence', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        const permanence = await deps.currentPermanence(new Date());
        const canJoin = canHandleTickets(me.permissions);
        if (!permanence) return reply.send({permanence: null, me: {present: false, canJoin, registered: false}, team: null});

        const [presences, registered] = await Promise.all([deps.presences(permanence.id), deps.registeredUserIds(permanence.id)]);
        const registeredSet = new Set(registered);
        const presentIds = presences.map(p => p.userId);
        const body = {
            permanence: {
                id: permanence.id, title: permanence.title, channelId: permanence.channelID,
                start: permanence.start.toISOString(), end: permanence.end.toISOString(),
            },
            me: {present: presentIds.includes(me.userId), canJoin, registered: registeredSet.has(me.userId)},
            team: null as unknown,
        };
        if (!hasPermission(me.permissions, 'tickets.attribute')) return reply.send(body);

        // Managers: who is there, free or in an écoute; who registered but has not arrived
        const expectedIds = registered.filter(id => !presentIds.includes(id));
        const [users, tickets] = await Promise.all([
            deps.users([...new Set([...presentIds, ...expectedIds])]),
            deps.openTicketsOf(presentIds),
        ]);
        const byId = new Map(users.map(u => [u.id, u]));
        body.team = {
            present: presences.flatMap(p => {
                const user = byId.get(p.userId);
                if (!user) return [];
                const inProgress = tickets.find(t => t.assignedUserId === p.userId && t.statusName === 'started');
                return [{
                    id: user.id, name: user.name, image: user.image,
                    registered: registeredSet.has(user.id),
                    joinedAt: p.joinedAt.toISOString(),
                    status: inProgress ? 'in_ticket' : 'available',
                    ticket: inProgress ? {channelId: inProgress.channelId, reference: reference(inProgress.id)} : null,
                    transmissionsDue: tickets.filter(t => t.assignedUserId === p.userId && t.statusName === 'closed').length,
                }];
            }),
            expected: expectedIds.flatMap(id => {
                const user = byId.get(id);
                return user ? [{id: user.id, name: user.name}] : [];
            }),
        };
        return reply.send(body);
    });

    app.post('/v1/permanence/join', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        if (!canHandleTickets(me.permissions)) return reply.status(403).send({error: 'cannot_handle_tickets'});
        const permanence = await deps.currentPermanence(new Date());
        if (!permanence) return reply.status(409).send({error: 'no_permanence'});
        await deps.join(permanence.id, me.userId);
        await deps.notify('presenceUpdate', {eventId: permanence.id});
        return reply.send({success: true});
    });

    // Leaving: oneself, or someone else for managers (forgot to leave). Not in the middle of an écoute.
    app.post('/v1/permanence/leave', async (req, reply) => {
        const me = await actor(req, reply);
        if (!me) return;
        const requested = (req.body as {userId?: unknown} | undefined)?.userId;
        const target = typeof requested === 'string' && requested ? requested : me.userId;
        if (target !== me.userId && !hasPermission(me.permissions, 'tickets.attribute')) return reply.status(403).send({error: 'forbidden'});
        const permanence = await deps.currentPermanence(new Date());
        if (!permanence) return reply.status(409).send({error: 'no_permanence'});
        const inProgress = (await deps.openTicketsOf([target])).find(t => t.statusName === 'started');
        if (inProgress) return reply.status(409).send({error: 'in_ticket', reference: reference(inProgress.id)});
        await deps.leave(permanence.id, target);
        await deps.notify('presenceUpdate', {eventId: permanence.id});
        return reply.send({success: true});
    });
}

/** For the assignment rules: who is present now, and who is already in an écoute. */
export async function assignmentContext(deps: Pick<PresenceDeps, 'currentPermanence' | 'presences' | 'openTicketsOf'> = presenceDefaultDeps) {
    const permanence = await deps.currentPermanence(new Date());
    const present = new Set(permanence ? (await deps.presences(permanence.id)).map(p => p.userId) : []);
    return {permanenceOn: !!permanence, present};
}
