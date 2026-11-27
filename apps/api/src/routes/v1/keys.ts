import type {FastifyInstance, FastifyRequest} from 'fastify';
import {z} from 'zod';
import {isInternal} from '../../lib/internalAuth.js';
import {prisma} from '../../prisma.js';
import {getActor} from '../../lib/permissions.js';

/** The only fields these routes may read. Never add `key`, `password` or `twoFactorSecret`. */
export const KEY_SELECT = {id: true, enabled: true, expiresAt: true, userId: true} as const;
export const KEY_USER_SELECT = {id: true, name: true, email: true, role: true, image: true} as const;

export interface KeysRouteDeps {
    findKey: (key: string) => Promise<{id: string; enabled: boolean | null; expiresAt: Date | null; userId: string} | null>;
    findUser: (id: string) => Promise<Record<string, unknown> | null>;
    /** The account behind the key may still act (not banned or closed, #249). */
    isActive?: (userId: string) => Promise<boolean>;
}

const defaultDeps: KeysRouteDeps = {
    findKey: (key) => prisma.apikey.findFirst({where: {key}, select: KEY_SELECT}),
    findUser: (id) => prisma.user.findUnique({where: {id}, select: KEY_USER_SELECT}),
    isActive: async (userId) => !!(await getActor(userId)),
};

export async function registerKeysRoutes(app: FastifyInstance, deps: KeysRouteDeps = defaultDeps) {
    const bodySchema = z.object({key: z.string().min(1)});

    const options = {
        // 5 attempts per minute and per IP, then a ban. Internal services are exempt:
        // all bot connections reach these routes from the same address.
        config: {rateLimit: {max: 5, timeWindow: '1 minute', ban: 10, allowList: (req: FastifyRequest) => isInternal(req)}},
        preHandler: async (req: FastifyRequest, reply: any) => {
            if (!isInternal(req)) return reply.status(401).send({error: 'unauthorized'});
        },
    };

    async function resolveKey(keyString: string) {
        const key = await deps.findKey(keyString);
        const valid = !!key && key.enabled !== false && (!key.expiresAt || key.expiresAt > new Date())
            && (!deps.isActive || await deps.isActive(key.userId));
        return valid ? key : null;
    }

    app.post('/v1/keys/check', options, async (req, reply) => {
        try {
            const parsed = bodySchema.parse((req.body ?? {}) as any);
            const key = await resolveKey(parsed.key);
            const user = key ? await deps.findUser(key.userId) : null;

            return reply.send({valid: !!key, key: key ? {id: key.id, userId: key.userId} : null, user});
        } catch (e) {
            return reply.status(400).send({valid: false, error: 'invalid_body'});
        }
    });

    // Alias for bot compatibility or legacy
    app.post('/check-key', options, async (req, reply) => {
        try {
            const body = (req.body ?? {}) as { key?: string };
            const keyString = body.key || '';
            if (!keyString) return reply.status(400).send({error: 'missing_key'});

            const key = await resolveKey(keyString);
            if (!key) return reply.status(401).send({error: 'invalid_key'});

            const user = await deps.findUser(key.userId);
            if (!user) return reply.status(404).send({error: 'user_not_found'});

            return reply.send({user});
        } catch (e) {
            return reply.status(500).send({error: 'internal_error'});
        }
    });
}
