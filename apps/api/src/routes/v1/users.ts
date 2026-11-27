import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {getUserPermissions, hasPermission} from '../../lib/permissions.js';

/**
 * Only these fields may ever be returned by GET /v1/users/:id.
 * Never add `email`, `password`, `twoFactorSecret`, address/identity/document fields here.
 */
export const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    image: true,
    role: true,
    displayUsername: true,
} as const;

export interface UsersRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    findUser: (id: string) => Promise<Record<string, unknown> | null>;
    getPermissions: (userId: string) => Promise<string[]>;
}

const defaultDeps: UsersRouteDeps = {
    authenticate,
    findUser: (id) => prisma.user.findUnique({where: {id}, select: PUBLIC_USER_SELECT}),
    getPermissions: getUserPermissions,
};

export async function registerUsersRoutes(app: FastifyInstance, deps: UsersRouteDeps = defaultDeps) {
    app.get('/v1/users/:id', async (req, reply) => {
        const userId = await deps.authenticate(req);
        if (!userId) return reply.status(401).send('unauthorized');

        const {id} = req.params as {id: string};

        // Reading a third-party profile requires users.read_all (own profile is always allowed).
        if (id !== userId) {
            const perms = await deps.getPermissions(userId);
            if (!hasPermission(perms, 'users.read_all')) {
                return reply.status(403).send({error: 'forbidden'});
            }
        }

        const user = await deps.findUser(id);
        if (!user) return reply.status(404).send({error: 'not_found'});
        return user;
    });
}
