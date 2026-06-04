import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

import {getUserPermissions, hasPermission} from '../../lib/permissions.js';

async function canReadTicketsAll(userId: string): Promise<boolean> {
    const perms = await getUserPermissions(userId);
    return hasPermission(perms, 'tickets.read_all');
}

export async function registerChannelsRoutes(app: FastifyInstance) {
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
                    else if (ticket.assignedUserId === userId) accessed.push(channel);
                }
            }
            return reply.send({success: true, accessedChannels: accessed});
        } catch (e) {
            if (e instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: e.flatten?.() ?? String(e)});
            }
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    // GET /v1/channel/:id – channel info
    app.get('/v1/channel/:id', async (req, reply) => {
        const {id} = req.params as any;
        const channel = await prisma.channel.findUnique({where: {id}});
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
                        OR: [
                            {role: {contains: 'admin'}},
                            {role: {contains: 'manager'}},
                            {role: {contains: 'volunteer'}},
                            {role: {contains: 'training'}},
                            {role: {contains: 'bot'}},
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
}
