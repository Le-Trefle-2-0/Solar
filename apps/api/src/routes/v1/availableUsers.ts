import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {requesterIdVariants} from '../../lib/pseudonym.js';

/** Only what the attribution picker shows. Never e-mail, address, birth date or document ids (#210). */
export type PublicUser = {id: string; name: string};

export interface AvailableUsersDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findTicketByChannelId: (channelId: string) => Promise<{discordUserID: string; voice: boolean} | null>;
    /** Users who are not banned, public fields only. */
    findUsers: () => Promise<PublicUser[]>;
    /** Users assigned to tickets of these requesters since `since`, for one modality. */
    findAssignedUserIds: (requesterIds: string[], since: Date, voice: boolean) => Promise<string[]>;
}

const defaultDeps: AvailableUsersDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({
        where: {channelId},
        select: {discordUserID: true, voice: true},
    }),
    findUsers: () => prisma.user.findMany({
        where: {OR: [{banned: null}, {banned: false}]},
        select: {id: true, name: true},
    }),
    findAssignedUserIds: async (requesterIds, since, voice) => {
        const tickets = await prisma.ticket.findMany({
            where: {createdAt: {gte: since}, voice, discordUserID: {in: requesterIds}},
            select: {assignedUserId: true},
        });
        return tickets.map(t => t.assignedUserId).filter((id): id is string => !!id);
    },
};

const DAY = 24 * 60 * 60 * 1000;
const TEXT_WINDOW_DAYS = 20;
const VOICE_WINDOW_DAYS = 30;

export async function registerAvailableUsersRoutes(app: FastifyInstance, deps: AvailableUsersDeps = defaultDeps) {
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

            const requesterIds = requesterIdVariants(ticket.discordUserID);
            const users = await deps.findUsers();
            const recent = async (voice: boolean) => new Set(await deps.findAssignedUserIds(
                requesterIds,
                new Date(Date.now() - (voice ? VOICE_WINDOW_DAYS : TEXT_WINDOW_DAYS) * DAY),
                voice,
            ));
            // Rebuild each object so no extra column can slip through
            const pick = (u: PublicUser): PublicUser => ({id: u.id, name: u.name});

            if (lists === 'ineligible') {
                const [textIds, voiceIds] = await Promise.all([recent(false), recent(true)]);
                return reply.send({
                    ineligibleText: users.filter(u => textIds.has(u.id)).map(pick),
                    ineligibleVoice: users.filter(u => voiceIds.has(u.id)).map(pick),
                });
            }

            const excluded = await recent(!!ticket.voice);
            return reply.send(users.filter(u => !excluded.has(u.id)).map(pick));
        } catch (e) {
            console.error('Failed to compute available users:', e);
            return reply.status(500).send({success: false, error: 'Failed to compute available users'});
        }
    });
}
