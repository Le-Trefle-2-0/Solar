import { prisma } from '../../prisma.js';
import { authenticate } from '../../auth.js';
export async function registerUsersRoutes(app) {
    app.get('/v1/users/:id', async (req, reply) => {
        const userId = await authenticate(req);
        if (!userId)
            return reply.status(401).send('unauthorized');
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user)
            return reply.status(404).send({ error: 'not_found' });
        return user;
    });
}
