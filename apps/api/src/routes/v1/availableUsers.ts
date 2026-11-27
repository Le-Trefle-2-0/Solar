import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {requesterIdVariants} from '../../lib/pseudonym.js';
import {ELIGIBILITY_WINDOW_DAYS} from '../../lib/requester.js';

/** Only what the attribution picker shows. Never e-mail, address, birth date or document ids (#210). */
export type PublicUser = {id: string; name: string};

/** A volunteer who took this person in charge recently, and when they may again. */
export type IneligibleUser = PublicUser & {until: string};

export interface AvailableUsersDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findTicketByChannelId: (channelId: string) => Promise<{discordUserID: string} | null>;
    /** Users who are not banned, public fields only. */
    findUsers: () => Promise<PublicUser[]>;
    /** Who was assigned to écoutes of these requesters since `since` (text and voice), and when. */
    findAssignments: (requesterIds: string[], since: Date) => Promise<{userId: string; at: Date}[]>;
}

export const availableUsersDefaultDeps: AvailableUsersDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({
        where: {channelId},
        select: {discordUserID: true},
    }),
    findUsers: () => prisma.user.findMany({
        where: {OR: [{banned: null}, {banned: false}]},
        select: {id: true, name: true},
    }),
    findAssignments: async (requesterIds, since) => {
        const tickets = await prisma.ticket.findMany({
            where: {createdAt: {gte: since}, discordUserID: {in: requesterIds}, assignedUserId: {not: null}},
            select: {assignedUserId: true, createdAt: true},
        });
        return tickets.map(t => ({userId: t.assignedUserId!, at: t.createdAt}));
    },
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Volunteers who may not take this person in charge: at most once every 30 days, text and
 * voice alike (internal rule). `until`: the day they may again.
 */
export async function ineligibleVolunteers(
    deps: Pick<AvailableUsersDeps, 'findUsers' | 'findAssignments'>,
    storedRequesterId: string,
    now = Date.now(),
): Promise<IneligibleUser[]> {
    const window = ELIGIBILITY_WINDOW_DAYS * DAY;
    const assignments = await deps.findAssignments(requesterIdVariants(storedRequesterId), new Date(now - window));
    const last = new Map<string, number>();
    for (const a of assignments) last.set(a.userId, Math.max(last.get(a.userId) ?? 0, a.at.getTime()));
    if (!last.size) return [];
    // Rebuild each object so no extra column can slip through
    return (await deps.findUsers())
        .filter(u => last.has(u.id))
        .map(u => ({id: u.id, name: u.name, until: new Date(last.get(u.id)! + window).toISOString()}))
        .sort((a, b) => a.until.localeCompare(b.until));
}

export async function registerAvailableUsersRoutes(app: FastifyInstance, deps: AvailableUsersDeps = availableUsersDefaultDeps) {
    app.get('/v1/events/getAvailable', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');
        if (!hasPermission(await deps.getPermissions(userId), 'tickets.attribute')) {
            return reply.status(403).send('forbidden');
        }

        const {channelID, lists} = req.query as {channelID?: unknown; lists?: unknown};
        if (typeof channelID !== 'string' || !channelID) {
            return reply.status(400).send({success: false, error: 'channelID is required'});
        }

        try {
            const ticket = await deps.findTicketByChannelId(channelID);
            if (!ticket) return reply.status(404).send({success: false, error: 'Ticket not found'});

            const ineligible = await ineligibleVolunteers(deps, ticket.discordUserID);
            if (lists === 'ineligible') return reply.send({ineligible});

            const excluded = new Set(ineligible.map(u => u.id));
            return reply.send((await deps.findUsers()).filter(u => !excluded.has(u.id)).map(u => ({id: u.id, name: u.name})));
        } catch (e) {
            console.error('Failed to compute available users:', e);
            return reply.status(500).send({success: false, error: 'Failed to compute available users'});
        }
    });
}
