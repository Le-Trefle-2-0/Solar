import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';

export async function registerReactionsRoutes(app: FastifyInstance) {
    app.post('/v1/reaction', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const reactionSchema = z.object({
            id: z.string().optional(),
            messageID: z.number(),
            authorID: z.string(),
            reaction: z.string(),
            option: z.string(),
        });

        try {
            const body = reactionSchema.parse(req.body);
            if (body.option === "add") {
                const reaction = await prisma.reaction.create({
                    data: {
                        messageID: body.messageID,
                        userID: body.authorID,
                        emoji: body.reaction
                    }
                });

                // Get message to know the channel for broadcast
                const message = await prisma.message.findUnique({where: {id: body.messageID}});
                if (message) {
                    await broadcast(message.channelId, 'reactionAdd', {
                        messageID: body.messageID,
                        reaction
                    });
                }

                return reply.send({success: true, reaction});
            } else if (body.option === "remove") {
                const reaction = await prisma.reaction.delete({
                    where: {
                        id: body.id,
                        userID: body.authorID
                    }
                });

                const message = await prisma.message.findUnique({where: {id: body.messageID}});
                if (message) {
                    await broadcast(message.channelId, 'reactionRemove', {
                        messageID: body.messageID,
                        reactionID: body.id
                    });
                }

                return reply.send({success: true, reaction});
            } else {
                return reply.status(400).send({success: false, error: "Bad request"});
            }
        } catch (e) {
            if (e instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: e.flatten()});
            }
            return reply.status(500).send({success: false, error: String(e)});
        }
    });
}
