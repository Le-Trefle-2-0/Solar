import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

import {getActor} from '../../lib/permissions.js';

export async function registerAuthRoutes(app: FastifyInstance) {
    app.get('/v1/auth/get-session', async (req, reply) => {
        const userId = await authenticate(req);

        if (!userId) {
            return reply.status(401).send({session: null});
        }

        const [user, actor] = await Promise.all([
            prisma.user.findUnique({where: {id: userId}}),
            getActor(userId),
        ]);
        if (!user || !actor) {
            return reply.status(401).send({session: null});
        }

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                // Effective permissions (the owner holds them all) for UI gating; the API re-checks
                permissions: actor.permissions,
                isOwner: actor.isOwner,
            }
        };
    });

    app.get('/v1/auth/permissions', async (req, reply) => {
        const userId = await authenticate(req);

        if (!userId) {
            return reply.status(401).send({permissions: []});
        }

        const actor = await getActor(userId);
        return {permissions: actor?.permissions ?? [], isOwner: actor?.isOwner ?? false};
    });
}
