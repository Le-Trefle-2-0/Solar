import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

function roleHasTicketsReadAll(role?: string | null): boolean {
    if (!role) return false;
    const allowed = new Set(['admin', 'manager', 'training', 'bot']);
    const roles = role.split(',').map(r => r.trim().toLowerCase());
    return roles.some(r => allowed.has(r));
}

export async function registerChannelsRoutes(app: FastifyInstance) {
    const bodySchema = z.object({id: z.string().min(1)});

    // POST /v1/channels – returns channels the user can access
    app.post('/v1/channels', async (req, reply) => {
        try {
            const userId = await authenticate(req);
            if (!userId) return reply.status(401).send('unauthorized');

            const channels = await prisma.channel.findMany();
            const user = await prisma.user.findUnique({where: {id: userId}});
            const canReadAll = roleHasTicketsReadAll(user?.role ?? null);

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

            const user = await prisma.user.findUnique({where: {id: userId}});
            const canReadAll = roleHasTicketsReadAll(user?.role ?? null);

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
