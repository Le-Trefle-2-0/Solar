import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma';

export async function registerUsersRoutes(app: FastifyInstance) {
    app.get('/v1/users/:id', async (req, reply) => {
        const {id} = req.params as any;
        const user = await prisma.user.findUnique({where: {id}});
        if (!user) return reply.status(404).send({error: 'not_found'});
        return user;
    });
}
