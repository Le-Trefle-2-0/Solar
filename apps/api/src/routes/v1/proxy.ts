import type {FastifyInstance} from 'fastify';
import {APP_URL} from '../../env';
import {prisma} from '../../prisma';

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
    // Note: Better Auth now lives in the web app. Since there is no upstream
    // /api/permissions/messages/manage route anymore, we handle this endpoint
    // directly here to avoid 404s and keep the chat component working.
    // We infer permissions from the Better Auth session token provided by the
    // web app via Authorization: Bearer <token>. If the session resolves to a
    // user with an elevated role, we allow managing messages.
    app.get('/v1/permissions/messages/manage', async (req) => {
        try {
            const auth = req.headers['authorization'] || '';
            const bearer = Array.isArray(auth) ? auth[0] : auth;
            const token = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : '';

            if (!token) {
                return {canManage: false};
            }

            // Look up Better Auth session by token and fetch the related user
            const session = await prisma.session.findUnique({where: {token}});
            if (!session) {
                return {canManage: false};
            }

            const user = await prisma.user.findUnique({where: {id: session.userId}});
            const role = (user?.role || '').toLowerCase();
            const canManage = role === 'admin' || role === 'moderator' || role === 'owner';
            return {canManage};
        } catch {
            // On any error, default to safest behavior
            return {canManage: false};
        }
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
