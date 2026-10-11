import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../prisma.js';
import { INTERNAL_API_SECRET } from '../../env.js';

export async function registerKeysRoutes(app: FastifyInstance) {
    const bodySchema = z.object({ key: z.string().min(1) });

    // Configuration du rate-limit agressif (par IP automatiquement)
        const rateLimitConfig = {
            config: {
                rateLimit: {
                    max: 5,               // 5 requêtes autorisées...
                    timeWindow: '1 minute', // ...par fenêtre de 1 minute.
                    ban: 10               // Verrouillage : Si une IP s'acharne et fait 10 requêtes bloquées de suite,
                }
            }
        };

    // Middleware d'authentification (Service-to-Service)
    const requireInternalAuth = async (req: any, reply: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
            return reply.status(401).send({ error: 'unauthorized' });
        }
    };

    app.post('/v1/keys/check', {
        ...rateLimitConfig,
        preHandler: [requireInternalAuth]
    }, async (req, reply) => {
        try {
            const parsed = bodySchema.parse((req.body ?? {}) as any);

            // Sélection restreinte pour l'API Key
            const key = await prisma.apikey.findFirst({
                where: { key: parsed.key },
                select: { id: true, enabled: true, expiresAt: true, userId: true }
            });

            const now = new Date();
            const valid = !!key && (key.enabled !== false) && (!key.expiresAt || key.expiresAt > now);

            let user = null;
            if (valid && key) {
                // Filtre Prisma strict
                user = await prisma.user.findUnique({
                    where: { id: key.userId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true
                    }
                });
            }

            return reply.send({ valid, key: valid ? { id: key?.id, userId: key?.userId } : null, user });
        } catch (e) {
            return reply.status(400).send({ valid: false, error: 'invalid_body' });
        }
    });


    app.post('/check-key', {
        ...rateLimitConfig,
        preHandler: [requireInternalAuth]
    }, async (req, reply) => {
        try {
            const body = (req.body ?? {}) as { key?: string };
            const keyString = body.key || '';
            if (!keyString) return reply.status(400).send({ error: 'missing_key' });

            const key = await prisma.apikey.findFirst({
                where: { key: keyString },
                select: { id: true, enabled: true, expiresAt: true, userId: true }
            });

            const now = new Date();
            const valid = !!key && (key.enabled !== false) && (!key.expiresAt || key.expiresAt > now);

            if (!valid || !key) {
                return reply.status(401).send({ error: 'invalid_key' });
            }

            // Filtre Prisma strict
            const user = await prisma.user.findUnique({
                where: { id: key.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    image: true
                }
            });

            if (!user) return reply.status(404).send({ error: 'user_not_found' });

            return reply.send({ user });
        } catch (e) {
            return reply.status(500).send({ error: 'internal_error' });
        }
    });
}
