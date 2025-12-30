import { prisma } from '../../prisma.js';
import { authenticate } from '../../auth.js';
async function checkAdmin(req, reply) {
    const userId = await authenticate(req);
    if (!userId) {
        return reply.status(401).send('unauthorized');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
        return reply.status(401).send('unauthorized');
    }
    return user;
}
export async function registerAdminRoutes(app) {
    app.post('/v1/admin/users/:id/role', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin)
            return;
        const { id } = req.params;
        const { roles } = (req.body ?? {});
        if (!Array.isArray(roles)) {
            return reply.status(400).send('Invalid roles');
        }
        const user = await prisma.user.update({
            where: { id },
            data: {
                role: roles.join(',')
            }
        });
        return reply.send({ user });
    });
}
