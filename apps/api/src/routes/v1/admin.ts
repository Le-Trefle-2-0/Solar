import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

async function checkAdmin(req: any, reply: any) {
    const userId = await authenticate(req);

    if (!userId) {
        return reply.status(401).send('unauthorized');
    }

    const user = await prisma.user.findUnique({where: {id: userId}});
    const isAuthorized = (user?.role || "").split(",").some((r: string) => r === "admin" || r === "manager");

    if (!user || !isAuthorized) {
        return reply.status(401).send('unauthorized');
    }
    return user;
}

export async function registerAdminRoutes(app: FastifyInstance) {
    app.post('/v1/admin/users/:id/role', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {id} = req.params as { id: string };
        const {roles} = (req.body ?? {}) as { roles: string[] };

        if (!Array.isArray(roles)) {
            return reply.status(400).send('Invalid roles');
        }

        const user = await prisma.user.update({
            where: {id},
            data: {
                role: roles.join(',')
            }
        });

        const hideEmails = process.env.HIDE_EMAILS_IN_ADMIN === "true";
        if (hideEmails && user.email) {
            const [localPart, domain] = user.email.split('@');
            if (localPart && domain) {
                const visibleLength = Math.min(3, Math.floor(localPart.length / 2));
                user.email = `${localPart.substring(0, visibleLength)}***@${domain}`;
            } else {
                user.email = "***";
            }
        }

        // @ts-ignore
        delete user.password;
        // @ts-ignore
        delete user.twoFactorSecret;

        return reply.send({user});
    });
}
