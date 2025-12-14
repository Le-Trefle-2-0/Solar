import type {FastifyInstance} from 'fastify';
import {APP_URL} from '../../env';

export async function registerMessageRoutes(app: FastifyInstance) {
    // Proxy DELETE and PUT for message operations to the existing web endpoints
    app.delete('/v1/message/:id', async (req, reply) => {
        const {id} = req.params as any;
        const res = await fetch(`${APP_URL}/api/message/${id}`, {
            method: 'DELETE',
            headers: {'content-type': 'application/json'}
        });
        const data = await res.json().catch(() => ({}));
        return reply.status(res.status).send(data);
    });

    app.put('/v1/message/:id', async (req, reply) => {
        const {id} = req.params as any;
        const res = await fetch(`${APP_URL}/api/message/${id}`, {
            method: 'PUT',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        const data = await res.json().catch(() => ({}));
        return reply.status(res.status).send(data);
    });
}
