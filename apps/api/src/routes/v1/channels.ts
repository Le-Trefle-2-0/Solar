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
}
