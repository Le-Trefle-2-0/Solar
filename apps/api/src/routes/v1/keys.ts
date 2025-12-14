import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {prisma} from '../../prisma.js';

export async function registerKeysRoutes(app: FastifyInstance) {
    const bodySchema = z.object({key: z.string().min(1)});

    app.post('/v1/keys/check', async (req, reply) => {
        try {
            const parsed = bodySchema.parse((req.body ?? {}) as any);
            const key = await prisma.apikey.findFirst({where: {key: parsed.key}});
            const now = new Date();
            const valid = !!key && (key.enabled !== false) && (!key.expiresAt || key.expiresAt > now);
            return reply.send({valid, key: valid ? {id: key!.id, userId: key!.userId} : null});
        } catch (e) {
            return reply.status(400).send({valid: false, error: 'invalid_body'});
        }
    });
}
