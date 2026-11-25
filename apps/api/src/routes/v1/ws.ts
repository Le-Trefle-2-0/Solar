import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {verifyWidgetSession} from '../../lib/widgetSession.js';

export interface WsRouteDeps {
    findTicketByChannelId: (channelId: string) => Promise<{statusName: string} | null>;
}

const defaultDeps: WsRouteDeps = {
    findTicketByChannelId: (channelId) => prisma.ticket.findUnique({where: {channelId}}),
};

export async function registerWsRoutes(app: FastifyInstance, deps: WsRouteDeps = defaultDeps) {
    // Returns WS credentials only for the channel of the caller's signed widget session,
    // while its ticket is still open. Nothing from the request body is ever signed.
    app.post('/v1/ws/guest', async (req, reply) => {
        try {
            const session = verifyWidgetSession(req.cookies);
            if (!session) return reply.status(401).send({success: false, error: 'unauthorized'});

            const {channelId} = (req.body ?? {}) as {channelId?: string};
            if (channelId !== session.channelId) {
                return reply.status(403).send({success: false, error: 'forbidden'});
            }

            const ticket = await deps.findTicketByChannelId(session.channelId);
            if (!ticket || !['waiting', 'started'].includes(ticket.statusName)) {
                return reply.status(403).send({success: false, error: 'forbidden'});
            }

            return reply.send({success: true, credentials: session});
        } catch (e) {
            console.error('[ws] guest credentials error:', e);
            return reply.status(500).send({success: false, error: 'internal_error'});
        }
    });
}
