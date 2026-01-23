import { prisma } from '../../prisma.js';
import { authenticate } from '../../auth.js';
export async function registerMessagesRoutes(app) {
    // Read messages by channel with basic pagination
    app.get('/v1/messages/:channelId', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId)
            return reply.status(401).send('unauthorized');
        const { channelId } = req.params;
        const { limit: limitStr, before: beforeStr } = req.query;
        const limit = Math.max(1, Math.min(100, limitStr ? parseInt(String(limitStr), 10) : 60));
        const before = beforeStr ? new Date(parseInt(String(beforeStr), 10)) : undefined;
        const where = before ? { channelId, createdAt: { lt: before } } : { channelId };
        const raw = await prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        const out = [];
        for (const msg of raw) {
            const user = await prisma.user.findUnique({ where: { id: msg.userId } });
            const reactions = await prisma.reaction.findMany({ where: { messageID: msg.id } });
            if (user) {
                const contentBuffer = msg.content;
                const content = Buffer.isBuffer(contentBuffer)
                    ? contentBuffer.toString('utf8')
                    : Buffer.from(new Uint8Array(Object.values(contentBuffer ?? {}))).toString('utf8');
                out.push({
                    id: msg.id,
                    author: {
                        id: user.id,
                        image: user.image,
                        name: (user.displayUsername || user.name),
                        role: user.role,
                    },
                    content,
                    timestamp: new Date(msg.createdAt).getTime(),
                    channel: { id: channelId },
                    discordID: msg.discordID,
                    reactions,
                    replyID: msg.replyID ?? null,
                    edited: msg.edited,
                });
            }
        }
        return out.reverse();
    });
}
