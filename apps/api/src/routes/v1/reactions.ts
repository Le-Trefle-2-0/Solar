import type {FastifyInstance} from 'fastify';
import {APP_URL} from '../../env';

export async function registerReactionsRoutes(app: FastifyInstance) {
    // Proxy reaction operations to the web app for now
    app.post('/v1/reaction', async (req, reply) => {
        const res = await fetch(`${APP_URL}/api/reaction`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        let data: any = {};
        try {
            data = await res.json();
        } catch {
        }
        return reply.status(res.status).send(data);
    });
}
