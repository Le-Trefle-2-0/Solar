import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

export async function registerMessagesRoutes(app: FastifyInstance) {
    // Read messages by channel with basic pagination
    app.get('/v1/messages/:channelId', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const {channelId} = req.params as any;
        const {limit: limitStr, before: beforeStr} = req.query as any;
        const limit = Math.max(1, Math.min(100, limitStr ? parseInt(String(limitStr), 10) : 60));
        const before = beforeStr ? new Date(parseInt(String(beforeStr), 10)) : undefined;

        const where: any = before ? {channelId, createdAt: {lt: before}} : {channelId};
        let raw = await prisma.message.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            take: limit,
        });

        // Fallback for cases where channelId might be stored as numeric ID in some contexts (legacy or error)
        if (raw.length === 0 && /^\d+$/.test(channelId)) {
            const ticket = await prisma.ticket.findUnique({where: {id: parseInt(channelId, 10)}});
            if (ticket && ticket.channelId && ticket.channelId !== channelId) {
                console.log('[API] Falling back to real channelId for messages:', ticket.channelId);
                raw = await prisma.message.findMany({
                    where: before ? {
                        channelId: ticket.channelId,
                        createdAt: {lt: before}
                    } : {channelId: ticket.channelId},
                    orderBy: {createdAt: 'desc'},
                    take: limit,
                });
            }
        }

        const out: any[] = [];
        for (const msg of raw) {
            let user = null;
            if (msg.userId) {
                user = await prisma.user.findUnique({where: {id: msg.userId}});
            }
            const reactions = await prisma.reaction.findMany({where: {messageID: msg.id}});

            const contentBuffer: any = (msg as any).content as any;
            let content = "";
            if (contentBuffer) {
                if (Buffer.isBuffer(contentBuffer)) {
                    content = contentBuffer.toString('utf8');
                } else if (typeof contentBuffer === 'object') {
                    content = Buffer.from(new Uint8Array(Object.values(contentBuffer))).toString('utf8');
                } else {
                    content = String(contentBuffer);
                }
            }

            out.push({
                id: msg.id,
                author: {
                    id: user?.id ?? (msg.userId || 'guest'),
                    image: user?.image ?? null,
                    name: user ? (user.displayUsername || user.name) : (msg.userId?.startsWith('guest_') ? 'utilisateur' : (msg.userId ? 'Admin' : 'utilisateur')),
                    role: user?.role ?? null,
                },
                content,
                timestamp: new Date(msg.createdAt).getTime(),
                channel: {id: channelId},
                discordID: (msg as any).discordID,
                reactions,
                replyID: (msg as any).replyID ?? null,
                edited: (msg as any).edited,
            });
        }
        return out.reverse();
    });
}

