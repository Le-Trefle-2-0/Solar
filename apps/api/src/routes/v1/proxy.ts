import type {FastifyInstance} from 'fastify';
import {APP_URL} from '../../env';

async function forwardJson(path: string, init?: RequestInit) {
    const res = await fetch(`${APP_URL}${path}`, init);
    let data: any = undefined;
    try {
        data = await res.json();
    } catch {
        data = undefined;
    }
    return {status: res.status, data};
}

export async function registerProxyRoutes(app: FastifyInstance) {
    // Events
    app.get('/v1/events', async (req, reply) => {
        const {status, data} = await forwardJson('/api/events');
        return reply.status(status).send(data);
    });
    app.post('/v1/events', async (req, reply) => {
        const {status, data} = await forwardJson('/api/events', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        return reply.status(status).send(data);
    });
    app.get('/v1/events/getAvailable', async (req, reply) => {
        const qs = (req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '');
        const {status, data} = await forwardJson(`/api/events/getAvailable${qs}`);
        return reply.status(status).send(data);
    });
    app.get('/v1/events/:id', async (req, reply) => {
        const {id} = req.params as any;
        const {status, data} = await forwardJson(`/api/events/${id}`);
        return reply.status(status).send(data);
    });
    app.post('/v1/events/:id', async (req, reply) => {
        const {id} = req.params as any;
        const {status, data} = await forwardJson(`/api/events/${id}`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        return reply.status(status).send(data);
    });
    app.put('/v1/events/:id', async (req, reply) => {
        const {id} = req.params as any;
        const {status, data} = await forwardJson(`/api/events/${id}`, {
            method: 'PUT',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        return reply.status(status).send(data);
    });
    app.delete('/v1/events/:id', async (req, reply) => {
        const {id} = req.params as any;
        const {status, data} = await forwardJson(`/api/events/${id}`, {method: 'DELETE'});
        return reply.status(status).send(data);
    });

    // Permissions
    app.get('/v1/permissions/messages/manage', async (_req, reply) => {
        const {status, data} = await forwardJson('/api/permissions/messages/manage');
        return reply.status(status).send(data);
    });

    // Admin role update
    app.post('/v1/admin/users/:id/role', async (req, reply) => {
        const {id} = req.params as any;
        const {status, data} = await forwardJson(`/api/admin/users/${id}/role`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(req.body ?? {}),
        });
        return reply.status(status).send(data);
    });
}
