import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {z} from "zod";

async function checkAuth(req: any, reply: any) {
    const userId = await authenticate(req);
    if (!userId) {
        reply.status(401).send('unauthorized');
        return null;
    }
    return userId;
}

async function hasManagePermission(userId: string) {
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) return false;
    const roles = (user.role || '').toLowerCase().split(',').map(r => r.trim());
    return roles.some(role => role === 'admin' || role === 'moderator' || role === 'owner' || role === 'manager');
}

export async function registerMessageRoutes(app: FastifyInstance) {
    app.post('/v1/messages', async (req, reply) => {
        const userId = await checkAuth(req, reply);
        if (!userId) return;

        const bodySchema = z.object({
            channelId: z.string().min(1),
            content: z.string().min(1).max(2000),
            discordID: z.string().optional().nullable(),
            replyID: z.number().optional().nullable(),
        });

        try {
            const body = bodySchema.parse(req.body);
            const user = await prisma.user.findUnique({where: {id: userId}});
            if (!user) return reply.status(404).send({success: false, error: 'User not found'});

            const message = await prisma.message.create({
                data: {
                    userId,
                    channelId: body.channelId,
                    content: Buffer.from(body.content, 'utf8'),
                    discordID: body.discordID || undefined,
                    replyID: body.replyID || undefined,
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
            return reply.status(500).send({success: false, error: String(e)});
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
        const newContent = body.content;
        if (typeof newContent !== 'string' || newContent.trim().length === 0 || newContent.length > 2000) {
            return reply.status(400).send({success: false, error: 'Invalid content'});
        }

        const message = await prisma.message.findUnique({where: {id: messageIdNum}});
        if (!message) return reply.status(404).send({success: false, error: 'Not found'});

        let authorized = message.userId === userId;
        if (!authorized) {
            authorized = await hasManagePermission(userId);
        }

        if (!authorized) return reply.status(403).send({success: false, error: 'Forbidden'});

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
