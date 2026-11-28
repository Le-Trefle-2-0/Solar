import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {getChannelAccess} from '../../lib/channelAccess.js';
import {isTicketWritable} from '../../lib/ticketWrites.js';

export async function registerReactionsRoutes(app: FastifyInstance) {
    app.post('/v1/reaction', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const reactionSchema = z.object({
            id: z.string().max(64).optional(),
            messageID: z.number().int().positive(),
            emoji: z.string().min(1).max(32),
            option: z.enum(['add', 'remove']),
        });

        try {
            const body = reactionSchema.parse(req.body);
            // Reacting writes to the message's channel: same rule as posting (#217)
            const target = await prisma.message.findUnique({
                where: {id: body.messageID},
                select: {channelId: true, ticket: {select: {statusName: true}}},
            });
            if (!target?.channelId) return reply.status(404).send({success: false, error: 'not_found'});
            if (!(await getChannelAccess(userId, target.channelId)).write) {
                return reply.status(403).send({success: false, error: 'forbidden'});
            }
            // A closed écoute's transcript is final (#266)
            if (!isTicketWritable(target.ticket)) return reply.status(409).send({success: false, error: 'ticket_closed'});
            if (body.option === "add") {
                // One reaction per person, emoji and message (#167)
                const existing = await prisma.reaction.findFirst({
                    where: {messageID: body.messageID, userID: userId, emoji: body.emoji},
                });
                if (existing) return reply.send({success: true, reaction: existing, duplicate: true});
                const reaction = await prisma.reaction.create({
                    data: {
                        messageID: body.messageID,
                        userID: userId,
                        emoji: body.emoji
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
                // Only one's own reaction, on that message: without an id, or for a reaction already
                // gone, this used to fail with a 500 (and the event named whatever message was sent)
                if (!body.id) return reply.status(400).send({success: false, error: 'id_required'});
                const {count} = await prisma.reaction.deleteMany({
                    where: {id: body.id, userID: userId, messageID: body.messageID},
                });
                if (!count) return reply.status(404).send({success: false, error: 'not_found'});

                await broadcast(target.channelId, 'reactionRemove', {
                    messageID: body.messageID,
                    reactionID: body.id
                });

                return reply.send({success: true, reaction: {id: body.id}});
            } else {
                return reply.status(400).send({success: false, error: "Bad request"});
            }
        } catch (e) {
            if (e instanceof z.ZodError) {
                return reply.status(400).send({success: false, error: e.flatten()});
            }
            req.log.error(e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}
