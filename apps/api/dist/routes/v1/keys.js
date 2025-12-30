import { z } from 'zod';
import { prisma } from '../../prisma.js';
export async function registerKeysRoutes(app) {
    const bodySchema = z.object({ key: z.string().min(1) });
    app.post('/v1/keys/check', async (req, reply) => {
        try {
            const parsed = bodySchema.parse((req.body ?? {}));
            const key = await prisma.apikey.findFirst({ where: { key: parsed.key } });
            const now = new Date();
            const valid = !!key && (key.enabled !== false) && (!key.expiresAt || key.expiresAt > now);
            let user = null;
            if (valid && key) {
                user = await prisma.user.findUnique({ where: { id: key.userId } });
            }
            return reply.send({ valid, key: valid ? key : null, user });
        }
        catch (e) {
            return reply.status(400).send({ valid: false, error: 'invalid_body' });
        }
    });
    // Alias for bot compatibility or legacy
    app.post('/check-key', async (req, reply) => {
        try {
            const body = (req.body ?? {});
            const keyString = body.key || '';
            if (!keyString)
                return reply.status(400).send({ error: 'missing_key' });
            const key = await prisma.apikey.findFirst({ where: { key: keyString } });
            const now = new Date();
            const valid = !!key && (key.enabled !== false) && (!key.expiresAt || key.expiresAt > now);
            if (!valid || !key) {
                return reply.status(401).send({ error: 'invalid_key' });
            }
            const user = await prisma.user.findUnique({ where: { id: key.userId } });
            if (!user)
                return reply.status(404).send({ error: 'user_not_found' });
            return reply.send({ user });
        }
        catch (e) {
            return reply.status(500).send({ error: 'internal_error' });
        }
    });
}
