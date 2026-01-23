import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

export async function registerAuthRoutes(app: FastifyInstance) {
    app.get('/v1/auth/get-session', async (req, reply) => {
        const userId = await authenticate(req);

        if (!userId) {
            return reply.status(401).send({session: null});
        }

        const user = await prisma.user.findUnique({where: {id: userId}});
        if (!user) {
            return reply.status(401).send({session: null});
        }

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                // Add any other fields needed by the frontend
            }
        };
    });
}
