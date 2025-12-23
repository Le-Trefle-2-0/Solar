import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma';
import {verifyAuthorizationHeader} from '../../auth';
import {createHash} from 'crypto';

function roleHasTicketsReadAll(role?: string | null): boolean {
    const allowed = new Set(['admin', 'manager', 'training', 'bot']);
    return !!role && allowed.has(role);
}

async function broadcastStatusUpdate(channelId: string, statusId: number, statusName: string) {
    try {
        let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
        if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
        if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);
        const secret = process.env.WS_BROADCAST_SECRET || 'fallback_broadcast_secret_for_dev_only';

        // 1. Notify current room of the status change
        await fetch(`${base}/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-ws-secret': secret,
            },
            body: JSON.stringify({
                room: channelId,
                event: 'ticketStatusUpdate',
                data: {channelId, statusId, statusName}
            }),
        }).catch(() => {
        });

        // 2. Trigger global sidebar refresh
        await fetch(`${base}/broadcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-ws-secret': secret,
            },
            body: JSON.stringify({
                event: 'updateRequest',
                data: {channelId}
            }),
        }).catch(() => {
        });
    } catch (err) {
        console.warn('[api] Failed to broadcast status update:', err);
    }
}

export async function registerTicketsRoutes(app: FastifyInstance) {
    // GET /v1/tickets – list tickets depending on auth
    app.get('/v1/tickets', async (req, reply) => {
        // Try JWT first
        const jwt = await verifyAuthorizationHeader(req.headers.authorization);

        let userId: string | undefined;
        if (jwt) userId = (jwt.sub as string) || (jwt as any).userId;

        // If no JWT, check API key via header `token`
        if (!userId) {
            const token = (req.headers['token'] as string) || '';
            if (!token) return reply.status(401).send('unauthorized');
            const key = await prisma.apikey.findFirst({where: {key: token}});
            if (!key || key.enabled === false || (key.expiresAt && key.expiresAt <= new Date())) {
                return reply.status(401).send('unauthorized');
            }
            // API key path does not bind to a user; allow read_all behavior
            // by default for API keys owned by users with privileged roles
            userId = key.userId;
        }

        const user = userId ? await prisma.user.findUnique({where: {id: userId}}) : null;
        const canReadAll = roleHasTicketsReadAll(user?.role ?? null);

        if (!canReadAll && !userId) return reply.status(401).send('unauthorized');

        if (!canReadAll) {
            const tickets = await prisma.ticket.findMany({
                where: {
                    assignedUserId: userId,
                    statusName: {in: ['started', 'closed']},
                },
            });
            return reply.send({success: true, tickets});
        }

        const tickets = await prisma.ticket.findMany({
            where: {statusName: {in: ['waiting', 'started', 'closed']}},
        });
        return reply.send({success: true, tickets});
    });

    // POST /v1/tickets/assign
    app.post('/v1/tickets/assign', async (req, reply) => {
        const bodySchema = z.object({ticketID: z.number(), assignmentID: z.string()});
        try {
            const {ticketID, assignmentID} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {id: ticketID}});
            if (!ticket) return reply.status(400).send('Ticket not found');
            const user = await prisma.user.findUnique({where: {id: assignmentID}});
            if (!user) return reply.status(400).send('User not found');
            const status = await prisma.ticketStatus.findUnique({where: {name: 'started'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});
            const update = await prisma.ticket.update({
                where: {id: ticketID},
                include: {status: true},
                data: {
                    assignedUserId: user.id,
                    updatedAt: new Date(),
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });
            await broadcastStatusUpdate(ticket.channelId as string, status.id, status.name);
            return reply.send({success: true, update});
        } catch (err) {
            if (err instanceof z.ZodError) return reply.status(400).send({success: false, errors: err.flatten()});
            return reply.status(500).send({success: false, message: 'Internal server error'});
        }
    });

    // POST /v1/tickets/close
    app.post('/v1/tickets/close', async (req, reply) => {
        const bodySchema = z.object({channelID: z.string()});
        try {
            const {channelID} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {channelId: channelID}});
            if (!ticket) return reply.status(400).send('No ticket found');
            const status = await prisma.ticketStatus.findUnique({where: {name: 'closed'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});
            const update = await prisma.ticket.update({
                where: {id: ticket.id},
                include: {status: true},
                data: {
                    statusName: status.name,
                    statusLabel: status.label,
                    discordUserID: createHash('sha256').update(ticket.discordUserID).digest('hex'),
                },
            });
            await broadcastStatusUpdate(channelID, status.id, status.name);
            return reply.send({success: true, update});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            return reply.status(400).send({success: false, error: String(e)});
        }
    });

    // POST /v1/tickets/transmission
    app.post('/v1/tickets/transmission', async (req, reply) => {
        const bodySchema = z.object({
            channelID: z.string(),
            problematic: z.string(),
            observations: z.string(),
            info: z.string().optional(),
        });
        try {
            const {channelID, problematic, observations, info} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {channelId: channelID}});
            if (!ticket) return reply.status(400).send({success: false, error: 'No ticket found'});
            const status = await prisma.ticketStatus.findUnique({where: {name: 'commented'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});
            const update = await prisma.ticket.update({
                where: {id: ticket.id},
                include: {status: true},
                data: {
                    problematic,
                    observations,
                    info,
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });
            await broadcastStatusUpdate(channelID, status.id, status.name);
            return reply.send({success: true, update});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            return reply.status(500).send({success: false, error: String(e)});
        }
    });

    // POST /v1/tickets/create
    app.post('/v1/tickets/create', async (req, reply) => {
        const bodySchema = z.object({
            discordUserID: z.string(),
            token: z.string(),
            source: z.string().optional(),
            metadata: z.any().optional(),
        });
        try {
            const {discordUserID, token, source, metadata} = bodySchema.parse((req.body ?? {}) as any);
            // Validate API key
            const key = await prisma.apikey.findFirst({where: {key: token}});
            if (!key || key.enabled === false || (key.expiresAt && key.expiresAt <= new Date())) {
                return reply.status(401).send('Unauthorized');
            }
            const hasTicket = await prisma.ticket.findFirst({where: {discordUserID}});
            if (hasTicket) return reply.status(401).send({success: false, error: 'User already has an open ticket'});

            const status = await prisma.ticketStatus.findUnique({where: {name: 'waiting'}});
            if (!status) return reply.status(500).send({success: false, error: 'status_missing'});

            const ticket = await prisma.ticket.create({
                data: {
                    discordUserID,
                    source: source || 'discord',
                    metadata: metadata || {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    statusName: status.name,
                    statusLabel: status.label,
                },
            });

            // Compute channel name: Ticket-00001 style
            let channelName = String(ticket.id);
            while (channelName.length < 5) channelName = '0' + channelName;
            channelName = 'Ticket-' + channelName;

            const channel = await prisma.channel.create({data: {name: channelName}});

            const updatedTicket = await prisma.ticket.update({
                where: {id: ticket.id},
                data: {
                    updatedAt: new Date(),
                    channelName: channel.name,
                    channelId: channel.id,
                },
            });

            return reply.send({success: true, ticket: updatedTicket});
        } catch (err) {
            if (err instanceof z.ZodError) return reply.status(400).send({success: false, errors: err.flatten()});
            return reply.status(500).send({success: false, message: 'Internal server error'});
        }
    });

    // POST /v1/tickets/findBy/channelID
    app.post('/v1/tickets/findBy/channelID', async (req, reply) => {
        const bodySchema = z.object({channelID: z.string()});
        try {
            const {channelID} = bodySchema.parse((req.body ?? {}) as any);
            const ticket = await prisma.ticket.findUnique({where: {channelId: channelID}});
            if (!ticket) return reply.status(400).send('No ticket found');
            return reply.send({success: true, ticket});
        } catch (e) {
            if (e instanceof z.ZodError) return reply.status(400).send({success: false, error: e.flatten()});
            return reply.status(500).send({success: false, error: String(e)});
        }
    });
}
