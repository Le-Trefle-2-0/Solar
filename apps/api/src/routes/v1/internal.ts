import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {isInternal} from '../../lib/internalAuth.js';
import {getActor} from '../../lib/permissions.js';
import {hasPermission} from '../../lib/roleAssignment.js';
import {canReadChannel, canWriteChannel, PUBLIC_CHANNEL_ID} from '../../lib/channelAccess.js';

/**
 * Service-to-service routes for the WebSocket service (Authorization: Bearer INTERNAL_API_SECRET).
 * The WebSocket service never decides access by itself: it asks here (#213, #214).
 */

export interface InternalWsDeps {
    isInternal: (req: any) => boolean;
    getActor: (userId: string) => Promise<{id: string; permissions: string[]} | null>;
    findUser: (userId: string) => Promise<{id: string; name: string; displayUsername: string | null; image: string | null; role: string | null; banned: boolean | null} | null>;
    findTicketByChannelId: (channelId: string) => Promise<{assignedUserId: string | null} | null>;
    /** Channels of the tickets assigned to the user that are still in progress. */
    findAssignedChannelIds: (userId: string) => Promise<string[]>;
}

const defaultDeps: InternalWsDeps = {
    isInternal,
    getActor,
    findUser: (userId) => prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, name: true, displayUsername: true, image: true, role: true, banned: true},
    }),
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({where: {channelId}, select: {assignedUserId: true}}),
    findAssignedChannelIds: async (userId) => {
        const tickets = await prisma.ticket.findMany({
            where: {assignedUserId: userId, statusName: {not: 'commented'}, channelId: {not: null}},
            select: {channelId: true},
        });
        return tickets.map(t => t.channelId!).filter(Boolean);
    },
};

/** Avatars may be stored as data URLs: never relay megabytes to every socket. */
const MAX_IMAGE_LENGTH = 200_000;

export async function registerInternalRoutes(app: FastifyInstance, deps: InternalWsDeps = defaultDeps) {
    const readUserId = (body: unknown) => {
        const userId = (body as {userId?: unknown} | undefined)?.userId;
        return typeof userId === 'string' && userId.length > 0 && userId.length <= 128 ? userId : null;
    };

    // Who a volunteer socket is: identity built from the database (never from the client),
    // whether it may read every ticket, and the channels it may follow from the start.
    app.post('/v1/internal/ws/session', async (req, reply) => {
        if (!deps.isInternal(req)) return reply.status(401).send({error: 'unauthorized'});
        const userId = readUserId(req.body);
        if (!userId) return reply.status(400).send({error: 'invalid_user'});

        const [user, actor] = await Promise.all([deps.findUser(userId), deps.getActor(userId)]);
        if (!user || !actor || user.banned) return reply.status(404).send({error: 'not_found'});

        const readAll = hasPermission(actor.permissions, 'tickets.read_all');
        const channels = [PUBLIC_CHANNEL_ID, ...(readAll ? [] : await deps.findAssignedChannelIds(userId))];
        return reply.send({
            user: {
                id: user.id,
                username: user.displayUsername || user.name,
                image: user.image && user.image.length <= MAX_IMAGE_LENGTH ? user.image : null,
                role: user.role,
            },
            readAll,
            channels: [...new Set(channels)],
        });
    });

    // Read and write rights of a user on one channel (same rules as the HTTP routes).
    app.post('/v1/internal/ws/channel-access', async (req, reply) => {
        if (!deps.isInternal(req)) return reply.status(401).send({error: 'unauthorized'});
        const userId = readUserId(req.body);
        const channelId = (req.body as {channelId?: unknown} | undefined)?.channelId;
        if (!userId || typeof channelId !== 'string' || !channelId || channelId.length > 64) {
            return reply.status(400).send({error: 'invalid_request'});
        }

        const actor = await deps.getActor(userId);
        if (!actor) return reply.send({read: false, write: false});
        const ticket = channelId === PUBLIC_CHANNEL_ID ? null : await deps.findTicketByChannelId(channelId);
        const input = {channelId, userId, permissions: actor.permissions, assignedUserId: ticket?.assignedUserId ?? null};
        return reply.send({read: canReadChannel(input), write: canWriteChannel(input)});
    });
}
