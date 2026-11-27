import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

import {getUserPermissions, hasPermission} from '../../lib/permissions.js';

import {broadcast} from '../../lib/broadcast.js';
import {canReadChannel, describeChannel, isPermanenceChannel} from '../../lib/channelAccess.js';

async function canReadTicketsAll(userId: string): Promise<boolean> {
    const perms = await getUserPermissions(userId);
    return hasPermission(perms, 'tickets.read_all');
}

export interface ChannelsRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findChannel: (id: string) => Promise<{id: string; name: string} | null>;
    findTicketByChannelId: (channelId: string) => Promise<{assignedUserId: string | null} | null>;
    isPermanenceChannel: (channelId: string) => Promise<boolean>;
}

const defaultDeps: ChannelsRouteDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findChannel: (id) => prisma.channel.findUnique({where: {id}}),
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({where: {channelId}}),
    isPermanenceChannel,
};

export async function registerChannelsRoutes(app: FastifyInstance, deps: ChannelsRouteDeps = defaultDeps) {
    // Shared channel rule (info, read markers): open channels, tickets.read_all, or assigned
    const canRead = async (userId: string, channelId: string) => canReadChannel({
        channelId,
        userId,
        permissions: await deps.getPermissions(userId),
        ...await describeChannel(channelId, deps.findTicketByChannelId, deps.isPermanenceChannel),
    });

    const bodySchema = z.object({id: z.string().min(1)});

    // POST /v1/channels – returns channels the user can access
    app.post('/v1/channels', async (req, reply) => {
        try {
            const userId = await authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');

            const channels = await prisma.channel.findMany();
            const canReadAll = await canReadTicketsAll(userId);

            const accessed: any[] = [];
            for (const channel of channels) {
                if (channel.id === '1') {
                    accessed.push(channel);
                    continue;
                }
                const ticket = await prisma.ticket.findUnique({
                    where: {channelId: channel.id},
                    include: {status: true},
                });
                if (!ticket) continue;
                // In original code: if status.id !== 4 (magic constant). We keep same behavior.
                if (ticket.status && (ticket.status as any).id !== 4) {
                    if (canReadAll) accessed.push(channel);
                    else if (ticket.assignedUserId === userId && await canRead(userId, channel.id)) accessed.push(channel);
                }
            }
            return reply.send({success: true, accessedChannels: accessed});
        } catch (e) {
            if (e instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: e.flatten()});
            }
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // GET /v1/channel/:id – channel info
    // Public channel '1' is open to any signed-in user; others require tickets.read_all
    // or being assigned to the channel's ticket.
    app.get('/v1/channel/:id', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const {id} = req.params as {id: string};

        // Checked before the channel lookup, so existence is not disclosed.
        if (!(await canRead(userId, id))) return reply.status(403).send('forbidden');

        const channel = await deps.findChannel(id);
        if (!channel) return reply.status(404).send({error: 'not_found'});
        return channel;
    });

    // GET /v1/channel/:id/members – list all members having access to the channel
    app.get('/v1/channel/:id/members', async (req, reply) => {
        try {
            const {id: channelID} = req.params as any;
            const userId = await authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');

            const channel = await prisma.channel.findUnique({where: {id: channelID}});
            if (!channel) return reply.status(404).send({error: 'not_found'});

            const canReadAll = await canReadTicketsAll(userId);

            let allMembers: any[] = [];

            if (channelID === '1') {
                // Public channel: all users are members
                allMembers = await prisma.user.findMany({
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        displayUsername: true,
                        image: true,
                        role: true,
                    }
                });
            } else {
                // Ticket channel: assigned user + all volunteers with read access
                const ticket = await prisma.ticket.findUnique({
                    where: {channelId: channelID},
                });

                if (!ticket) return reply.send({success: true, members: []});

                // Check access
                if (!canReadAll && ticket.assignedUserId !== userId) {
                    return reply.status(403).send('forbidden');
                }

                // Get assigned user
                if (ticket.assignedUserId) {
                    const assigned = await prisma.user.findUnique({
                        where: {id: ticket.assignedUserId},
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            displayUsername: true,
                            image: true,
                            role: true,
                        }
                    });
                    if (assigned) allMembers.push(assigned);
                }

                const staff = await prisma.user.findMany({
                    where: {
                        // Every member with a role other than the default one (role names are configurable)
                        AND: [
                            {role: {not: null}},
                            {role: {notIn: ['', 'none']}},
                            {OR: [{banned: null}, {banned: false}]},
                        ]
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        displayUsername: true,
                        image: true,
                        role: true,
                    }
                });

                // Merge and deduplicate
                const staffIds = new Set(allMembers.map(m => m.id));
                for (const s of staff) {
                    if (!staffIds.has(s.id)) {
                        allMembers.push(s);
                    }
                }
            }

            // Normalize for frontend
            const members = allMembers.map(u => ({
                id: u.id,
                username: u.displayUsername || u.name || u.username || 'User',
                image: u.image,
                role: u.role,
            }));

            return reply.send({success: true, members});
        } catch (e) {
            console.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // GET /v1/channel/:id/read – get last read timestamp

    app.get('/v1/channel/:id/read', async (req, reply) => {
        try {
            const {id: channelId} = req.params as any;
            const userId = await deps.authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');
            if (typeof channelId !== 'string' || !(await canRead(userId, channelId))) return reply.status(403).send('forbidden');

            const read = await prisma.userChannelRead.findUnique({
                where: {
                    userId_channelId: {
                        userId,
                        channelId,
                    },
                },
            });

            return reply.send({lastRead: read?.lastRead || null});
        } catch (e) {
            console.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // POST /v1/channel/:id/read – mark channel as read
    app.post('/v1/channel/:id/read', async (req, reply) => {
        try {
            const {id: channelId} = req.params as any;
            const userId = await deps.authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');
            if (typeof channelId !== 'string' || !(await canRead(userId, channelId))) return reply.status(403).send('forbidden');

            const channel = await prisma.channel.findUnique({where: {id: channelId}});
            if (!channel) return reply.status(404).send({error: 'not_found'});

            await prisma.userChannelRead.upsert({
                where: {
                    userId_channelId: {
                        userId,
                        channelId,
                    },
                },
                update: {
                    lastRead: new Date(),
                },
                create: {
                    userId,
                    channelId,
                    lastRead: new Date(),
                },
            });

            await broadcast(null, 'channelRead', {userId, channelId});

            return reply.send({success: true});
        } catch (e) {
            console.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}
