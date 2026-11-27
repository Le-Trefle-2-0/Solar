import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions} from '../../lib/permissions.js';
import {canReadChannel, describeChannel, isPermanenceChannel} from '../../lib/channelAccess.js';
import {neutralizeHtml} from '../../lib/sanitize.js';

export interface MessagesRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getPermissions: (userId: string) => Promise<string[]>;
    findTicketByChannelId: (channelId: string) => Promise<{assignedUserId: string | null} | null>;
    isPermanenceChannel: (channelId: string) => Promise<boolean>;
    findMessages: (where: {channelId: string; createdAt?: {lt: Date}}, take: number) => Promise<any[]>;
}

const defaultDeps: MessagesRouteDeps = {
    authenticate,
    getPermissions: getUserPermissions,
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({where: {channelId}}),
    isPermanenceChannel,
    findMessages: (where, take) => prisma.message.findMany({where, orderBy: {createdAt: 'desc'}, take}),
};

export async function registerMessagesRoutes(app: FastifyInstance, deps: MessagesRouteDeps = defaultDeps) {
    // Read messages by channel with basic pagination
    app.get('/v1/messages/:channelId', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const {channelId} = req.params as any;

        // Shared channel rule: open channels (public, permanences), tickets.read_all, or assigned
        if (typeof channelId !== 'string') return reply.status(400).send('invalid channel');
        const channel = await describeChannel(channelId, deps.findTicketByChannelId, deps.isPermanenceChannel);
        if (!canReadChannel({channelId, userId, permissions: await deps.getPermissions(userId), ...channel})) {
            return reply.status(403).send('forbidden');
        }

        const {limit: limitStr, before: beforeStr} = req.query as any;
        const limit = Math.max(1, Math.min(100, limitStr ? parseInt(String(limitStr), 10) : 60));
        const before = beforeStr ? new Date(parseInt(String(beforeStr), 10)) : undefined;

        const where: any = before ? {channelId, createdAt: {lt: before}} : {channelId};
        const raw = await deps.findMessages(where, limit);

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
                // Also covers messages stored before sanitisation
                content: neutralizeHtml(content),
                timestamp: new Date(msg.createdAt).getTime(),
                channel: {id: channelId},
                discordID: (msg as any).discordID,
                reactions,
                replyID: (msg as any).replyID ?? null,
                edited: (msg as any).edited,
                // Discord écoutes: the bot could not deliver it to the user (#298)
                undelivered: !!(msg as any).relayFailed,
                // Team note (identity revealed…): shown apart in the transcript
                internal: !!(msg as any).internal,
            });
        }
        return out.reverse();
    });
}

