import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {z} from "zod";

import {getUserPermissions, hasPermission} from '../../lib/permissions.js';
import {neutralizeHtml} from '../../lib/sanitize.js';
import {getChannelAccess} from '../../lib/channelAccess.js';
import {isTicketWritable} from '../../lib/ticketWrites.js';

async function checkAuth(req: any, reply: any) {
    const userId = await authenticate(req);
    if (!userId) {
        reply.status(401).send('unauthorized');
        return null;
    }
    return userId;
}

async function hasManagePermission(userId: string) {
    const perms = await getUserPermissions(userId);
    return hasPermission(perms, 'messages.manage');
}

/** The écoute a message belongs to is still open (#266). */
async function messageWritable(ticketId: number | null): Promise<boolean> {
    if (!ticketId) return true;
    return isTicketWritable(await prisma.ticket.findUnique({where: {id: ticketId}, select: {statusName: true}}));
}

export async function registerMessageRoutes(app: FastifyInstance) {
    app.post('/v1/messages', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const bodySchema = z.object({
            channelId: z.string().min(1).max(64),
            content: z.string().min(1).max(2000),
            // Accepted for older clients, never stored: only the bot links a message to Discord
            discordID: z.string().optional().nullable(),
            replyID: z.number().int().positive().optional().nullable(),
        });

        try {
            const body = bodySchema.parse(req.body);
            // Same rule as reading, for writing (#217)
            if (!(await getChannelAccess(userId, body.channelId)).write) {
                return reply.status(403).send({success: false, error: 'forbidden'});
            }
            body.content = neutralizeHtml(body.content);
            const user = await prisma.user.findUnique({where: {id: userId}});
            if (!user) return reply.status(404).send({success: false, error: 'User not found'});

            const ticket = await prisma.ticket.findFirst({
                where: {channelId: body.channelId}
            });
            if (!isTicketWritable(ticket)) return reply.status(409).send({success: false, error: 'ticket_closed'});

            // A reply quotes a message of the same channel only
            const replyID = body.replyID
                ? (await prisma.message.findFirst({where: {id: body.replyID, channelId: body.channelId}, select: {id: true}}))?.id
                : undefined;

            const message = await prisma.message.create({
                data: {
                    userId,
                    channelId: body.channelId,
                    ticketId: ticket?.id,
                    content: Buffer.from(body.content, 'utf8'),
                    replyID,
                    createdAt: new Date(),
                }
            });

            const messageData = {
                id: message.id,
                author: {
                    id: user.id,
                    image: user.image,
                    name: (user.displayUsername || user.name) as string,
                    role: user.role,
                },
                content: body.content,
                timestamp: message.createdAt.getTime(),
                channel: {id: body.channelId},
                discordID: message.discordID,
                reactions: [],
                replyID: message.replyID ?? null,
                edited: message.edited,
            };

            await broadcast(body.channelId, 'message', messageData);

            return reply.send({success: true, message: messageData});
        } catch (e) {
            if (e instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: e.flatten()});
            }
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });

    app.delete('/v1/message/:id', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        const messageIdNum = Number(id);
        if (Number.isNaN(messageIdNum)) {
            return reply.status(400).send({success: false, error: 'Invalid id'});
        }

        const message = await prisma.message.findUnique({where: {id: messageIdNum}});
        if (!message) return reply.status(404).send({success: false, error: 'Not found'});

        let authorized = message.userId === userId;
        if (!authorized) {
            authorized = await hasManagePermission(userId);
        }

        if (!authorized) return reply.status(403).send({success: false, error: 'Forbidden'});
        if (!(await messageWritable(message.ticketId))) return reply.status(409).send({success: false, error: 'ticket_closed'});

        await prisma.reaction.deleteMany({where: {messageID: messageIdNum}});
        await prisma.message.delete({where: {id: messageIdNum}});

        await broadcast(message.channelId, 'messageDelete', {messageID: messageIdNum});

        return reply.send({success: true, id: messageIdNum});
    });

    app.put('/v1/message/:id', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const {id} = req.params as { id: string };
        const messageIdNum = Number(id);
        if (Number.isNaN(messageIdNum)) {
            return reply.status(400).send({success: false, error: 'Invalid id'});
        }

        const body = (req.body ?? {}) as { content?: string };
        if (typeof body.content !== 'string' || body.content.trim().length === 0 || body.content.length > 2000) {
            return reply.status(400).send({success: false, error: 'Invalid content'});
        }
        const newContent = neutralizeHtml(body.content);

        const message = await prisma.message.findUnique({where: {id: messageIdNum}});
        if (!message) return reply.status(404).send({success: false, error: 'Not found'});

        let authorized = message.userId === userId;
        if (!authorized) {
            authorized = await hasManagePermission(userId);
        }

        if (!authorized) return reply.status(403).send({success: false, error: 'Forbidden'});
        if (!(await messageWritable(message.ticketId))) return reply.status(409).send({success: false, error: 'ticket_closed'});

        const updated = await prisma.message.update({
            where: {id: messageIdNum},
            data: {
                content: Buffer.from(newContent, 'utf8'),
                edited: true,
            }
        });

        await broadcast(updated.channelId, 'messageEdit', {messageID: messageIdNum, content: newContent, edited: true});

        return reply.send({success: true, id: messageIdNum, content: newContent, edited: true});
    });
}
