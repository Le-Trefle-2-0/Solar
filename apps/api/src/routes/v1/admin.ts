import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';

async function checkAdmin(req: any, reply: any) {
    const userId = await authenticate(req);

    if (!userId) {
        return reply.status(401).send('unauthorized');
    }

    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
        return reply.status(401).send('unauthorized');
    }

    const userRoles = (user.role || "").split(",").map((r: string) => r.trim());
    const isAuthorized = userRoles.includes("admin") || userRoles.includes("manager");

    if (!isAuthorized) {
        return reply.status(401).send('unauthorized');
    }
    return user;
}

export async function registerAdminRoutes(app: FastifyInstance) {
    app.get('/v1/admin/roles', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const roles = await prisma.role.findMany({
            orderBy: {weight: 'desc'}
        });
        return reply.send({roles});
    });

    app.post('/v1/admin/roles', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {name, permissions, weight, icon} = req.body as {
            name: string,
            permissions: string,
            weight: number,
            icon?: string
        };

        // Hierarchy check: Non-admins can only manage roles with lower weight than their own highest role
        const userRoles = (admin.role || "").split(",");
        if (!userRoles.includes("admin")) {
            const adminHighestRole = await prisma.role.findFirst({
                where: {name: {in: userRoles}},
                orderBy: {weight: 'desc'}
            });

            if (!adminHighestRole || weight >= adminHighestRole.weight) {
                return reply.status(403).send('forbidden: cannot manage roles of equal or higher weight');
            }

            // Check permissions: cannot grant permissions the admin doesn't have
            const adminPerms = JSON.parse(adminHighestRole.permissions || "[]") as string[];
            const requestedPerms = JSON.parse(permissions || "[]") as string[];
            if (requestedPerms.some(p => !adminPerms.includes(p))) {
                return reply.status(403).send('forbidden: cannot grant permissions you do not have');
            }
        }

        const role = await prisma.role.upsert({
            where: {name},
            update: {permissions, weight, icon},
            create: {name, permissions, weight, icon}
        });

        return reply.send({role});
    });

    app.delete('/v1/admin/roles/:id', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {id} = req.params as { id: string };

        const roleToDelete = await prisma.role.findUnique({where: {id}});
        if (!roleToDelete) return reply.status(404).send('role not found');

        // Hierarchy check
        const userRoles = (admin.role || "").split(",");
        if (!userRoles.includes("admin")) {
            const adminHighestRole = await prisma.role.findFirst({
                where: {name: {in: userRoles}},
                orderBy: {weight: 'desc'}
            });

            if (!adminHighestRole || roleToDelete.weight >= adminHighestRole.weight) {
                return reply.status(403).send('forbidden: cannot delete roles of equal or higher weight');
            }
        }

        await prisma.role.delete({where: {id}});
        return reply.send({success: true});
    });
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

    app.get('/v1/admin/settings', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        try {
            // @ts-ignore
            const settings = await prisma.settings.findMany();
            return reply.send({settings});
        } catch (e) {
            console.error("[Settings] Failed to fetch settings in API:", e);
            return reply.send({settings: []});
        }
    });

    app.post('/v1/admin/settings', async (req, reply) => {
        const admin = await checkAdmin(req, reply);
        if (!admin) return;

        const {key, value} = req.body as { key: string, value: string };

        try {
            // @ts-ignore
            const setting = await prisma.settings.upsert({
                where: {key},
                update: {value},
                create: {key, value}
            });

            return reply.send({setting});
        } catch (e) {
            console.error("[Settings] Failed to upsert setting in API:", e);
            return reply.status(500).send('failed to update setting');
        }
    });
}
